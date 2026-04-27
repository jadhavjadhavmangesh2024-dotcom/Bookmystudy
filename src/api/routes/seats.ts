// ============================================================
// SEATS ROUTES - Floor Plans, Seat Management, Availability
// ============================================================
import { Hono } from 'hono';
import { authMiddleware, requireOwner, AuthUser } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/helpers';

const seats = new Hono<{ Bindings: { DB: D1Database } }>();

// ── Helper: verify owner of an abhyasika ──────────────────────
async function verifyAbhyasikaOwner(db: D1Database, abhyasikaId: string | number, userId: number, role: string) {
  if (role === 'super_admin') return { ok: true };
  const row = await db.prepare('SELECT owner_id FROM abhyasikas WHERE id = ?').bind(abhyasikaId).first() as any;
  if (!row) return { ok: false, notFound: true };
  if (row.owner_id !== userId) return { ok: false };
  return { ok: true };
}

// ── Helper: verify seat belongs to owner's abhyasika ──────────
async function verifySeatOwner(db: D1Database, seatId: string | number, userId: number, role: string) {
  if (role === 'super_admin') return { ok: true };
  const row = await db.prepare(`
    SELECT a.owner_id FROM seats s
    JOIN abhyasikas a ON a.id = s.abhyasika_id
    WHERE s.id = ?
  `).bind(seatId).first() as any;
  if (!row) return { ok: false, notFound: true };
  if (row.owner_id !== userId) return { ok: false };
  return { ok: true };
}

// GET /api/seats  - Public: list seats, optionally filtered by ?abhyasika_id=X
seats.get('/', async (c) => {
  try {
    const abhyasika_id = c.req.query('abhyasika_id');
    const db = c.env.DB;
    let query = `SELECT s.*, sc.name as category_name, sc.daily_price, sc.monthly_price
      FROM seats s LEFT JOIN seat_categories sc ON sc.id = s.category_id
      WHERE s.is_active = 1`;
    const binds: any[] = [];
    if (abhyasika_id) { query += ' AND s.abhyasika_id = ?'; binds.push(abhyasika_id); }
    query += ' ORDER BY s.seat_number LIMIT 100';
    const seats_result = binds.length ? await db.prepare(query).bind(...binds).all() : await db.prepare(query).all();
    return c.json({ success: true, message: 'Seats', data: seats_result.results });
  } catch (err: any) {
    return c.json({ success: false, message: err.message || 'Failed to fetch seats' }, 500);
  }
});

// GET /api/seats/categories  - Public: seat categories, filtered by ?abhyasika_id=X
seats.get('/categories', async (c) => {
  try {
    const abhyasika_id = c.req.query('abhyasika_id');
    if (!abhyasika_id) return c.json({ success: false, message: 'abhyasika_id required' }, 400);
    const db = c.env.DB;
    const categories = await db.prepare(`
      SELECT sc.*, COUNT(s.id) as total_seats,
        COUNT(CASE WHEN s.status = 'available' AND s.is_active = 1 THEN 1 END) as available_seats
      FROM seat_categories sc
      LEFT JOIN seats s ON s.category_id = sc.id AND s.is_active = 1
      WHERE sc.abhyasika_id = ?
      GROUP BY sc.id ORDER BY sc.name
    `).bind(abhyasika_id).all();
    return c.json({ success: true, message: 'Seat categories', data: categories.results });
  } catch (err: any) {
    return c.json({ success: false, message: err.message || 'Failed to fetch categories' }, 500);
  }
});

// GET /api/seats/abhyasika/:abhyasikaId - Public: seats for a specific abhyasika
seats.get('/abhyasika/:abhyasikaId', async (c) => {
  try {
    const abhyasikaId = c.req.param('abhyasikaId');
    const date = c.req.query('date') || new Date().toISOString().split('T')[0];
    const db = c.env.DB;

    const allSeats = await db.prepare(`
      SELECT s.*, sc.name as category_name, sc.color_code, sc.daily_price, sc.weekly_price, sc.monthly_price,
        fp.name as floor_name, fp.floor_number,
        CASE WHEN b.id IS NOT NULL THEN 'occupied' ELSE s.status END as current_status
      FROM seats s
      LEFT JOIN seat_categories sc ON sc.id = s.category_id
      LEFT JOIN floor_plans fp ON fp.id = s.floor_plan_id
      LEFT JOIN bookings b ON b.seat_id = s.id AND b.status IN ('confirmed','pending')
        AND b.start_date <= ? AND b.end_date >= ?
      WHERE s.abhyasika_id = ? AND s.is_active = 1
      ORDER BY s.floor_plan_id, s.row_number, s.column_number
    `).bind(date, date, abhyasikaId).all();

    return c.json(successResponse(allSeats.results, 'Seats fetched'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch seats'), 500);
  }
});

// GET /api/seats/availability/:seatId - Public: check seat availability
seats.get('/availability/:seatId', async (c) => {
  try {
    const seatId = c.req.param('seatId');
    const fromDate = c.req.query('from') || new Date().toISOString().split('T')[0];
    const toDate = c.req.query('to') || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];
    const db = c.env.DB;

    const bookingsList = await db.prepare(`
      SELECT start_date, end_date, booking_type, status
      FROM bookings
      WHERE seat_id = ? AND status IN ('confirmed', 'pending')
        AND start_date <= ? AND end_date >= ?
      ORDER BY start_date
    `).bind(seatId, toDate, fromDate).all();

    const seat = await db.prepare(`
      SELECT s.*, sc.daily_price, sc.weekly_price, sc.monthly_price
      FROM seats s
      LEFT JOIN seat_categories sc ON sc.id = s.category_id
      WHERE s.id = ?
    `).bind(seatId).first();

    return c.json(successResponse({
      seat,
      booked_dates: bookingsList.results,
      available_from: fromDate
    }));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to check availability'), 500);
  }
});

// GET /api/seats/floor-plans/:abhyasikaId - Public
seats.get('/floor-plans/:abhyasikaId', async (c) => {
  try {
    const abhyasikaId = c.req.param('abhyasikaId');
    const db = c.env.DB;

    const floorPlans = await db.prepare(`
      SELECT fp.*, COUNT(s.id) as total_seats
      FROM floor_plans fp
      LEFT JOIN seats s ON s.floor_plan_id = fp.id AND s.is_active = 1
      WHERE fp.abhyasika_id = ? AND fp.is_active = 1
      GROUP BY fp.id
      ORDER BY fp.floor_number
    `).bind(abhyasikaId).all();

    return c.json(successResponse(floorPlans.results, 'Floor plans'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch floor plans'), 500);
  }
});

// GET /api/seats/categories/:abhyasikaId - Public
seats.get('/categories/:abhyasikaId', async (c) => {
  try {
    const abhyasikaId = c.req.param('abhyasikaId');
    const db = c.env.DB;

    const categories = await db.prepare(`
      SELECT sc.*, COUNT(s.id) as total_seats
      FROM seat_categories sc
      LEFT JOIN seats s ON s.category_id = sc.id AND s.is_active = 1
      WHERE sc.abhyasika_id = ? AND sc.is_active = 1
      GROUP BY sc.id
    `).bind(abhyasikaId).all();

    return c.json(successResponse(categories.results, 'Seat categories'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch categories'), 500);
  }
});

// POST /api/seats - Owner creates a seat (own abhyasika only)
seats.post('/', authMiddleware, requireOwner(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const body = await c.req.json();
    const { abhyasika_id, floor_plan_id, category_id, seat_number, seat_label, row_number, column_number, position_x, position_y } = body;
    const db = c.env.DB;

    // Ownership check
    const check = await verifyAbhyasikaOwner(db, abhyasika_id, user.id, user.role);
    if (check.notFound) return c.json(errorResponse('Abhyasika not found'), 404);
    if (!check.ok) return c.json(errorResponse('You can only add seats to your own abhyasikas'), 403);

    const result = await db.prepare(`
      INSERT INTO seats (abhyasika_id, floor_plan_id, category_id, seat_number, seat_label, row_number, column_number, position_x, position_y)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(abhyasika_id, floor_plan_id, category_id, seat_number, seat_label, row_number, column_number, position_x, position_y).run();

    await db.prepare(`UPDATE abhyasikas SET total_seats = total_seats + 1, available_seats = available_seats + 1 WHERE id = ?`).bind(abhyasika_id).run();

    return c.json(successResponse({ id: result.meta.last_row_id }, 'Seat created'), 201);
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to create seat'), 500);
  }
});

// POST /api/seats/bulk - Bulk create seats (own abhyasika only)
seats.post('/bulk', authMiddleware, requireOwner(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const { abhyasika_id, floor_plan_id, category_id, rows, cols, prefix = 'S' } = await c.req.json();
    const db = c.env.DB;

    // Ownership check
    const check = await verifyAbhyasikaOwner(db, abhyasika_id, user.id, user.role);
    if (check.notFound) return c.json(errorResponse('Abhyasika not found'), 404);
    if (!check.ok) return c.json(errorResponse('You can only add seats to your own abhyasikas'), 403);

    let count = 0;
    for (let r = 1; r <= rows; r++) {
      for (let col = 1; col <= cols; col++) {
        const seatNum = `${prefix}${String(r).padStart(2, '0')}${String(col).padStart(2, '0')}`;
        await db.prepare(`
          INSERT INTO seats (abhyasika_id, floor_plan_id, category_id, seat_number, seat_label, row_number, column_number)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(abhyasika_id, floor_plan_id, category_id, seatNum, seatNum, r, col).run();
        count++;
      }
    }

    await db.prepare(`UPDATE abhyasikas SET total_seats = total_seats + ?, available_seats = available_seats + ? WHERE id = ?`).bind(count, count, abhyasika_id).run();

    return c.json(successResponse({ count }, `${count} seats created`), 201);
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to bulk create seats'), 500);
  }
});

// POST /api/seats/floor-plans - Owner creates floor plan (own abhyasika only)
seats.post('/floor-plans', authMiddleware, requireOwner(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const body = await c.req.json();
    const { abhyasika_id, name, description, floor_number, layout_data, image_url } = body;
    const db = c.env.DB;

    const check = await verifyAbhyasikaOwner(db, abhyasika_id, user.id, user.role);
    if (check.notFound) return c.json(errorResponse('Abhyasika not found'), 404);
    if (!check.ok) return c.json(errorResponse('You can only manage your own abhyasikas'), 403);

    const result = await db.prepare(`
      INSERT INTO floor_plans (abhyasika_id, name, description, floor_number, layout_data, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(abhyasika_id, name, description, floor_number || 1, layout_data, image_url).run();

    return c.json(successResponse({ id: result.meta.last_row_id }, 'Floor plan created'), 201);
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to create floor plan'), 500);
  }
});

// POST /api/seats/categories - Owner creates category (own abhyasika only)
seats.post('/categories', authMiddleware, requireOwner(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const body = await c.req.json();
    const { abhyasika_id, name, description, color_code, daily_price, weekly_price, monthly_price, amenities } = body;
    const db = c.env.DB;

    const check = await verifyAbhyasikaOwner(db, abhyasika_id, user.id, user.role);
    if (check.notFound) return c.json(errorResponse('Abhyasika not found'), 404);
    if (!check.ok) return c.json(errorResponse('You can only manage your own abhyasikas'), 403);

    const result = await db.prepare(`
      INSERT INTO seat_categories (abhyasika_id, name, description, color_code, daily_price, weekly_price, monthly_price, amenities)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(abhyasika_id, name, description, color_code || '#3B82F6', daily_price, weekly_price, monthly_price, amenities).run();

    return c.json(successResponse({ id: result.meta.last_row_id }, 'Category created'), 201);
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to create category'), 500);
  }
});

// PUT /api/seats/categories/:id - Owner updates category (own abhyasika only)
seats.put('/categories/:id', authMiddleware, requireOwner(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const id = c.req.param('id');
    const db = c.env.DB;

    // Verify ownership via category → abhyasika
    const cat = await db.prepare('SELECT abhyasika_id FROM seat_categories WHERE id = ?').bind(id).first() as any;
    if (!cat) return c.json(errorResponse('Category not found'), 404);

    const check = await verifyAbhyasikaOwner(db, cat.abhyasika_id, user.id, user.role);
    if (!check.ok) return c.json(errorResponse('You can only manage your own abhyasikas'), 403);

    const { name, description, color_code, daily_price, weekly_price, monthly_price } = await c.req.json();
    await db.prepare(`
      UPDATE seat_categories SET name=?, description=?, color_code=?, daily_price=?, weekly_price=?, monthly_price=?
      WHERE id = ?
    `).bind(name, description, color_code, daily_price, weekly_price, monthly_price, id).run();

    return c.json(successResponse(null, 'Category updated'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to update category'), 500);
  }
});

// PUT /api/seats/:id - Owner updates seat (own abhyasika only)
seats.put('/:id', authMiddleware, requireOwner(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const id = c.req.param('id');
    const db = c.env.DB;

    const check = await verifySeatOwner(db, id, user.id, user.role);
    if (check.notFound) return c.json(errorResponse('Seat not found'), 404);
    if (!check.ok) return c.json(errorResponse('You can only manage seats of your own abhyasikas'), 403);

    const { seat_number, seat_label, category_id, status, is_active, notes } = await c.req.json();
    await db.prepare(`
      UPDATE seats SET seat_number=?, seat_label=?, category_id=?, status=?, is_active=?, notes=?, updated_at=datetime('now')
      WHERE id = ?
    `).bind(seat_number, seat_label, category_id, status, is_active, notes, id).run();

    return c.json(successResponse(null, 'Seat updated'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to update seat'), 500);
  }
});

// DELETE /api/seats/:id - Owner deletes seat (own abhyasika only)
seats.delete('/:id', authMiddleware, requireOwner(), async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const id = c.req.param('id');
    const db = c.env.DB;

    const seat = await db.prepare(`
      SELECT s.*, a.owner_id FROM seats s
      JOIN abhyasikas a ON a.id = s.abhyasika_id
      WHERE s.id = ?
    `).bind(id).first() as any;

    if (!seat) return c.json(errorResponse('Seat not found'), 404);
    if (user.role !== 'super_admin' && seat.owner_id !== user.id) {
      return c.json(errorResponse('You can only delete seats of your own abhyasikas'), 403);
    }

    await db.prepare('UPDATE seats SET is_active = 0 WHERE id = ?').bind(id).run();
    await db.prepare('UPDATE abhyasikas SET total_seats = total_seats - 1 WHERE id = ?').bind(seat.abhyasika_id).run();

    return c.json(successResponse(null, 'Seat deactivated'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to delete seat'), 500);
  }
});

export default seats;
