// ============================================================
// ABHYASIKA ROUTES - CRUD, Search, Nearby
// ============================================================
import { Hono } from 'hono';
import { authMiddleware, requireOwner, AuthUser } from '../middleware/auth';
import { generateUUID, createSlug, successResponse, errorResponse, paginationMeta, calculateDistance } from '../utils/helpers';

const abhyasikas = new Hono<{ Bindings: { DB: D1Database } }>();

// ── Helper: verify owner of an abhyasika ──────────────────────
async function verifyOwnership(db: D1Database, abhyasikaId: string | number, userId: number, role: string) {
  const row = await db.prepare('SELECT owner_id FROM abhyasikas WHERE id = ?').bind(abhyasikaId).first() as any;
  if (!row) return { ok: false, notFound: true };
  if (role === 'super_admin') return { ok: true, notFound: false };
  if (row.owner_id !== userId) return { ok: false, notFound: false };
  return { ok: true, notFound: false };
}

// GET /api/abhyasikas - Public search/list (approved only)
abhyasikas.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '12');
    const offset = (page - 1) * limit;
    const search = c.req.query('search') || '';
    const cityId = c.req.query('city_id');
    const localityId = c.req.query('locality_id');
    const sortBy = c.req.query('sort_by') || 'rating';
    const lat = parseFloat(c.req.query('lat') || '0');
    const lng = parseFloat(c.req.query('lng') || '0');
    const radius = parseFloat(c.req.query('radius') || '10');

    let where = "a.status = 'approved' AND a.is_active = 1";
    const params: any[] = [];

    if (search) {
      where += ` AND (a.name LIKE ? OR a.address LIKE ? OR a.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (cityId) { where += ` AND a.city_id = ?`; params.push(cityId); }
    if (localityId) { where += ` AND a.locality_id = ?`; params.push(localityId); }

    let orderClause = 'a.rating_avg DESC, a.total_bookings DESC';
    if (sortBy === 'price_asc') orderClause = 'min_price ASC';
    if (sortBy === 'price_desc') orderClause = 'min_price DESC';
    if (sortBy === 'newest') orderClause = 'a.created_at DESC';
    if (sortBy === 'rating') orderClause = 'a.rating_avg DESC';

    const query = `
      SELECT a.*,
        c.name as city_name, l.name as locality_name,
        (SELECT url FROM abhyasika_photos WHERE abhyasika_id = a.id AND is_primary = 1 LIMIT 1) as primary_photo,
        (SELECT MIN(sc.daily_price) FROM seat_categories sc WHERE sc.abhyasika_id = a.id AND sc.is_active = 1) as min_price,
        (SELECT GROUP_CONCAT(f.name, ',') FROM abhyasika_facilities af JOIN facilities f ON f.id = af.facility_id WHERE af.abhyasika_id = a.id LIMIT 8) as facility_names
      FROM abhyasikas a
      LEFT JOIN cities c ON c.id = a.city_id
      LEFT JOIN localities l ON l.id = a.locality_id
      WHERE ${where}
      ORDER BY ${orderClause}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const results = await db.prepare(query).bind(...params).all();

    const countQuery = `SELECT COUNT(*) as total FROM abhyasikas a WHERE ${where}`;
    const countParams = params.slice(0, -2);
    const countResult = await db.prepare(countQuery).bind(...countParams).first() as any;

    let items = results.results as any[];

    if (lat && lng) {
      items = items.map(item => ({
        ...item,
        distance: item.latitude && item.longitude
          ? calculateDistance(lat, lng, item.latitude, item.longitude) : null
      })).filter(item => !radius || !item.distance || item.distance <= radius);

      if (sortBy === 'distance') {
        items.sort((a, b) => (a.distance || 999) - (b.distance || 999));
      }
    }

    return c.json(successResponse(items, 'Abhyasikas fetched', paginationMeta(countResult?.total || 0, page, limit)));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch abhyasikas'), 500);
  }
});

// GET /api/abhyasikas/nearby
abhyasikas.get('/nearby', async (c) => {
  try {
    const lat = parseFloat(c.req.query('lat') || '0');
    const lng = parseFloat(c.req.query('lng') || '0');
    const radius = parseFloat(c.req.query('radius') || '5');

    if (!lat || !lng) return c.json(errorResponse('Location coordinates required'), 400);

    const db = c.env.DB;
    const results = await db.prepare(`
      SELECT a.*, c.name as city_name, l.name as locality_name,
        (SELECT url FROM abhyasika_photos WHERE abhyasika_id = a.id AND is_primary = 1 LIMIT 1) as primary_photo,
        (SELECT MIN(daily_price) FROM seat_categories WHERE abhyasika_id = a.id) as min_price
      FROM abhyasikas a
      LEFT JOIN cities c ON c.id = a.city_id
      LEFT JOIN localities l ON l.id = a.locality_id
      WHERE a.status = 'approved' AND a.is_active = 1
        AND a.latitude IS NOT NULL AND a.longitude IS NOT NULL
    `).all();

    const nearby = (results.results as any[])
      .map(item => ({
        ...item,
        distance: calculateDistance(lat, lng, item.latitude, item.longitude)
      }))
      .filter(item => item.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20);

    return c.json(successResponse(nearby, 'Nearby abhyasikas'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch nearby'), 500);
  }
});

// GET /api/abhyasikas/featured
abhyasikas.get('/featured', async (c) => {
  try {
    const db = c.env.DB;
    // Try in-memory cache first (5 minute TTL for featured rooms)
    const cache = (c as any).cache;
    const cacheKey = 'featured_abhyasikas';
    if (cache) {
      const cached = cache.get(cacheKey);
      if (cached) {
        return c.json(successResponse(cached, 'Featured abhyasikas (cached)'));
      }
    }

    const results = await db.prepare(`
      SELECT a.*, c.name as city_name, l.name as locality_name,
        (SELECT url FROM abhyasika_photos WHERE abhyasika_id = a.id AND is_primary = 1 LIMIT 1) as primary_photo,
        (SELECT MIN(daily_price) FROM seat_categories WHERE abhyasika_id = a.id) as min_price
      FROM abhyasikas a
      LEFT JOIN cities c ON c.id = a.city_id
      LEFT JOIN localities l ON l.id = a.locality_id
      WHERE a.status = 'approved' AND a.is_featured = 1 AND a.is_active = 1
      ORDER BY a.rating_avg DESC LIMIT 6
    `).all();

    if (cache) cache.set(cacheKey, results.results, 300); // 5 min cache
    return c.json(successResponse(results.results, 'Featured abhyasikas'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch featured'), 500);
  }
});

// GET /api/abhyasikas/owner/my-listings  ← MUST be BEFORE /:id
abhyasikas.get('/owner/my-listings', authMiddleware, requireOwner(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const db = c.env.DB;

    const listings = await db.prepare(`
      SELECT a.*, c.name as city_name, l.name as locality_name,
        (SELECT url FROM abhyasika_photos WHERE abhyasika_id = a.id AND is_primary = 1 LIMIT 1) as primary_photo,
        (SELECT COUNT(*) FROM seats WHERE abhyasika_id = a.id AND is_active = 1) as total_seats,
        (SELECT COUNT(*) FROM bookings WHERE abhyasika_id = a.id AND status = 'confirmed') as active_bookings
      FROM abhyasikas a
      LEFT JOIN cities c ON c.id = a.city_id
      LEFT JOIN localities l ON l.id = a.locality_id
      WHERE a.owner_id = ?
      ORDER BY a.created_at DESC
    `).bind(user.id).all();

    return c.json(successResponse(listings.results, 'My listings'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch listings'), 500);
  }
});

// GET /api/abhyasikas/:id/analytics  ← BEFORE generic /:id
abhyasikas.get('/:id/analytics', authMiddleware, requireOwner(), async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user') as AuthUser;
    const db = c.env.DB;

    // Ownership check
    const check = await verifyOwnership(db, id, user.id, user.role);
    if (check.notFound) return c.json(errorResponse('Abhyasika not found'), 404);
    if (!check.ok) return c.json(errorResponse('You can only view analytics for your own abhyasikas'), 403);

    const [stats, recentBookings, monthlyRevenue] = await Promise.all([
      db.prepare(`
        SELECT
          COUNT(*) as total_bookings,
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COALESCE(AVG(total_amount), 0) as avg_booking_value,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as active_bookings,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings
        FROM bookings WHERE abhyasika_id = ?
      `).bind(id).first(),
      db.prepare(`
        SELECT b.*, u.first_name, u.last_name, s.seat_number
        FROM bookings b
        JOIN users u ON u.id = b.student_id
        JOIN seats s ON s.id = b.seat_id
        WHERE b.abhyasika_id = ?
        ORDER BY b.created_at DESC LIMIT 10
      `).bind(id).all(),
      db.prepare(`
        SELECT strftime('%Y-%m', created_at) as month, SUM(total_amount) as revenue, COUNT(*) as bookings
        FROM bookings WHERE abhyasika_id = ?
        GROUP BY month ORDER BY month DESC LIMIT 12
      `).bind(id).all()
    ]);

    return c.json(successResponse({
      stats,
      recent_bookings: recentBookings.results,
      monthly_revenue: monthlyRevenue.results
    }));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch analytics'), 500);
  }
});

// GET /api/abhyasikas/:id  (public - approved only)
abhyasikas.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;

    const abhyasika = await db.prepare(`
      SELECT a.*, c.name as city_name, l.name as locality_name,
        u.first_name as owner_first_name, u.last_name as owner_last_name
      FROM abhyasikas a
      LEFT JOIN cities c ON c.id = a.city_id
      LEFT JOIN localities l ON l.id = a.locality_id
      LEFT JOIN users u ON u.id = a.owner_id
      WHERE (a.id = ? OR a.slug = ?) AND a.status = 'approved'
    `).bind(id, id).first();

    if (!abhyasika) return c.json(errorResponse('Abhyasika not found'), 404);

    const [photos, facilities, seatCategories, reviews, operatingHours] = await Promise.all([
      db.prepare('SELECT * FROM abhyasika_photos WHERE abhyasika_id = ? ORDER BY sort_order').bind((abhyasika as any).id).all(),
      db.prepare(`
        SELECT f.*, fc.name as category_name FROM abhyasika_facilities af
        JOIN facilities f ON f.id = af.facility_id
        JOIN facility_categories fc ON fc.id = f.category_id
        WHERE af.abhyasika_id = ?
      `).bind((abhyasika as any).id).all(),
      db.prepare('SELECT * FROM seat_categories WHERE abhyasika_id = ? AND is_active = 1').bind((abhyasika as any).id).all(),
      db.prepare(`
        SELECT r.*, u.first_name, u.last_name FROM reviews r
        JOIN users u ON u.id = r.student_id
        WHERE r.abhyasika_id = ? AND r.is_approved = 1
        ORDER BY r.created_at DESC LIMIT 10
      `).bind((abhyasika as any).id).all(),
      db.prepare('SELECT * FROM operating_hours WHERE abhyasika_id = ? ORDER BY day_of_week').bind((abhyasika as any).id).all()
    ]);

    await db.prepare('UPDATE abhyasikas SET view_count = view_count + 1 WHERE id = ?').bind((abhyasika as any).id).run();

    return c.json(successResponse({
      ...abhyasika,
      photos: photos.results,
      facilities: facilities.results,
      seat_categories: seatCategories.results,
      reviews: reviews.results,
      operating_hours: operatingHours.results
    }));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch abhyasika'), 500);
  }
});

// POST /api/abhyasikas - Owner creates new abhyasika
abhyasikas.post('/', authMiddleware, requireOwner(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const body = await c.req.json();
    const db = c.env.DB;

    const { name, description, tagline, address, pincode, city_id, locality_id,
      latitude, longitude, phone, email, website, opening_time, closing_time } = body;

    if (!name || !address) return c.json(errorResponse('Name and address required'), 400);

    const uuid = generateUUID();
    const slug = createSlug(name) + '-' + uuid.substring(0, 8);

    const result = await db.prepare(`
      INSERT INTO abhyasikas (uuid, owner_id, name, slug, description, tagline, address, pincode,
        city_id, locality_id, latitude, longitude, phone, email, website, opening_time, closing_time, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(uuid, user.id, name, slug, description, tagline, address, pincode,
      city_id, locality_id, latitude, longitude, phone, email, website,
      opening_time || '06:00', closing_time || '22:00').run();

    await db.prepare('UPDATE owner_profiles SET total_abhyasikas = total_abhyasikas + 1 WHERE user_id = ?').bind(user.id).run();

    return c.json(successResponse({ id: result.meta.last_row_id, uuid, slug }, 'Study room created. Awaiting approval.'), 201);
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to create abhyasika'), 500);
  }
});

// PUT /api/abhyasikas/:id - Owner updates OWN abhyasika only
abhyasikas.put('/:id', authMiddleware, requireOwner(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const id = c.req.param('id');
    const db = c.env.DB;

    // ── Ownership verification ──
    const check = await verifyOwnership(db, id, user.id, user.role);
    if (check.notFound) return c.json(errorResponse('Abhyasika not found'), 404);
    if (!check.ok) return c.json(errorResponse('You can only edit your own abhyasikas'), 403);

    const existing = await db.prepare('SELECT * FROM abhyasikas WHERE id = ?').bind(id).first() as any;
    const body = await c.req.json();
    const { name, description, tagline, address, pincode, city_id, locality_id,
      latitude, longitude, phone, email, website, opening_time, closing_time, days_open,
      cancellation_policy, cancellation_hours, refund_percentage, late_cancel_refund,
      no_show_policy, custom_policy_text } = body;

    await db.prepare(`
      UPDATE abhyasikas SET name=?, description=?, tagline=?, address=?, pincode=?,
        city_id=?, locality_id=?, latitude=?, longitude=?, phone=?, email=?, website=?,
        opening_time=?, closing_time=?, days_open=?,
        cancellation_policy=?, cancellation_hours=?, refund_percentage=?,
        late_cancel_refund=?, no_show_policy=?, custom_policy_text=?,
        updated_at=datetime('now')
      WHERE id = ?
    `).bind(
      name || existing.name,
      description ?? existing.description,
      tagline ?? existing.tagline,
      address || existing.address,
      pincode ?? existing.pincode,
      city_id ?? existing.city_id,
      locality_id ?? existing.locality_id,
      latitude ?? existing.latitude,
      longitude ?? existing.longitude,
      phone ?? existing.phone,
      email ?? existing.email,
      website ?? existing.website,
      opening_time || existing.opening_time,
      closing_time || existing.closing_time,
      days_open || existing.days_open,
      cancellation_policy || existing.cancellation_policy || 'flexible',
      cancellation_hours ?? existing.cancellation_hours ?? 24,
      refund_percentage ?? existing.refund_percentage ?? 100,
      late_cancel_refund ?? existing.late_cancel_refund ?? 50,
      no_show_policy || existing.no_show_policy || 'no_refund',
      custom_policy_text ?? existing.custom_policy_text ?? '',
      id
    ).run();

    return c.json(successResponse(null, 'Abhyasika updated successfully'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to update'), 500);
  }
});

// POST /api/abhyasikas/:id/photos
abhyasikas.post('/:id/photos', authMiddleware, requireOwner(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const id = c.req.param('id');
    const db = c.env.DB;

    // ── Ownership verification ──
    const check = await verifyOwnership(db, id, user.id, user.role);
    if (check.notFound) return c.json(errorResponse('Not found'), 404);
    if (!check.ok) return c.json(errorResponse('You can only add photos to your own abhyasikas'), 403);

    const { photos } = await c.req.json();
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      await db.prepare(`
        INSERT INTO abhyasika_photos (abhyasika_id, url, caption, is_primary, sort_order)
        VALUES (?, ?, ?, ?, ?)
      `).bind(id, photo.url, photo.caption || '', photo.is_primary ? 1 : 0, i).run();
    }

    return c.json(successResponse(null, 'Photos added'), 201);
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to add photos'), 500);
  }
});

// DELETE /api/abhyasikas/:id/photos/:photoId
abhyasikas.delete('/:id/photos/:photoId', authMiddleware, requireOwner(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const { id, photoId } = c.req.param();
    const db = c.env.DB;

    const check = await verifyOwnership(db, id, user.id, user.role);
    if (!check.ok) return c.json(errorResponse(check.notFound ? 'Not found' : 'Forbidden'), check.notFound ? 404 : 403);

    await db.prepare('DELETE FROM abhyasika_photos WHERE id = ? AND abhyasika_id = ?').bind(photoId, id).run();
    return c.json(successResponse(null, 'Photo deleted'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to delete photo'), 500);
  }
});

// PUT /api/abhyasikas/:id/facilities
abhyasikas.put('/:id/facilities', authMiddleware, requireOwner(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const id = c.req.param('id');
    const db = c.env.DB;

    const check = await verifyOwnership(db, id, user.id, user.role);
    if (!check.ok) return c.json(errorResponse(check.notFound ? 'Not found' : 'Forbidden'), check.notFound ? 404 : 403);

    const { facility_ids } = await c.req.json();
    await db.prepare('DELETE FROM abhyasika_facilities WHERE abhyasika_id = ?').bind(id).run();
    for (const fId of facility_ids) {
      await db.prepare('INSERT INTO abhyasika_facilities (abhyasika_id, facility_id) VALUES (?, ?)').bind(id, fId).run();
    }

    return c.json(successResponse(null, 'Facilities updated'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to update facilities'), 500);
  }
});

export default abhyasikas;
