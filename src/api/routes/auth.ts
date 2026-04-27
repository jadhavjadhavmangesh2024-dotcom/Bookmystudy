// ============================================================
// AUTH ROUTES - Login, Register, OTP, Password Reset
// ============================================================
import { Hono } from 'hono';
import { generateUUID, generateOTP, hashPassword, verifyPassword, successResponse, errorResponse } from '../utils/helpers';

const auth = new Hono<{ Bindings: { DB: D1Database } }>();

// POST /api/auth/register
auth.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    // Accept both snake_case (first_name) and camelCase (firstName) field names
    const first_name = body.first_name || body.firstName;
    const last_name = body.last_name || body.lastName;
    const { email, phone, password, role = 'student' } = body;

    if (!email || !password || !first_name || !last_name) {
      return c.json(errorResponse('Missing required fields'), 400);
    }

    if (!['student', 'owner'].includes(role)) {
      return c.json(errorResponse('Invalid role'), 400);
    }

    const db = c.env.DB;

    // Check existing
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) {
      return c.json(errorResponse('Email already registered'), 409);
    }

    const uuid = generateUUID();
    const passwordHash = hashPassword(password);

    // Owners start as inactive (pending admin approval); students are active immediately
    const isActive = role === 'owner' ? 0 : 1;

    const result = await db.prepare(`
      INSERT INTO users (uuid, email, phone, password_hash, first_name, last_name, role, is_verified, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).bind(uuid, email, phone || null, passwordHash, first_name, last_name, role, isActive).run();

    const userId = result.meta.last_row_id;

    // Create profile
    if (role === 'student') {
      await db.prepare('INSERT INTO student_profiles (user_id) VALUES (?)').bind(userId).run();
    } else if (role === 'owner') {
      await db.prepare('INSERT INTO owner_profiles (user_id) VALUES (?)').bind(userId).run();
      // Notify admins about new owner registration
      const admins = await db.prepare("SELECT id FROM users WHERE role = 'super_admin'").all();
      for (const admin of (admins.results as any[])) {
        await db.prepare(`
          INSERT INTO notifications (user_id, type, title, message)
          VALUES (?, 'new_owner_registration', 'New Owner Registration', ?)
        `).bind(admin.id, `${first_name} ${last_name} (${email}) has registered as a new library owner. Please review and approve/reject.`).run();
      }
    }

    // Owners need admin approval, return without token
    if (role === 'owner') {
      return c.json(successResponse({
        pending_approval: true,
        user: { id: userId, uuid, email, first_name, last_name, role }
      }, 'Registration submitted! Your account is pending admin approval. You will be notified once approved.'), 201);
    }

    // Students get immediate access
    const token = generateUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await db.prepare(`
      INSERT INTO user_sessions (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `).bind(userId, token, expiresAt).run();

    return c.json(successResponse({
      token,
      user: { id: userId, uuid, email, first_name, last_name, role }
    }, 'Registration successful'), 201);
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Registration failed'), 500);
  }
});

// POST /api/auth/login
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json(errorResponse('Email and password required'), 400);
    }

    const db = c.env.DB;
    const user = await db.prepare(`
      SELECT * FROM users WHERE email = ?
    `).bind(email).first() as any;

    if (!user) {
      return c.json(errorResponse('Invalid credentials'), 401);
    }

    // Check if owner is pending approval
    if (user.role === 'owner' && !user.is_active) {
      return c.json(errorResponse('Your account is pending admin approval. Please wait for approval before logging in.'), 403);
    }

    // Check if account is deactivated
    if (!user.is_active) {
      return c.json(errorResponse('Your account has been deactivated. Please contact support.'), 403);
    }

    if (!verifyPassword(password, user.password_hash)) {
      return c.json(errorResponse('Invalid credentials'), 401);
    }

    // Invalidate old sessions
    await db.prepare(`DELETE FROM user_sessions WHERE user_id = ? AND expires_at < datetime('now')`).bind(user.id).run();

    // Create new session
    const token = generateUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await db.prepare(`
      INSERT INTO user_sessions (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `).bind(user.id, token, expiresAt).run();

    // Update last login
    await db.prepare('UPDATE users SET last_login_at = datetime("now") WHERE id = ?').bind(user.id).run();

    return c.json(successResponse({
      token,
      user: {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        phone: user.phone,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        avatar_url: user.avatar_url
      }
    }, 'Login successful'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Login failed'), 500);
  }
});

// POST /api/auth/logout
auth.post('/logout', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (token) {
    const db = c.env.DB;
    await db.prepare('DELETE FROM user_sessions WHERE token = ?').bind(token).run();
  }
  return c.json(successResponse(null, 'Logged out successfully'));
});

// POST /api/auth/send-otp
auth.post('/send-otp', async (c) => {
  try {
    const { phone, purpose = 'login' } = await c.req.json();
    if (!phone) return c.json(errorResponse('Phone number required'), 400);

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const db = c.env.DB;

    await db.prepare(`
      INSERT INTO phone_verifications (phone, otp, purpose, expires_at)
      VALUES (?, ?, ?, ?)
    `).bind(phone, otp, purpose, expiresAt).run();

    // In production: send SMS via Twilio/MSG91
    console.log(`OTP for ${phone}: ${otp}`);

    return c.json(successResponse({ message: 'OTP sent' }, 'OTP sent successfully'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to send OTP'), 500);
  }
});

// POST /api/auth/verify-otp
auth.post('/verify-otp', async (c) => {
  try {
    const { phone, otp } = await c.req.json();
    const db = c.env.DB;

    const record = await db.prepare(`
      SELECT * FROM phone_verifications 
      WHERE phone = ? AND otp = ? AND expires_at > datetime('now') AND verified_at IS NULL
      ORDER BY created_at DESC LIMIT 1
    `).bind(phone, otp).first() as any;

    if (!record) {
      return c.json(errorResponse('Invalid or expired OTP'), 400);
    }

    await db.prepare('UPDATE phone_verifications SET verified_at = datetime("now") WHERE id = ?').bind(record.id).run();

    // Find or create user by phone
    let user = await db.prepare('SELECT * FROM users WHERE phone = ?').bind(phone).first() as any;
    
    if (!user) {
      return c.json(successResponse({ phone_verified: true, user: null }, 'OTP verified - complete registration'));
    }

    const token = generateUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await db.prepare('INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)').bind(user.id, token, expiresAt).run();

    return c.json(successResponse({ token, user }, 'OTP verified'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'OTP verification failed'), 500);
  }
});

// POST /api/auth/forgot-password
auth.post('/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json();
    const db = c.env.DB;
    const user = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first() as any;
    
    if (!user) return c.json(successResponse(null, 'If account exists, reset email sent'));

    const token = generateUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await db.prepare('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)').bind(user.id, token, expiresAt).run();

    // In production: send email
    console.log(`Password reset token for ${email}: ${token}`);

    return c.json(successResponse(null, 'Password reset email sent'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to send reset email'), 500);
  }
});

// POST /api/auth/reset-password
auth.post('/reset-password', async (c) => {
  try {
    const { token, password } = await c.req.json();
    const db = c.env.DB;

    const reset = await db.prepare(`
      SELECT * FROM password_resets 
      WHERE token = ? AND expires_at > datetime('now') AND used_at IS NULL
    `).bind(token).first() as any;

    if (!reset) return c.json(errorResponse('Invalid or expired reset token'), 400);

    const passwordHash = hashPassword(password);
    await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(passwordHash, reset.user_id).run();
    await db.prepare('UPDATE password_resets SET used_at = datetime("now") WHERE id = ?').bind(reset.id).run();

    return c.json(successResponse(null, 'Password reset successfully'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Password reset failed'), 500);
  }
});

// GET /api/auth/me
auth.get('/me', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return c.json(errorResponse('Not authenticated'), 401);

    const db = c.env.DB;
    const session = await db.prepare(`
      SELECT u.id, u.uuid, u.email, u.phone, u.first_name, u.last_name, u.role, 
             u.avatar_url, u.is_verified, u.created_at
      FROM user_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `).bind(token).first();

    if (!session) return c.json(errorResponse('Session expired'), 401);

    return c.json(successResponse(session, 'User profile'));
  } catch (err: any) {
    return c.json(errorResponse(err.message || 'Failed to get profile'), 500);
  }
});

export default auth;
