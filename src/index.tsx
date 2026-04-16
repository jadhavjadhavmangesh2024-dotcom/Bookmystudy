// ============================================================
// ABHYASIKA STUDY ROOMS - MAIN HONO APP (Backend + Frontend)
// ============================================================
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serveStatic } from 'hono/cloudflare-workers';

import authRoutes from './api/routes/auth';
import abhyasikaRoutes from './api/routes/abhyasikas';
import seatRoutes from './api/routes/seats';
import bookingRoutes from './api/routes/bookings';
import paymentRoutes from './api/routes/payments';
import adminRoutes from './api/routes/admin';
import miscRoutes from './api/routes/misc';

// ============================================================
// IN-MEMORY CACHE (edge-local, resets per Worker instance)
// For production use Cloudflare KV for shared cache
// ============================================================
const memCache = new Map<string, { data: any; expires: number }>();

function cacheGet(key: string): any | null {
  const entry = memCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) { memCache.delete(key); return null; }
  return entry.data;
}

function cacheSet(key: string, data: any, ttlSeconds: number): void {
  // Limit cache size to avoid memory issues
  if (memCache.size > 500) {
    const firstKey = memCache.keys().next().value;
    if (firstKey) memCache.delete(firstKey);
  }
  memCache.set(key, { data, expires: Date.now() + ttlSeconds * 1000 });
}

// ============================================================
// RATE LIMITER (in-memory per Worker instance)
// ============================================================
const rateLimitStore = new Map<string, { count: number; reset: number }>();

function checkRateLimit(ip: string, maxReq: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitStore.set(ip, { count: 1, reset: now + windowMs });
    return true; // allowed
  }
  entry.count++;
  if (entry.count > maxReq) return false; // blocked
  return true;
}

const app = new Hono<{ Bindings: { DB: D1Database } }>();

// Expose cache helpers to routes via context
app.use('*', async (c, next) => {
  (c as any).cache = { get: cacheGet, set: cacheSet };
  await next();
});

// ============================================================
// MIDDLEWARE
// ============================================================
app.use('*', logger());
app.use('/api/*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  exposeHeaders: ['X-Total-Count', 'X-RateLimit-Remaining'],
  maxAge: 600
}));

// Rate limiting middleware - 200 req/min per IP on API routes
app.use('/api/*', async (c, next) => {
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
  const allowed = checkRateLimit(ip, 200, 60_000);
  if (!allowed) {
    return c.json({ success: false, error: 'Too many requests. Please slow down.' }, 429);
  }
  await next();
});

// Cache control headers for public GET endpoints
app.use('/api/abhyasikas*', async (c, next) => {
  await next();
  const method = c.req.method;
  if (method === 'GET' && c.res.status === 200) {
    // Cache public listing/featured for 2 minutes on CDN
    c.res.headers.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=60');
  }
});

// ============================================================
// API ROUTES
// ============================================================
app.route('/api/auth', authRoutes);
app.route('/api/abhyasikas', abhyasikaRoutes);
app.route('/api/seats', seatRoutes);
app.route('/api/bookings', bookingRoutes);
app.route('/api/payments', paymentRoutes);
app.route('/api/admin', adminRoutes);

// Misc routes (reviews, notifications, cities, etc.)
app.route('/api', miscRoutes);

// ============================================================
// DATABASE INIT (Auto-create tables if needed)
// ============================================================
app.get('/api/health', async (c) => {
  try {
    const db = c.env.DB;
    await db.prepare('SELECT 1').first();
    return c.json({ status: 'healthy', timestamp: new Date().toISOString(), service: 'BookMyStudy API' });
  } catch (err) {
    return c.json({ status: 'degraded', error: String(err) }, 503);
  }
});

// ============================================================
// STATIC FILES
// ============================================================
app.use('/static/*', serveStatic({ root: './' }));
app.use('/assets/*', serveStatic({ root: './' }));
app.use('/favicon.ico', serveStatic({ path: './favicon.ico' }));

// ============================================================
// SPA FALLBACK - Serve React App
// ============================================================
app.get('*', (c) => {
  return c.html(getHTMLShell());
});

function getHTMLShell() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BookMyStudy - Find Your Perfect Study Space</title>
  <meta name="description" content="BookMyStudy is India's largest marketplace for study rooms and libraries. Find, book and manage your perfect study space.">
  <meta name="theme-color" content="#0f766e">
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: {
              50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4',
              300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6',
              600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a'
            },
            accent: {
              50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa',
              300: '#fdba74', 400: '#fb923c', 500: '#f97316',
              600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12'
            }
          }
        }
      }
    }
  </script>
  
  <!-- Font Awesome -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  
  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; }
    .font-poppins { font-family: 'Poppins', sans-serif; }
    
    /* Custom scrollbar */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: #f1f5f9; }
    ::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 3px; }
    
    /* Animations */
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    .fade-in { animation: fadeIn 0.3s ease-out; }
    .slide-in { animation: slideIn 0.3s ease-out; }
    .loading-spinner { animation: spin 1s linear infinite; }
    .loading-pulse { animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite; }
    
    /* Gradient backgrounds */
    .gradient-primary { background: linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #059669 100%); }
    .gradient-hero { background: linear-gradient(135deg, #042f2e 0%, #0f766e 45%, #065f46 100%); }
    .gradient-card { background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%); }
    .gradient-warm { background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); }
    
    /* Card hover effects */
    .card-hover { transition: all 0.3s ease; }
    .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
    
    /* Sidebar */
    .sidebar-transition { transition: all 0.3s ease; }
    
    /* Custom badge */
    .badge { display: inline-flex; align-items: center; padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    
    /* Rating stars */
    .star-filled { color: #F59E0B; }
    .star-empty { color: #D1D5DB; }
    
    /* Seat map */
    .seat { width: 40px; height: 40px; border-radius: 8px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 600; }
    .seat:hover { transform: scale(1.1); }
    .seat.available { background: #d1fae5; color: #065f46; border: 2px solid #34d399; }
    .seat.occupied { background: #fee2e2; color: #991b1b; border: 2px solid #f87171; cursor: not-allowed; }
    .seat.reserved { background: #fef3c7; color: #92400e; border: 2px solid #fbbf24; cursor: not-allowed; }
    .seat.selected { background: #0f766e; color: white; border: 2px solid #0d9488; }
    .seat.maintenance { background: #f3f4f6; color: #6b7280; border: 2px dashed #9ca3af; cursor: not-allowed; }
    
    /* Map container */
    #map { border-radius: 12px; overflow: hidden; }
    
    /* Toast notification */
    .toast { position: fixed; top: 80px; right: 20px; z-index: 9999; padding: 14px 20px; border-radius: 12px; color: white; font-weight: 500; max-width: 380px; box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
    .toast-success { background: linear-gradient(135deg, #059669, #10b981); }
    .toast-error { background: linear-gradient(135deg, #dc2626, #ef4444); }
    .toast-info { background: linear-gradient(135deg, #2563eb, #3b82f6); }
    .toast-warning { background: linear-gradient(135deg, #d97706, #f59e0b); }
    
    /* Mobile nav overlay */
    .mobile-overlay { background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); }
    
    /* Mobile responsive improvements */
    @media (max-width: 640px) {
      .card-hover:hover { transform: none; }
      .toast { right: 12px; left: 12px; max-width: 100%; font-size: 0.85rem; }
    }
    
    /* Scrollable tabs on mobile */
    .tabs-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
    .tabs-scroll::-webkit-scrollbar { display: none; }
    
    /* Touch-friendly buttons */
    @media (max-width: 768px) {
      .seat { width: 34px; height: 34px; font-size: 0.55rem; }
    }
  </style>
</head>
<body class="bg-gray-50">
  <div id="app"></div>
  
  <!-- React App Bundle -->
  <script src="/static/main.js"></script>
</body>
</html>`;
}

export default app;
