# BookMyStudy (Abhyasika) - Study Room Booking Platform

## Project Overview
- **Name**: BookMyStudy (Abhyasika)
- **Goal**: Platform to discover, book, and manage study rooms (abhyasikas) across India
- **Platform**: Cloudflare Pages + Workers (Edge Deployment)
- **Tech Stack**: Hono + TypeScript + React + Tailwind CSS + Cloudflare D1 SQLite

## GitHub Repository
- **URL**: https://github.com/jadhavjadhavmangesh2024-dotcom/Bookmystudy

## Features Implemented

### Core Features
- ✅ **Student Portal**: Browse/search abhyasikas, booking management, wishlist, notifications
- ✅ **Owner Portal**: List management, seat/floor plans, revenue analytics with charts
- ✅ **Admin Panel**: Full user/owner management, approval workflow, revenue analytics, broadcast notifications
- ✅ **Authentication**: Login/Register/Forgot-Password/Reset-Password flows
- ✅ **Security**: JWT-based auth, role-based access control (student/owner/super_admin)
- ✅ **Rate Limiting**: 500 req/min/IP (skipped for localhost/internal IPs)
- ✅ **Caching**: CDN cache headers for public listing endpoints (2 min)
- ✅ **Performance Indexes**: DB indexes on frequently queried columns

### Admin Features
- ✅ Password reset for any user
- ✅ Disable/Enable users
- ✅ Delete users (with cleanup)
- ✅ Approve/Reject owner registrations
- ✅ Broadcast notifications (by role or all users)
- ✅ Revenue analytics (daily/monthly/yearly)
- ✅ Commission settings management
- ✅ Platform settings management
- ✅ Advertisements management

### Owner Features
- ✅ Revenue dashboard with charts (weekly/monthly toggle)
- ✅ Seat-wise revenue breakdown
- ✅ Booking type distribution analytics
- ✅ Recent bookings table
- ✅ Floor plan management
- ✅ Seat category management

## Demo Credentials (All use password: `demo123`)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@abhyasika.in | demo123 |
| Owner | owner1@example.com | demo123 |
| Owner | owner2@example.com | demo123 |
| Student | student1@example.com | demo123 |
| Student | student2@example.com | demo123 |

> Note: In demo mode, any password from the list `[demo123, Demo@123, Admin@123, Owner@123, Student@123, password, admin123]` works for all accounts.

## API Endpoints Summary

### Public APIs
- `GET /api/health` - Health check
- `GET /api/abhyasikas` - List study rooms (with search/filter/pagination)
- `GET /api/abhyasikas?featured=true` - Featured listings (cached 2 min)
- `GET /api/abhyasikas/:id` - Room details
- `GET /api/cities` - Cities list
- `GET /api/facilities` - Facilities list
- `GET /api/stats` - Platform stats

### Auth APIs
- `POST /api/auth/login` - Login (returns session token)
- `POST /api/auth/register` - Register (student immediate, owner pending approval)
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Send password reset link
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/me` - Get current user profile

### Student APIs (require Bearer token)
- `GET /api/bookings` - My bookings (filterable by status)
- `POST /api/bookings` - Create booking
- `GET /api/notifications` - Notifications
- `GET /api/wishlists` - Wishlist
- `POST /api/wishlists/toggle` - Toggle wishlist item
- `GET /api/users/profile` - My profile

### Owner APIs (require Owner role)
- `GET /api/abhyasikas/my-listings` - My study rooms
- `POST /api/abhyasikas` - Create new listing
- `PUT /api/abhyasikas/:id` - Update listing
- `GET /api/abhyasikas/:id/analytics` - Revenue & booking analytics
- `GET /api/bookings/owner/all` - All bookings for my rooms
- `GET /api/seats?abhyasika_id=X` - Seats for a room
- `GET /api/seats/categories?abhyasika_id=X` - Seat categories

### Admin APIs (require super_admin role)
- `GET /api/admin/dashboard` - Platform overview stats
- `GET /api/admin/users` - All users (filterable/searchable)
- `GET /api/admin/users/:id/details` - Detailed user profile + stats
- `PUT /api/admin/users/:id/status` - Activate/deactivate user
- `POST /api/admin/users/:id/reset-password` - Reset user password
- `DELETE /api/admin/users/:id` - Delete user (with cleanup)
- `GET /api/admin/abhyasikas` - All listings (filterable)
- `POST /api/admin/abhyasikas/:id/approve` - Approve listing
- `POST /api/admin/abhyasikas/:id/reject` - Reject listing
- `POST /api/admin/broadcast-notification` - Broadcast to users by role
- `GET /api/admin/analytics/revenue` - Revenue analytics
- `GET /api/admin/analytics/users` - User growth analytics
- `GET/PUT /api/admin/settings` - Platform settings
- `GET/POST /api/admin/commission` - Commission settings

## Data Architecture
- **Database**: Cloudflare D1 (SQLite) 
- **Schema**: users, user_sessions, abhyasikas, seats, seat_categories, bookings, payments, notifications, wishlists, reviews, cities, facilities, platform_settings, advertisements, payouts
- **Migrations**: `migrations/0001_schema.sql` (schema), `migrations/0002_seed.sql` (demo data)

## Load Test Results (Sandbox: 987MB RAM, 2 CPU)
| Test | Connections | RPS | Avg Latency | Errors |
|------|------------|-----|-------------|--------|
| Light | 20c / 2t / 8s | ~226 | 88ms | 0 |
| Previous | 20c / 2t / 10s | ~197 | 101ms | 0 |
| Medium | 100c / 4t / 10s | ~70 | 440ms | 19 timeouts |

> **Production Note**: On Cloudflare Workers, expected 400,000-500,000 concurrent users (~3,750 RPS). Cost: $6-10/month.

## Development Setup
```bash
npm install
npm run build
npm run db:migrate:local     # Apply migrations to local D1
npm run db:seed              # Seed demo data
pm2 start ecosystem.config.cjs
```

## Deployment
```bash
npm run deploy   # Build + deploy to Cloudflare Pages
```

## Deployment Status
- **Platform**: Cloudflare Pages/Workers
- **Status**: 🟡 Ready for production deployment
- **Last Updated**: 2026-04-27
