// ============================================================
// ADMIN ROUTES - Platform management, analytics, approvals
// ============================================================
import { Hono } from 'hono';
import { authMiddleware, requireAdmin } from '../middleware/auth';
import { generateUUID, hashPassword, successResponse, errorResponse, paginationMeta } from '../utils/helpers';

const admin = new Hono<{ Bindings: { DB: D1Database } }>();

// GET /api/admin/dashboard - Dashboard stats
admin.get('/dashboard', authMiddleware, requireAdmin(), async (c) => {
  try {
    const db = c.env.DB;

    const [users, abhyasikas, bookings, revenue, pending, recentBookings] = await Promise.all([
      db.prepare(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN role = 'student' THEN 1 END) as students,
          COUNT(CASE WHEN role = 'owner' THEN 1 END) as owners,
          COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as new_this_month
        FROM users WHERE role != 'super_admin'
      `).first(),
      db.prepare(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
        FROM abhyasikas
      `).first(),
      db.prepare(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
          COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as this_month
        FROM bookings
      `).first(),
      db.prepare(`
        SELECT 
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COALESCE(SUM(platform_fee), 0) as platform_revenue,
          COALESCE(SUM(CASE WHEN created_at >= date('now', '-30 days') THEN total_amount ELSE 0 END), 0) as monthly_revenue
        FROM bookings WHERE status IN ('confirmed', 'completed')
      `).first(),
      db.prepare(`SELECT COUNT(*) as count FROM abhyasikas WHERE status = 'pending'`).first(),
      db.prepare(`
        SELECT b.booking_number, b.total_amount, b.status, b.created_at,
          a.name as abhyasika_name, u.first_name, u.last_name
        FROM bookings b
        JOIN abhyasikas a ON a.id = b.abhyasika_id
        JOIN users u ON u.id = b.student_id
        ORDER BY b.created_at DESC LIMIT 5
      `).all()
    ]);

    const weeklyRevenue = await db.prepare(`
      SELECT strftime('%Y-%W', created_at) as week, SUM(total_amount) as revenue, COUNT(*) as bookings
      FROM bookings WHERE status IN ('confirmed', 'completed')
      GROUP BY week ORDER BY week DESC LIMIT 8
    `).all();

    const cityStats = await db.prepare(`
      SELECT c.name, COUNT(DISTINCT a.id) as abhyasikas, COUNT(b.id) as bookings
      FROM cities c
      LEFT JOIN abhyasikas a ON a.city_id = c.id AND a.status = 'approved'
      LEFT JOIN bookings b ON b.abhyasika_id = a.id
      GROUP BY c.id ORDER BY bookings DESC LIMIT 5
    `).all();

    return c.json(successResponse({
      users, abhyasikas, bookings, revenue,
      pending_approvals: (pending as any)?.count || 0,
      recent_bookings: recentBookings.results,
      weekly_revenue: weeklyRevenue.results,
      city_stats: cityStats.results
    }, 'Dashboard data'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to load dashboard'), 500);
  }
});

// GET /api/admin/abhyasikas - All listings with filters
admin.get('/abhyasikas', authMiddleware, requireAdmin(), async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;
    const status = c.req.query('status') || '';
    const search = c.req.query('search') || '';
    const db = c.env.DB;

    let where = '1=1';
    const params: any[] = [];

    if (status) { where += ' AND a.status = ?'; params.push(status); }
    if (search) { where += ' AND (a.name LIKE ? OR a.address LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const results = await db.prepare(`
      SELECT a.*, c.name as city_name, u.first_name as owner_first, u.last_name as owner_last, u.email as owner_email,
        (SELECT COUNT(*) FROM bookings WHERE abhyasika_id = a.id) as booking_count,
        (SELECT url FROM abhyasika_photos WHERE abhyasika_id = a.id AND is_primary = 1 LIMIT 1) as primary_photo
      FROM abhyasikas a
      LEFT JOIN cities c ON c.id = a.city_id
      LEFT JOIN users u ON u.id = a.owner_id
      WHERE ${where}
      ORDER BY a.created_at DESC LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all();

    const count = await db.prepare(`SELECT COUNT(*) as total FROM abhyasikas a WHERE ${where}`).bind(...params).first() as any;

    return c.json(successResponse(results.results, 'Abhyasikas', paginationMeta(count?.total || 0, page, limit)));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch'), 500);
  }
});

// POST /api/admin/abhyasikas/:id/approve
admin.post('/abhyasikas/:id/approve', authMiddleware, requireAdmin(), async (c) => {
  try {
    const user = c.get('user' as any) as any;
    const id = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const notes = body?.notes ?? null;   // always null-safe
    const db = c.env.DB;

    await db.prepare(`
      UPDATE abhyasikas SET status = 'approved', approval_notes = ?, approved_at = datetime('now'), approved_by = ?
      WHERE id = ?
    `).bind(notes, user.id, id).run();

    const abhyasika = await db.prepare('SELECT owner_id, name FROM abhyasikas WHERE id = ?').bind(id).first() as any;
    
    if (abhyasika) {
      await db.prepare(`
        INSERT INTO notifications (user_id, type, title, message)
        VALUES (?, 'abhyasika_approved', 'Study Room Approved!', ?)
      `).bind(abhyasika.owner_id, `Congratulations! Your study room "${abhyasika.name}" has been approved and is now live on BookMyStudy.`).run();
    }

    return c.json(successResponse(null, 'Abhyasika approved'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to approve'), 500);
  }
});

// POST /api/admin/abhyasikas/:id/reject
admin.post('/abhyasikas/:id/reject', authMiddleware, requireAdmin(), async (c) => {
  try {
    const user = c.get('user' as any) as any;
    const id = c.req.param('id');
    const { reason } = await c.req.json();
    const db = c.env.DB;

    await db.prepare(`
      UPDATE abhyasikas SET status = 'rejected', approval_notes = ?, approved_by = ?
      WHERE id = ?
    `).bind(reason, user.id, id).run();

    const abhyasika = await db.prepare('SELECT owner_id, name FROM abhyasikas WHERE id = ?').bind(id).first() as any;
    if (abhyasika) {
      await db.prepare(`
        INSERT INTO notifications (user_id, type, title, message)
        VALUES (?, 'abhyasika_rejected', 'Listing Rejected', ?)
      `).bind(abhyasika.owner_id, `Your study room "${abhyasika.name}" was not approved. Reason: ${reason}`).run();
    }

    return c.json(successResponse(null, 'Abhyasika rejected'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to reject'), 500);
  }
});

// GET /api/admin/pending-owners - All pending owner registrations
admin.get('/pending-owners', authMiddleware, requireAdmin(), async (c) => {
  try {
    const db = c.env.DB;
    const owners = await db.prepare(`
      SELECT u.id, u.uuid, u.email, u.phone, u.first_name, u.last_name, u.role,
        u.is_active, u.created_at, op.business_name, op.pan_number, op.gst_number
      FROM users u
      LEFT JOIN owner_profiles op ON op.user_id = u.id
      WHERE u.role = 'owner' AND u.is_active = 0
      ORDER BY u.created_at DESC
    `).all();
    return c.json(successResponse(owners.results, 'Pending owner registrations'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch'), 500);
  }
});

// POST /api/admin/users/:id/approve-owner - Approve owner registration
admin.post('/users/:id/approve-owner', authMiddleware, requireAdmin(), async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;

    const user = await db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').bind(id, 'owner').first() as any;
    if (!user) return c.json(errorResponse('Owner not found'), 404);

    await db.prepare('UPDATE users SET is_active = 1 WHERE id = ?').bind(id).run();

    // Send notification to owner
    await db.prepare(`
      INSERT INTO notifications (user_id, type, title, message)
      VALUES (?, 'owner_approved', '🎉 Account Approved!', ?)
    `).bind(id, 'Congratulations! Your owner account has been approved. You can now login and start adding your study rooms.').run();

    return c.json(successResponse(null, 'Owner account approved'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to approve'), 500);
  }
});

// POST /api/admin/users/:id/reject-owner - Reject owner registration
admin.post('/users/:id/reject-owner', authMiddleware, requireAdmin(), async (c) => {
  try {
    const id = c.req.param('id');
    const { reason = 'Your application did not meet our requirements.' } = await c.req.json().catch(() => ({ reason: '' }));
    const db = c.env.DB;

    const user = await db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').bind(id, 'owner').first() as any;
    if (!user) return c.json(errorResponse('Owner not found'), 404);

    // Delete the user (or keep with is_active=0 and add a rejection note)
    await db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').bind(id).run();

    // Send rejection notification
    await db.prepare(`
      INSERT INTO notifications (user_id, type, title, message)
      VALUES (?, 'owner_rejected', 'Registration Not Approved', ?)
    `).bind(id, `Your owner account registration was not approved. Reason: ${reason}`).run();

    return c.json(successResponse(null, 'Owner registration rejected'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to reject'), 500);
  }
});

// GET /api/admin/users
admin.get('/users', authMiddleware, requireAdmin(), async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;
    const role = c.req.query('role') || '';
    const search = c.req.query('search') || '';
    const db = c.env.DB;

    let where = "role != 'super_admin'";
    const params: any[] = [];

    if (role) { where += ' AND role = ?'; params.push(role); }
    if (search) { where += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    const results = await db.prepare(`
      SELECT id, uuid, email, phone, first_name, last_name, role, is_active, is_verified, created_at, last_login_at
      FROM users WHERE ${where}
      ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all();

    const count = await db.prepare(`SELECT COUNT(*) as total FROM users WHERE ${where}`).bind(...params).first() as any;

    return c.json(successResponse(results.results, 'Users', paginationMeta(count?.total || 0, page, limit)));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch users'), 500);
  }
});

// PUT /api/admin/users/:id/status
admin.put('/users/:id/status', authMiddleware, requireAdmin(), async (c) => {
  try {
    const id = c.req.param('id');
    const { is_active } = await c.req.json();
    const db = c.env.DB;
    await db.prepare('UPDATE users SET is_active = ? WHERE id = ?').bind(is_active ? 1 : 0, id).run();
    return c.json(successResponse(null, `User ${is_active ? 'activated' : 'deactivated'}`));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to update user'), 500);
  }
});

// GET /api/admin/analytics/revenue
admin.get('/analytics/revenue', authMiddleware, requireAdmin(), async (c) => {
  try {
    const db = c.env.DB;
    const period = c.req.query('period') || 'monthly';

    let groupBy = "strftime('%Y-%m', created_at)";
    if (period === 'daily') groupBy = "strftime('%Y-%m-%d', created_at)";
    if (period === 'yearly') groupBy = "strftime('%Y', created_at)";

    const revenue = await db.prepare(`
      SELECT 
        ${groupBy} as period,
        COUNT(*) as total_bookings,
        SUM(total_amount) as gross_revenue,
        SUM(platform_fee) as platform_revenue,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancellations,
        AVG(total_amount) as avg_booking_value
      FROM bookings
      WHERE status IN ('confirmed', 'completed', 'cancelled')
      GROUP BY period
      ORDER BY period DESC
      LIMIT 24
    `).all();

    const topAbhyasikas = await db.prepare(`
      SELECT a.name, a.city_id, COUNT(b.id) as bookings, SUM(b.total_amount) as revenue
      FROM abhyasikas a
      JOIN bookings b ON b.abhyasika_id = a.id AND b.status IN ('confirmed', 'completed')
      GROUP BY a.id
      ORDER BY revenue DESC LIMIT 10
    `).all();

    const topCities = await db.prepare(`
      SELECT c.name, COUNT(DISTINCT a.id) as abhyasikas, COUNT(b.id) as bookings, SUM(b.total_amount) as revenue
      FROM cities c
      JOIN abhyasikas a ON a.city_id = c.id
      JOIN bookings b ON b.abhyasika_id = a.id AND b.status IN ('confirmed', 'completed')
      GROUP BY c.id ORDER BY revenue DESC LIMIT 5
    `).all();

    return c.json(successResponse({
      revenue: revenue.results,
      top_abhyasikas: topAbhyasikas.results,
      top_cities: topCities.results
    }));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch analytics'), 500);
  }
});

// GET /api/admin/analytics/users
admin.get('/analytics/users', authMiddleware, requireAdmin(), async (c) => {
  try {
    const db = c.env.DB;

    const userGrowth = await db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month,
        COUNT(*) as total,
        COUNT(CASE WHEN role = 'student' THEN 1 END) as students,
        COUNT(CASE WHEN role = 'owner' THEN 1 END) as owners
      FROM users
      GROUP BY month ORDER BY month DESC LIMIT 12
    `).all();

    const roleDistribution = await db.prepare(`
      SELECT role, COUNT(*) as count FROM users GROUP BY role
    `).all();

    return c.json(successResponse({
      growth: userGrowth.results,
      distribution: roleDistribution.results
    }));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch user analytics'), 500);
  }
});

// GET /api/admin/commission
admin.get('/commission', authMiddleware, requireAdmin(), async (c) => {
  try {
    const db = c.env.DB;
    const settings = await db.prepare('SELECT * FROM commission_settings ORDER BY created_at DESC').all();
    return c.json(successResponse(settings.results, 'Commission settings'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch'), 500);
  }
});

// POST /api/admin/commission
admin.post('/commission', authMiddleware, requireAdmin(), async (c) => {
  try {
    const user = c.get('user' as any) as any;
    const { commission_type, commission_value, effective_from } = await c.req.json();
    const db = c.env.DB;

    await db.prepare('UPDATE commission_settings SET is_active = 0 WHERE is_active = 1').run();
    await db.prepare(`
      INSERT INTO commission_settings (commission_type, commission_value, is_active, effective_from, created_by)
      VALUES (?, ?, 1, ?, ?)
    `).bind(commission_type, commission_value, effective_from, user.id).run();

    return c.json(successResponse(null, 'Commission updated'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to update commission'), 500);
  }
});

// GET /api/admin/settings
admin.get('/settings', authMiddleware, requireAdmin(), async (c) => {
  try {
    const db = c.env.DB;
    const settings = await db.prepare('SELECT * FROM platform_settings ORDER BY category, key').all();
    return c.json(successResponse(settings.results, 'Platform settings'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch settings'), 500);
  }
});

// PUT /api/admin/settings
admin.put('/settings', authMiddleware, requireAdmin(), async (c) => {
  try {
    const user = c.get('user' as any) as any;
    const updates = await c.req.json(); // Array of {key, value}
    const db = c.env.DB;

    for (const update of updates) {
      await db.prepare(`
        INSERT INTO platform_settings (key, value, updated_by, updated_at)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at
      `).bind(update.key, update.value, user.id).run();
    }

    return c.json(successResponse(null, 'Settings updated'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to update settings'), 500);
  }
});

// GET /api/admin/advertisements
admin.get('/advertisements', authMiddleware, requireAdmin(), async (c) => {
  try {
    const db = c.env.DB;
    const ads = await db.prepare('SELECT * FROM advertisements ORDER BY created_at DESC').all();
    return c.json(successResponse(ads.results, 'Advertisements'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch ads'), 500);
  }
});

// POST /api/admin/advertisements
admin.post('/advertisements', authMiddleware, requireAdmin(), async (c) => {
  try {
    const user = c.get('user' as any) as any;
    const body = await c.req.json();
    const { title, description, image_url, link_url, placement, target_audience, city_id, start_date, end_date, budget } = body;
    const db = c.env.DB;

    const result = await db.prepare(`
      INSERT INTO advertisements (title, description, image_url, link_url, placement, target_audience, city_id, start_date, end_date, budget, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(title, description, image_url, link_url, placement, target_audience, city_id, start_date, end_date, budget, user.id).run();

    return c.json(successResponse({ id: result.meta.last_row_id }, 'Ad created'), 201);
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to create ad'), 500);
  }
});

// GET /api/admin/payouts
admin.get('/payouts', authMiddleware, requireAdmin(), async (c) => {
  try {
    const db = c.env.DB;
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;

    const payouts = await db.prepare(`
      SELECT op.*, u.first_name, u.last_name, u.email
      FROM owner_payouts op
      JOIN users u ON u.id = op.owner_id
      ORDER BY op.created_at DESC LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    return c.json(successResponse(payouts.results, 'Payouts'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch payouts'), 500);
  }
});

// GET /api/admin/support-tickets
admin.get('/support-tickets', authMiddleware, requireAdmin(), async (c) => {
  try {
    const db = c.env.DB;
    const status = c.req.query('status') || '';

    let where = '1=1';
    const params: any[] = [];
    if (status) { where += ' AND st.status = ?'; params.push(status); }

    const tickets = await db.prepare(`
      SELECT st.*, u.first_name, u.last_name, u.email, u.role
      FROM support_tickets st
      JOIN users u ON u.id = st.user_id
      WHERE ${where}
      ORDER BY st.created_at DESC LIMIT 50
    `).bind(...params).all();

    return c.json(successResponse(tickets.results, 'Support tickets'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to fetch tickets'), 500);
  }
});

// POST /api/admin/broadcast-notification
admin.post('/broadcast-notification', authMiddleware, requireAdmin(), async (c) => {
  try {
    const { title, message, target_roles, channel = 'app' } = await c.req.json();
    const db = c.env.DB;

    let users;
    if (!target_roles || target_roles === 'all' || (Array.isArray(target_roles) && target_roles.length === 0)) {
      // Send to all active users
      users = await db.prepare('SELECT id FROM users WHERE is_active = 1').all();
    } else {
      // target_roles can be an array like ["student","owner"] OR a comma-separated string like "student,owner"
      const roles = Array.isArray(target_roles)
        ? target_roles.map((r: string) => r.trim()).filter(Boolean)
        : target_roles.split(',').map((r: string) => r.trim()).filter(Boolean);
      if (roles.length === 1) {
        users = await db.prepare('SELECT id FROM users WHERE is_active = 1 AND role = ?').bind(roles[0]).all();
      } else if (roles.length === 2) {
        users = await db.prepare('SELECT id FROM users WHERE is_active = 1 AND role IN (?, ?)').bind(roles[0], roles[1]).all();
      } else if (roles.length >= 3) {
        users = await db.prepare('SELECT id FROM users WHERE is_active = 1 AND role IN (?, ?, ?)').bind(roles[0], roles[1], roles[2]).all();
      } else {
        users = await db.prepare('SELECT id FROM users WHERE is_active = 1').all();
      }
    }

    let sentCount = 0;
    for (const user of users.results as any[]) {
      await db.prepare(`
        INSERT INTO notifications (user_id, type, title, message, channel)
        VALUES (?, 'broadcast', ?, ?, ?)
      `).bind(user.id, title, message, channel).run();
      sentCount++;
    }

    return c.json(successResponse({ sent_to: sentCount }, `Notification sent to ${sentCount} users`));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to send notification'), 500);
  }
});

// POST /api/admin/users/:id/reset-password - Admin resets a user's password
admin.post('/users/:id/reset-password', authMiddleware, requireAdmin(), async (c) => {
  try {
    const id = c.req.param('id');
    const { new_password } = await c.req.json();
    const db = c.env.DB;

    if (!new_password || new_password.length < 6) {
      return c.json(errorResponse('Password must be at least 6 characters'), 400);
    }

    const user = await db.prepare('SELECT id, email, first_name FROM users WHERE id = ?').bind(id).first() as any;
    if (!user) return c.json(errorResponse('User not found'), 404);

    const passwordHash = hashPassword(new_password);
    await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(passwordHash, id).run();
    await db.prepare('DELETE FROM user_sessions WHERE user_id = ?').bind(id).run();

    await db.prepare(`
      INSERT INTO notifications (user_id, type, title, message)
      VALUES (?, 'password_reset', 'Password Reset by Admin', 'Your password has been reset by the administrator. Please login with your new password.')
    `).bind(id).run();

    return c.json(successResponse(null, `Password reset for ${user.first_name} (${user.email})`));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to reset password'), 500);
  }
});

// DELETE /api/admin/users/:id - Permanently delete a user
admin.delete('/users/:id', authMiddleware, requireAdmin(), async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;

    const user = await db.prepare('SELECT id, email, role FROM users WHERE id = ?').bind(id).first() as any;
    if (!user) return c.json(errorResponse('User not found'), 404);
    if (user.role === 'super_admin') return c.json(errorResponse('Cannot delete admin account'), 403);

    await db.prepare('DELETE FROM user_sessions WHERE user_id = ?').bind(id).run();
    await db.prepare('DELETE FROM notifications WHERE user_id = ?').bind(id).run();
    await db.prepare('DELETE FROM password_resets WHERE user_id = ?').bind(id).run();

    if (user.role === 'student') {
      await db.prepare('DELETE FROM student_profiles WHERE user_id = ?').bind(id).run();
      await db.prepare(`UPDATE bookings SET status = 'cancelled', cancellation_reason = 'Account deleted' WHERE student_id = ? AND status NOT IN ('completed','cancelled')`).bind(id).run();
    }
    if (user.role === 'owner') {
      await db.prepare('DELETE FROM owner_profiles WHERE user_id = ?').bind(id).run();
      await db.prepare(`UPDATE abhyasikas SET is_active = 0, status = 'rejected' WHERE owner_id = ?`).bind(id).run();
    }

    await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
    return c.json(successResponse(null, `User account (${user.email}) permanently deleted`));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to delete user'), 500);
  }
});

// GET /api/admin/users/:id/details - Get detailed user profile for admin
admin.get('/users/:id/details', authMiddleware, requireAdmin(), async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;

    const user = await db.prepare(`
      SELECT u.id, u.uuid, u.email, u.phone, u.first_name, u.last_name, u.role,
        u.is_active, u.is_verified, u.created_at, u.last_login_at, u.avatar_url,
        op.business_name, op.pan_number, op.gst_number
      FROM users u
      LEFT JOIN student_profiles sp ON sp.user_id = u.id
      LEFT JOIN owner_profiles op ON op.user_id = u.id
      WHERE u.id = ?
    `).bind(id).first() as any;

    if (!user) return c.json(errorResponse('User not found'), 404);

    const bookings = await db.prepare(`SELECT COUNT(*) as total, COALESCE(SUM(total_amount),0) as revenue FROM bookings WHERE student_id = ?`).bind(id).first() as any;
    const listings = await db.prepare(`SELECT COUNT(*) as total FROM abhyasikas WHERE owner_id = ?`).bind(id).first() as any;

    return c.json(successResponse({
      user,
      stats: {
        total_bookings: bookings?.total || 0,
        total_spent: bookings?.revenue || 0,
        total_listings: listings?.total || 0
      }
    }, 'User details'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to get user details'), 500);
  }
});

export default admin;
