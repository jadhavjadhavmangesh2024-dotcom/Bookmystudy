// ============================================================
// Authentication Middleware
// ============================================================
import { Context, Next } from 'hono';
import { errorResponse } from '../utils/helpers';

export interface AuthUser {
  id: number;
  uuid: string;
  email: string;
  role: 'super_admin' | 'owner' | 'student';
  first_name: string;
  last_name: string;
}

export async function authMiddleware(c: Context, next: Next) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return c.json(errorResponse('Authentication required', 'AUTH_REQUIRED'), 401);
  }

  try {
    const db = c.env.DB as D1Database;
    const session = await db.prepare(`
      SELECT s.*, u.id as user_id, u.uuid, u.email, u.role, u.first_name, u.last_name, u.is_active
      FROM user_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `).bind(token).first() as any;

    if (!session) {
      return c.json(errorResponse('Invalid or expired token', 'TOKEN_INVALID'), 401);
    }

    if (!session.is_active) {
      return c.json(errorResponse('Account is deactivated', 'ACCOUNT_INACTIVE'), 401);
    }

    c.set('user', {
      id: session.user_id,
      uuid: session.uuid,
      email: session.email,
      role: session.role,
      first_name: session.first_name,
      last_name: session.last_name
    } as AuthUser);

    await next();
  } catch (err) {
    return c.json(errorResponse('Authentication failed', 'AUTH_FAILED'), 401);
  }
}

export function requireRole(...roles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as AuthUser;
    if (!user || !roles.includes(user.role)) {
      return c.json(errorResponse('Insufficient permissions', 'FORBIDDEN'), 403);
    }
    await next();
  };
}

export function requireAdmin() {
  return requireRole('super_admin');
}

export function requireOwner() {
  return requireRole('super_admin', 'owner');
}
