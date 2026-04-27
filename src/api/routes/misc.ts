// ============================================================
// REVIEWS, NOTIFICATIONS, USERS, MISC ROUTES
// ============================================================
import { Hono } from 'hono';
import { authMiddleware, AuthUser } from '../middleware/auth';
import { successResponse, errorResponse, paginationMeta } from '../utils/helpers';

const misc = new Hono<{ Bindings: { DB: D1Database } }>();

// ===================== REVIEWS =====================
// GET /api/reviews/abhyasika/:id
misc.get('/reviews/abhyasika/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = (page - 1) * limit;
    const db = c.env.DB;

    const reviews = await db.prepare(`
      SELECT r.*, u.first_name, u.last_name, u.avatar_url
      FROM reviews r JOIN users u ON u.id = r.student_id
      WHERE r.abhyasika_id = ? AND r.is_approved = 1
      ORDER BY r.created_at DESC LIMIT ? OFFSET ?
    `).bind(id, limit, offset).all();

    const stats = await db.prepare(`
      SELECT AVG(overall_rating) as avg_rating, COUNT(*) as total,
        COUNT(CASE WHEN overall_rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN overall_rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN overall_rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN overall_rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN overall_rating = 1 THEN 1 END) as one_star
      FROM reviews WHERE abhyasika_id = ? AND is_approved = 1
    `).bind(id).first();

    return c.json(successResponse({ reviews: reviews.results, stats }));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch reviews'), 500);
  }
});

// POST /api/reviews
misc.post('/reviews', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    if (user.role !== 'student') return c.json(errorResponse('Only students can review'), 403);

    const body = await c.req.json();
    const { abhyasika_id, booking_id, overall_rating, cleanliness_rating, facilities_rating, value_rating, staff_rating, title, review_text } = body;
    const db = c.env.DB;

    const existing = await db.prepare('SELECT id FROM reviews WHERE abhyasika_id = ? AND student_id = ?').bind(abhyasika_id, user.id).first();
    if (existing) return c.json(errorResponse('Already reviewed this Abhyasika'), 409);

    const result = await db.prepare(`
      INSERT INTO reviews (abhyasika_id, student_id, booking_id, overall_rating, cleanliness_rating, facilities_rating, value_rating, staff_rating, title, review_text)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(abhyasika_id, user.id, booking_id, overall_rating, cleanliness_rating, facilities_rating, value_rating, staff_rating, title, review_text).run();

    // Update abhyasika rating
    await db.prepare(`
      UPDATE abhyasikas SET 
        rating_avg = (SELECT AVG(overall_rating) FROM reviews WHERE abhyasika_id = ? AND is_approved = 1),
        rating_count = (SELECT COUNT(*) FROM reviews WHERE abhyasika_id = ? AND is_approved = 1)
      WHERE id = ?
    `).bind(abhyasika_id, abhyasika_id, abhyasika_id).run();

    return c.json(successResponse({ id: result.meta.last_row_id }, 'Review submitted'), 201);
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to submit review'), 500);
  }
});

// ===================== NOTIFICATIONS =====================
// GET /api/notifications
misc.get('/notifications', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;
    const db = c.env.DB;

    const notifications = await db.prepare(`
      SELECT * FROM notifications WHERE user_id = ?
      ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).bind(user.id, limit, offset).all();

    const unread = await db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').bind(user.id).first() as any;

    return c.json(successResponse({
      notifications: notifications.results,
      unread_count: unread?.count || 0
    }));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch notifications'), 500);
  }
});

// PUT /api/notifications/read
misc.put('/notifications/read', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const { ids } = await c.req.json().catch(() => ({ ids: null }));
    const db = c.env.DB;

    if (ids && ids.length > 0) {
      await db.prepare(`UPDATE notifications SET is_read = 1, read_at = datetime('now') WHERE user_id = ? AND id IN (${ids.map(() => '?').join(',')})`).bind(user.id, ...ids).run();
    } else {
      await db.prepare(`UPDATE notifications SET is_read = 1, read_at = datetime('now') WHERE user_id = ?`).bind(user.id).run();
    }

    return c.json(successResponse(null, 'Marked as read'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to update'), 500);
  }
});

// ===================== USER PROFILE =====================
// GET /api/users/profile
misc.get('/users/profile', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const db = c.env.DB;

    const profile = await db.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first() as any;
    
    let extraProfile = null;
    if (user.role === 'student') {
      extraProfile = await db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').bind(user.id).first();
    } else if (user.role === 'owner') {
      extraProfile = await db.prepare('SELECT * FROM owner_profiles WHERE user_id = ?').bind(user.id).first();
    }

    const { password_hash, ...safeProfile } = profile;
    return c.json(successResponse({ ...safeProfile, profile: extraProfile }));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch profile'), 500);
  }
});

// PUT /api/users/profile
misc.put('/users/profile', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const body = await c.req.json();
    const { first_name, last_name, phone, avatar_url } = body;
    const db = c.env.DB;

    await db.prepare('UPDATE users SET first_name=?, last_name=?, phone=?, avatar_url=? WHERE id = ?').bind(first_name, last_name, phone, avatar_url, user.id).run();

    if (user.role === 'student') {
      const { date_of_birth, gender, qualification, exam_preparing, preferred_study_time } = body;
      await db.prepare(`
        UPDATE student_profiles SET date_of_birth=?, gender=?, qualification=?, exam_preparing=?, preferred_study_time=?, updated_at=datetime('now')
        WHERE user_id = ?
      `).bind(date_of_birth, gender, qualification, exam_preparing, preferred_study_time, user.id).run();
    } else if (user.role === 'owner') {
      const { business_name, gst_number, pan_number, bank_account_number, bank_ifsc, upi_id } = body;
      await db.prepare(`
        UPDATE owner_profiles SET business_name=?, gst_number=?, pan_number=?, bank_account_number=?, bank_ifsc=?, upi_id=?, updated_at=datetime('now')
        WHERE user_id = ?
      `).bind(business_name, gst_number, pan_number, bank_account_number, bank_ifsc, upi_id, user.id).run();
    }

    return c.json(successResponse(null, 'Profile updated'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to update profile'), 500);
  }
});

// ===================== WISHLISTS =====================
// POST /api/wishlists/toggle  (alias – frontend client uses /wishlists/toggle)
// NOTE: must be registered BEFORE the generic POST /wishlists route
misc.post('/wishlists/toggle', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const { abhyasika_id } = await c.req.json();
    const db = c.env.DB;

    const existing = await db.prepare('SELECT id FROM wishlists WHERE student_id = ? AND abhyasika_id = ?').bind(user.id, abhyasika_id).first();
    if (existing) {
      await db.prepare('DELETE FROM wishlists WHERE student_id = ? AND abhyasika_id = ?').bind(user.id, abhyasika_id).run();
      return c.json(successResponse({ wishlisted: false }, 'Removed from wishlist'));
    }

    await db.prepare('INSERT INTO wishlists (student_id, abhyasika_id) VALUES (?, ?)').bind(user.id, abhyasika_id).run();
    return c.json(successResponse({ wishlisted: true }, 'Added to wishlist'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to update wishlist'), 500);
  }
});

misc.get('/wishlists', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const db = c.env.DB;
    const items = await db.prepare(`
      SELECT w.id, a.id as abhyasika_id, a.name, a.address, a.rating_avg,
        (SELECT url FROM abhyasika_photos WHERE abhyasika_id = a.id AND is_primary = 1 LIMIT 1) as photo,
        (SELECT MIN(daily_price) FROM seat_categories WHERE abhyasika_id = a.id) as min_price
      FROM wishlists w JOIN abhyasikas a ON a.id = w.abhyasika_id
      WHERE w.student_id = ?
    `).bind(user.id).all();
    return c.json(successResponse(items.results, 'Wishlist'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch wishlist'), 500);
  }
});

misc.post('/wishlists', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const { abhyasika_id } = await c.req.json();
    const db = c.env.DB;

    const existing = await db.prepare('SELECT id FROM wishlists WHERE student_id = ? AND abhyasika_id = ?').bind(user.id, abhyasika_id).first();
    if (existing) {
      await db.prepare('DELETE FROM wishlists WHERE student_id = ? AND abhyasika_id = ?').bind(user.id, abhyasika_id).run();
      return c.json(successResponse(null, 'Removed from wishlist'));
    }

    await db.prepare('INSERT INTO wishlists (student_id, abhyasika_id) VALUES (?, ?)').bind(user.id, abhyasika_id).run();
    return c.json(successResponse(null, 'Added to wishlist'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to update wishlist'), 500);
  }
});

// ===================== COUPONS =====================
misc.post('/coupons/validate', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const { code, amount } = await c.req.json();
    const db = c.env.DB;

    const coupon = await db.prepare(`
      SELECT * FROM coupons WHERE code = ? AND is_active = 1
        AND (valid_from IS NULL OR valid_from <= datetime('now'))
        AND (valid_to IS NULL OR valid_to >= datetime('now'))
    `).bind(code).first() as any;

    if (!coupon) return c.json(errorResponse('Invalid or expired coupon'), 400);
    if (coupon.min_booking_amount && amount < coupon.min_booking_amount) {
      return c.json(errorResponse(`Minimum booking amount: ₹${coupon.min_booking_amount}`), 400);
    }

    let discount = coupon.discount_type === 'percentage' ?
      Math.min((amount * coupon.discount_value) / 100, coupon.max_discount_amount || Infinity) :
      coupon.discount_value;

    return c.json(successResponse({ coupon, discount }, 'Coupon valid'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to validate coupon'), 500);
  }
});

// ===================== CITIES & LOCALITIES =====================
misc.get('/cities', async (c) => {
  try {
    const db = c.env.DB;
    const cities = await db.prepare('SELECT * FROM cities WHERE is_active = 1 ORDER BY name').all();
    return c.json(successResponse(cities.results, 'Cities'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch cities'), 500);
  }
});

misc.get('/cities/:id/localities', async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;
    const localities = await db.prepare('SELECT * FROM localities WHERE city_id = ? AND is_active = 1 ORDER BY name').bind(id).all();
    return c.json(successResponse(localities.results, 'Localities'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch localities'), 500);
  }
});

// ===================== FACILITIES =====================
misc.get('/facilities', async (c) => {
  try {
    const db = c.env.DB;
    const facilities = await db.prepare(`
      SELECT f.*, fc.name as category_name FROM facilities f
      LEFT JOIN facility_categories fc ON fc.id = f.category_id
      ORDER BY fc.sort_order, f.sort_order
    `).all();
    return c.json(successResponse(facilities.results, 'Facilities'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch facilities'), 500);
  }
});

// ===================== SUPPORT TICKETS =====================
misc.post('/support', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const body = await c.req.json();
    // Accept both 'description' and 'message' as the ticket body
    const { category = 'general', subject, description, message, priority = 'medium' } = body;
    const ticketBody = description || message || '';
    const db = c.env.DB;

    if (!subject && !ticketBody) return c.json(errorResponse('Subject or message required'), 400);

    const ticketNumber = `TKT${Date.now().toString(36).toUpperCase()}`;
    const result = await db.prepare(`
      INSERT INTO support_tickets (ticket_number, user_id, category, subject, description, priority)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(ticketNumber, user.id, category, subject || ticketBody, ticketBody, priority).run();

    return c.json(successResponse({ id: result.meta.last_row_id, ticket_number: ticketNumber }, 'Ticket created'), 201);
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to create ticket'), 500);
  }
});

misc.get('/support', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const db = c.env.DB;

    let query = 'SELECT * FROM support_tickets';
    const params: any[] = [];

    if (user.role !== 'super_admin') {
      query += ' WHERE user_id = ?';
      params.push(user.id);
    }

    query += ' ORDER BY created_at DESC LIMIT 20';
    const tickets = await db.prepare(query).bind(...params).all();
    return c.json(successResponse(tickets.results, 'Support tickets'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch tickets'), 500);
  }
});

// ===================== FAQs =====================
misc.get('/faqs', async (c) => {
  try {
    const db = c.env.DB;
    const role = c.req.query('role') || 'all';
    const faqs = await db.prepare(`
      SELECT * FROM faqs WHERE is_active = 1 AND (target_role = 'all' OR target_role = ?)
      ORDER BY category, sort_order
    `).bind(role).all();
    return c.json(successResponse(faqs.results, 'FAQs'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch FAQs'), 500);
  }
});

// ===================== PUBLIC SETTINGS =====================
misc.get('/settings/public', async (c) => {
  try {
    const db = c.env.DB;
    const settings = await db.prepare('SELECT key, value FROM platform_settings WHERE is_public = 1').all();
    const settingsMap = Object.fromEntries((settings.results as any[]).map(s => [s.key, s.value]));
    return c.json(successResponse(settingsMap, 'Public settings'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch settings'), 500);
  }
});

// ===================== PLATFORM STATS (Public) =====================
// Platform stats handler (shared)
async function platformStatsHandler(c: any) {
  try {
    const db = c.env.DB;
    const [abhyasikas, students, cities, bookings] = await Promise.all([
      db.prepare(`SELECT COUNT(*) as count FROM abhyasikas WHERE status = 'approved'`).first(),
      db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'student'`).first(),
      db.prepare(`SELECT COUNT(*) as count FROM cities WHERE is_active = 1`).first(),
      db.prepare(`SELECT COUNT(*) as count FROM bookings WHERE status IN ('confirmed','completed')`).first(),
    ]);
    return c.json(successResponse({
      abhyasikas: (abhyasikas as any)?.count || 0,
      students: (students as any)?.count || 0,
      cities: (cities as any)?.count || 0,
      bookings: (bookings as any)?.count || 0,
    }, 'Platform stats'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch stats'), 500);
  }
}

// GET /api/stats  (original)
misc.get('/stats', platformStatsHandler);

// GET /api/stats/platform  (alias – frontend client calls /api/stats/platform)
misc.get('/stats/platform', platformStatsHandler);

// ===================== EXTRA ALIAS ROUTES =====================

// GET /api/abhyasikas/:id/reviews  (alias for frontend that uses this path)
misc.get('/abhyasikas/:id/reviews', async (c) => {
  try {
    const id = c.req.param('id');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = (page - 1) * limit;
    const db = c.env.DB;

    const reviews = await db.prepare(`
      SELECT r.*, u.first_name, u.last_name, u.avatar_url
      FROM reviews r JOIN users u ON u.id = r.student_id
      WHERE r.abhyasika_id = ? AND r.is_approved = 1
      ORDER BY r.created_at DESC LIMIT ? OFFSET ?
    `).bind(id, limit, offset).all();

    const stats = await db.prepare(`
      SELECT AVG(overall_rating) as avg_rating, COUNT(*) as total,
        COUNT(CASE WHEN overall_rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN overall_rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN overall_rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN overall_rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN overall_rating = 1 THEN 1 END) as one_star
      FROM reviews WHERE abhyasika_id = ? AND is_approved = 1
    `).bind(id).first();

    return c.json(successResponse({ reviews: reviews.results, stats }));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch reviews'), 500);
  }
});

// GET /api/seats/categories  (query param version: ?abhyasika_id=X)
misc.get('/seats/categories', async (c) => {
  try {
    const abhyasika_id = c.req.query('abhyasika_id');
    if (!abhyasika_id) return c.json(errorResponse('abhyasika_id required'), 400);
    const db = c.env.DB;

    const categories = await db.prepare(`
      SELECT sc.*, COUNT(s.id) as total_seats,
        COUNT(CASE WHEN s.status = 'available' AND s.is_active = 1 THEN 1 END) as available_seats
      FROM seat_categories sc
      LEFT JOIN seats s ON s.category_id = sc.id AND s.is_active = 1
      WHERE sc.abhyasika_id = ?
      GROUP BY sc.id ORDER BY sc.name
    `).bind(abhyasika_id).all();
    return c.json(successResponse(categories.results, 'Seat categories'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch categories'), 500);
  }
});

// GET /api/seats  (query param version: ?abhyasika_id=X)
misc.get('/seats', async (c) => {
  try {
    const abhyasika_id = c.req.query('abhyasika_id');
    const db = c.env.DB;
    let query = `SELECT s.*, sc.name as category_name, sc.daily_price, sc.monthly_price
      FROM seats s LEFT JOIN seat_categories sc ON sc.id = s.category_id
      WHERE s.is_active = 1`;
    const binds: any[] = [];
    if (abhyasika_id) { query += ' AND s.abhyasika_id = ?'; binds.push(abhyasika_id); }
    query += ' ORDER BY s.seat_number LIMIT 100';
    const seats = binds.length ? await db.prepare(query).bind(...binds).all() : await db.prepare(query).all();
    return c.json(successResponse(seats.results, 'Seats'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch seats'), 500);
  }
});

export default misc;
