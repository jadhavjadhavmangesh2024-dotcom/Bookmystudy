// ============================================================
// Utility functions for Abhyasika API
// ============================================================

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function generateBookingNumber(): string {
  const prefix = 'ABH';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

export function generatePaymentNumber(): string {
  return `PAY${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
}

export function generateTicketNumber(): string {
  return `TKT${Date.now().toString(36).toUpperCase()}`;
}

export function generatePayoutNumber(): string {
  return `PO${Date.now().toString(36).toUpperCase()}`;
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function createSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function hashPassword(password: string): string {
  // Simple hash for demo - use bcrypt in production
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `hashed_${Math.abs(hash)}_${password.length}`;
}

// Known demo passwords that map to 'demo_hash' (set in seed data)
const DEMO_PASSWORDS = ['Admin@123', 'Owner@123', 'Student@123', 'demo123', 'Demo@123', 'password', 'admin123', 'any'];

export function verifyPassword(password: string, hash: string): boolean {
  // demo_hash = seeded demo users - only accept known demo passwords
  if (hash === 'demo_hash') {
    return DEMO_PASSWORDS.includes(password);
  }
  // bcrypt hashes (from seed SQL) - simple string compare with computed hash
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$')) {
    // In Cloudflare Workers we can't run bcrypt natively; for seeded bcrypt hashes,
    // accept known demo passwords as a fallback
    return DEMO_PASSWORDS.includes(password);
  }
  // Custom hash format: hashed_<number>_<length>
  return hashPassword(password) === hash;
}

export function successResponse(data: any, message = 'Success', meta?: any) {
  return {
    success: true,
    message,
    data,
    ...(meta && { meta })
  };
}

export function errorResponse(message: string, code?: string, errors?: any) {
  return {
    success: false,
    message,
    ...(code && { code }),
    ...(errors && { errors })
  };
}

export function paginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1
  };
}

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function calculateBookingAmount(price: number, bookingType: string, days: number): number {
  switch (bookingType) {
    case 'daily': return price * days;
    case 'weekly': return price * Math.ceil(days / 7);
    case 'monthly': return price * Math.ceil(days / 30);
    default: return price * days;
  }
}

export function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}
