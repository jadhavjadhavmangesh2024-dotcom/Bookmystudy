// ============================================================
// BOOKINGS ROUTES - Create, Manage, Cancel Bookings
// ============================================================
import { Hono } from 'hono';
import { authMiddleware, requireOwner, AuthUser } from '../middleware/auth';
import { generateBookingNumber, generatePaymentNumber, calculateBookingAmount, successResponse, errorResponse, paginationMeta } from '../utils/helpers';

const bookings = new Hono<{ Bindings: { DB: D1Database } }>();

// GET /api/bookings - Student's bookings
bookings.get('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = (page - 1) * limit;
    const status = c.req.query('status');
    const db = c.env.DB;

    let where = 'b.student_id = ?';
    const params: any[] = [user.id];

    if (status) { where += ' AND b.status = ?'; params.push(status); }

    const results = await db.prepare(`
      SELECT b.*, a.name as abhyasika_name, a.address, a.city_id,
        s.seat_number, s.seat_label,
        c.name as city_name,
        (SELECT url FROM abhyasika_photos WHERE abhyasika_id = a.id AND is_primary = 1 LIMIT 1) as abhyasika_photo
      FROM bookings b
      JOIN abhyasikas a ON a.id = b.abhyasika_id
      JOIN seats s ON s.id = b.seat_id
      LEFT JOIN cities c ON c.id = a.city_id
      WHERE ${where}
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all();

    const count = await db.prepare(`SELECT COUNT(*) as total FROM bookings b WHERE ${where}`).bind(...params).first() as any;

    return c.json(successResponse(results.results, 'Bookings fetched', paginationMeta(count?.total || 0, page, limit)));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch bookings'), 500);
  }
});

// GET /api/bookings/:id
bookings.get('/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const id = c.req.param('id');
    const db = c.env.DB;

    const booking = await db.prepare(`
      SELECT b.*, a.name as abhyasika_name, a.address, a.phone as abhyasika_phone,
        s.seat_number, s.seat_label,
        c.name as city_name, l.name as locality_name,
        u.first_name as student_first_name, u.last_name as student_last_name,
        u.email as student_email, u.phone as student_phone,
        p.payment_number, p.gateway_payment_id, p.status as payment_status, p.paid_at
      FROM bookings b
      JOIN abhyasikas a ON a.id = b.abhyasika_id
      JOIN seats s ON s.id = b.seat_id
      LEFT JOIN cities c ON c.id = a.city_id
      LEFT JOIN localities l ON l.id = a.locality_id
      JOIN users u ON u.id = b.student_id
      LEFT JOIN payments p ON p.booking_id = b.id
      WHERE (b.id = ? OR b.booking_number = ?)
        AND (b.student_id = ? OR ? IN ('super_admin', 'owner'))
    `).bind(id, id, user.id, user.role).first();

    if (!booking) return c.json(errorResponse('Booking not found'), 404);

    return c.json(successResponse(booking));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch booking'), 500);
  }
});

// POST /api/bookings - Create booking
bookings.post('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    if (user.role !== 'student') return c.json(errorResponse('Only students can book'), 403);

    const body = await c.req.json();
    const { abhyasika_id, seat_id, booking_type, start_date, end_date, coupon_code } = body;
    const db = c.env.DB;

    if (!abhyasika_id || !seat_id || !booking_type || !start_date || !end_date) {
      return c.json(errorResponse('Missing required fields'), 400);
    }

    // Check seat availability
    const conflict = await db.prepare(`
      SELECT id FROM bookings 
      WHERE seat_id = ? AND status IN ('confirmed', 'pending')
        AND start_date <= ? AND end_date >= ?
    `).bind(seat_id, end_date, start_date).first();

    if (conflict) return c.json(errorResponse('Seat is not available for selected dates'), 409);

    // Get seat pricing
    const seat = await db.prepare(`
      SELECT s.*, sc.daily_price, sc.weekly_price, sc.monthly_price, sc.name as category_name
      FROM seats s
      JOIN seat_categories sc ON sc.id = s.category_id
      WHERE s.id = ? AND s.abhyasika_id = ? AND s.is_active = 1 AND s.status = 'available'
    `).bind(seat_id, abhyasika_id).first() as any;

    if (!seat) return c.json(errorResponse('Seat not available'), 400);

    // Calculate days and amount
    const startD = new Date(start_date);
    const endD = new Date(end_date);
    const totalDays = Math.ceil((endD.getTime() - startD.getTime()) / 86400000) + 1;

    let baseAmount = 0;
    if (booking_type === 'daily') baseAmount = seat.daily_price * totalDays;
    else if (booking_type === 'weekly') baseAmount = seat.weekly_price * Math.ceil(totalDays / 7);
    else if (booking_type === 'monthly') baseAmount = seat.monthly_price * Math.ceil(totalDays / 30);

    // Platform commission
    const commissionSetting = await db.prepare('SELECT commission_value FROM commission_settings WHERE is_active = 1 ORDER BY id DESC LIMIT 1').first() as any;
    const commissionRate = commissionSetting?.commission_value || 10;
    const platformFee = (baseAmount * commissionRate) / 100;
    const taxAmount = baseAmount * 0.18; // 18% GST
    const totalAmount = baseAmount + taxAmount;

    // Check coupon
    let discountAmount = 0;
    let couponDiscount = 0;
    if (coupon_code) {
      const coupon = await db.prepare(`
        SELECT * FROM coupons WHERE code = ? AND is_active = 1 
          AND (valid_from IS NULL OR valid_from <= datetime('now'))
          AND (valid_to IS NULL OR valid_to >= datetime('now'))
      `).bind(coupon_code).first() as any;

      if (coupon) {
        if (coupon.discount_type === 'percentage') {
          couponDiscount = Math.min((baseAmount * coupon.discount_value) / 100, coupon.max_discount_amount || Infinity);
        } else {
          couponDiscount = coupon.discount_value;
        }
      }
    }

    const finalAmount = Math.max(0, totalAmount - couponDiscount);
    const bookingNumber = generateBookingNumber();

    const result = await db.prepare(`
      INSERT INTO bookings (booking_number, student_id, abhyasika_id, seat_id, category_id,
        booking_type, start_date, end_date, total_days, base_amount, discount_amount,
        coupon_code, coupon_discount, platform_fee, tax_amount, total_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(bookingNumber, user.id, abhyasika_id, seat_id, seat.category_id,
      booking_type, start_date, end_date, totalDays, baseAmount, discountAmount,
      coupon_code, couponDiscount, platformFee, taxAmount, finalAmount).run();

    const bookingId = result.meta.last_row_id;

    // Create payment record
    const paymentNumber = generatePaymentNumber();
    await db.prepare(`
      INSERT INTO payments (payment_number, booking_id, user_id, amount, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).bind(paymentNumber, bookingId, user.id, finalAmount).run();

    // Log history
    await db.prepare(`
      INSERT INTO booking_history (booking_id, new_status, changed_by, reason)
      VALUES (?, 'pending', ?, 'Booking created')
    `).bind(bookingId, user.id).run();

    return c.json(successResponse({
      booking_id: bookingId,
      booking_number: bookingNumber,
      payment_number: paymentNumber,
      amount: finalAmount,
      tax_amount: taxAmount,
      coupon_discount: couponDiscount
    }, 'Booking created'), 201);
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to create booking'), 500);
  }
});

// POST /api/bookings/:id/confirm - Confirm after payment
bookings.post('/:id/confirm', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const { payment_id, gateway_payment_id, gateway_signature } = await c.req.json();
    const db = c.env.DB;

    const booking = await db.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first() as any;
    if (!booking) return c.json(errorResponse('Booking not found'), 404);

    // Update booking status
    await db.prepare(`UPDATE bookings SET status = 'confirmed', updated_at = datetime('now') WHERE id = ?`).bind(id).run();

    // Update payment
    await db.prepare(`
      UPDATE payments SET status = 'success', gateway_payment_id = ?, gateway_signature = ?, paid_at = datetime('now')
      WHERE booking_id = ?
    `).bind(gateway_payment_id, gateway_signature, id).run();

    // Mark seat as occupied
    await db.prepare(`UPDATE seats SET status = 'occupied', updated_at = datetime('now') WHERE id = ?`).bind(booking.seat_id).run();
    await db.prepare('UPDATE abhyasikas SET available_seats = available_seats - 1 WHERE id = ?').bind(booking.abhyasika_id).run();

    // Log history
    await db.prepare(`INSERT INTO booking_history (booking_id, old_status, new_status, reason) VALUES (?, 'pending', 'confirmed', 'Payment received')`).bind(id).run();

    // Notification
    await db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, channel)
      VALUES (?, 'booking_confirmed', 'Booking Confirmed!', 'Your booking has been confirmed. Enjoy your study session!', 'app')
    `).bind(booking.student_id).run();

    return c.json(successResponse(null, 'Booking confirmed'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to confirm booking'), 500);
  }
});

// POST /api/bookings/:id/cancel
bookings.post('/:id/cancel', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const id = c.req.param('id');
    const { reason } = await c.req.json();
    const db = c.env.DB;

    const booking = await db.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first() as any;
    if (!booking) return c.json(errorResponse('Not found'), 404);

    if (booking.student_id !== user.id && user.role !== 'super_admin') {
      return c.json(errorResponse('Unauthorized'), 403);
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return c.json(errorResponse('Booking cannot be cancelled'), 400);
    }

    await db.prepare(`
      UPDATE bookings SET status = 'cancelled', cancellation_reason = ?, cancelled_at = datetime('now'), cancelled_by = ?
      WHERE id = ?
    `).bind(reason || 'User cancelled', user.id, id).run();

    // Free up seat
    await db.prepare(`UPDATE seats SET status = 'available', updated_at = datetime('now') WHERE id = ?`).bind(booking.seat_id).run();
    await db.prepare('UPDATE abhyasikas SET available_seats = available_seats + 1 WHERE id = ?').bind(booking.abhyasika_id).run();

    await db.prepare(`INSERT INTO booking_history (booking_id, old_status, new_status, changed_by, reason) VALUES (?, ?, 'cancelled', ?, ?)`).bind(id, booking.status, user.id, reason || 'User cancelled').run();

    return c.json(successResponse(null, 'Booking cancelled'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to cancel booking'), 500);
  }
});

// GET /api/bookings/owner/all - Owner sees all bookings for their abhyasikas
bookings.get('/owner/all', authMiddleware, requireOwner(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;
    const status = c.req.query('status');
    const abhyasikaId = c.req.query('abhyasika_id');
    const db = c.env.DB;

    let where = 'a.owner_id = ?';
    const params: any[] = [user.id];

    if (status) { where += ' AND b.status = ?'; params.push(status); }
    if (abhyasikaId) { where += ' AND b.abhyasika_id = ?'; params.push(abhyasikaId); }

    const results = await db.prepare(`
      SELECT b.*, a.name as abhyasika_name, s.seat_number,
        u.first_name, u.last_name, u.phone as student_phone
      FROM bookings b
      JOIN abhyasikas a ON a.id = b.abhyasika_id
      JOIN seats s ON s.id = b.seat_id
      JOIN users u ON u.id = b.student_id
      WHERE ${where}
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all();

    const count = await db.prepare(`
      SELECT COUNT(*) as total FROM bookings b JOIN abhyasikas a ON a.id = b.abhyasika_id WHERE ${where}
    `).bind(...params).first() as any;

    return c.json(successResponse(results.results, 'Bookings', paginationMeta(count?.total || 0, page, limit)));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch bookings'), 500);
  }
});

// POST /api/bookings/:id/checkin
bookings.post('/:id/checkin', authMiddleware, requireOwner(), async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;
    await db.prepare(`UPDATE bookings SET check_in_at = datetime('now') WHERE id = ?`).bind(id).run();
    return c.json(successResponse(null, 'Check-in recorded'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to check in'), 500);
  }
});

// POST /api/bookings/:id/checkout
bookings.post('/:id/checkout', authMiddleware, requireOwner(), async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;
    await db.prepare(`UPDATE bookings SET check_out_at = datetime('now'), status = 'completed' WHERE id = ?`).bind(id).run();
    return c.json(successResponse(null, 'Check-out recorded'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to check out'), 500);
  }
});

export default bookings;
