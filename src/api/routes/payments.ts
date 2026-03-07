// ============================================================
// PAYMENTS ROUTES - Razorpay Integration
// ============================================================
import { Hono } from 'hono';
import { authMiddleware, AuthUser } from '../middleware/auth';
import { generatePaymentNumber, successResponse, errorResponse } from '../utils/helpers';

const payments = new Hono<{ Bindings: { DB: D1Database } }>();

// POST /api/payments/create-order - Create Razorpay Order
payments.post('/create-order', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const { booking_id } = await c.req.json();
    const db = c.env.DB;

    const booking = await db.prepare('SELECT * FROM bookings WHERE id = ? AND student_id = ?').bind(booking_id, user.id).first() as any;
    if (!booking) return c.json(errorResponse('Booking not found'), 404);

    const settings = await db.prepare(`SELECT key, value FROM platform_settings WHERE key IN ('razorpay_key_id', 'razorpay_key_secret')`).all();
    const settingsMap = Object.fromEntries((settings.results as any[]).map(s => [s.key, s.value]));
    
    const keyId = settingsMap['razorpay_key_id'] || 'rzp_test_demo';
    
    // Create Razorpay order (in production, call Razorpay API)
    const orderId = `order_${Date.now()}_${booking_id}`;
    const amountInPaise = Math.round(booking.total_amount * 100);

    // Update payment with order ID
    await db.prepare(`
      UPDATE payments SET gateway_order_id = ?, updated_at = datetime('now')
      WHERE booking_id = ?
    `).bind(orderId, booking_id).run();

    return c.json(successResponse({
      order_id: orderId,
      amount: amountInPaise,
      currency: 'INR',
      key_id: keyId,
      booking_number: booking.booking_number,
      description: `Booking ${booking.booking_number}`,
      prefill: {
        name: `${user.first_name} ${user.last_name}`,
        email: user.email
      }
    }, 'Order created'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to create order'), 500);
  }
});

// POST /api/payments/verify - Verify Razorpay payment
payments.post('/verify', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const { booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await c.req.json();
    const db = c.env.DB;

    // In production: verify signature with Razorpay secret
    const isValid = true; // Demo mode

    if (!isValid) return c.json(errorResponse('Payment verification failed'), 400);

    const booking = await db.prepare('SELECT * FROM bookings WHERE id = ?').bind(booking_id).first() as any;
    if (!booking) return c.json(errorResponse('Booking not found'), 404);

    // Update payment
    await db.prepare(`
      UPDATE payments SET 
        gateway_payment_id = ?, gateway_order_id = ?, gateway_signature = ?,
        status = 'success', paid_at = datetime('now'), updated_at = datetime('now')
      WHERE booking_id = ?
    `).bind(razorpay_payment_id, razorpay_order_id, razorpay_signature, booking_id).run();

    // Confirm booking
    await db.prepare(`UPDATE bookings SET status = 'confirmed', updated_at = datetime('now') WHERE id = ?`).bind(booking_id).run();

    // Update seat status
    await db.prepare(`UPDATE seats SET status = 'occupied', updated_at = datetime('now') WHERE id = ?`).bind(booking.seat_id).run();
    await db.prepare('UPDATE abhyasikas SET available_seats = MAX(0, available_seats - 1) WHERE id = ?').bind(booking.abhyasika_id).run();

    // Notification
    await db.prepare(`
      INSERT INTO notifications (user_id, type, title, message)
      VALUES (?, 'payment_success', 'Payment Successful!', 'Your seat has been booked successfully.')
    `).bind(user.id).run();

    // Log analytics
    await db.prepare(`
      INSERT INTO analytics_events (user_id, event_type, entity_type, entity_id, metadata)
      VALUES (?, 'payment_success', 'booking', ?, ?)
    `).bind(user.id, booking_id, JSON.stringify({ amount: booking.total_amount })).run();

    return c.json(successResponse({
      booking_number: booking.booking_number,
      payment_id: razorpay_payment_id
    }, 'Payment verified and booking confirmed'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Payment verification failed'), 500);
  }
});

// GET /api/payments/history
payments.get('/history', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const db = c.env.DB;

    const results = await db.prepare(`
      SELECT p.*, b.booking_number, a.name as abhyasika_name
      FROM payments p
      JOIN bookings b ON b.id = p.booking_id
      JOIN abhyasikas a ON a.id = b.abhyasika_id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT 50
    `).bind(user.id).all();

    return c.json(successResponse(results.results, 'Payment history'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch payment history'), 500);
  }
});

// POST /api/payments/refund
payments.post('/refund', authMiddleware, async (c) => {
  try {
    const { payment_id, reason } = await c.req.json();
    const db = c.env.DB;

    const payment = await db.prepare('SELECT * FROM payments WHERE id = ?').bind(payment_id).first() as any;
    if (!payment) return c.json(errorResponse('Payment not found'), 404);

    // In production: initiate Razorpay refund
    const gatewayRefundId = `rfnd_${Date.now()}`;

    await db.prepare(`
      INSERT INTO refunds (payment_id, booking_id, amount, reason, gateway_refund_id, status, processed_at)
      VALUES (?, ?, ?, ?, ?, 'completed', datetime('now'))
    `).bind(payment_id, payment.booking_id, payment.amount, reason, gatewayRefundId).run();

    await db.prepare(`UPDATE payments SET status = 'refunded' WHERE id = ?`).bind(payment_id).run();

    return c.json(successResponse({ refund_id: gatewayRefundId }, 'Refund initiated'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to process refund'), 500);
  }
});

export default payments;
