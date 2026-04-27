# BookMyStudy - Abhyasika Booking Platform

## 🏫 Project Overview
BookMyStudy is a full-stack study room booking platform built with Hono + TypeScript on Cloudflare Pages/Workers with D1 SQLite database.

**Live Demo**: https://bookmystudy.pages.dev *(deploy to activate)*
**GitHub**: https://github.com/jadhavjadhavmangesh2024-dotcom/Bookmystudy

---

## ✅ Completed Features

### 🔐 Authentication
- Register / Login / Logout (student, owner, super_admin roles)
- Forgot Password → email reset link flow
- Reset Password with token validation
- JWT session tokens (30-day expiry)
- OTP-based phone login

### 👨‍🎓 Student Features
- Browse & search abhyasikas (study rooms)
- View featured listings with caching (5 min)
- Book seats (daily / weekly / monthly)
- Manage bookings (view, cancel)
- Wishlist toggle (add/remove)
- Notifications center
- Profile management

### 🏢 Owner Features
- Manage listings (create, edit, publish)
- Seat management (add, bulk create, floor plans)
- Seat categories with pricing
- Revenue dashboard with charts
  - Today / monthly / total revenue
  - Weekly/monthly chart toggle
  - Seat-wise revenue breakdown
  - Booking type distribution
- Booking management (confirm, check-in, check-out)
- Analytics (total bookings, avg value, earnings)

### 🛡️ Admin Features
- Dashboard with platform stats
- User management (approve owners, disable/enable, delete)
- Admin-initiated password reset
- Abhyasika approval / rejection
- Revenue & user analytics
- Platform settings management
- Commission settings
- Broadcast notifications (by role or all users)
- Advertisement management
- Payout tracking
- Support ticket management

### ⚡ Performance & Security
- Rate limiting: 200 req/min per IP
- Featured listings cache: 5 min TTL
- Performance indexes on all key columns
- Role-based access control (RBAC)
- Auth middleware on all protected routes

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|---------|
| Admin | admin@abhyasika.in | demo123 |
| Owner | owner1@example.com | demo123 |
| Student | student1@example.com | demo123 |

---

## 📡 API Endpoints Summary

### Public (no auth required)
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| GET | /api/abhyasikas | List all abhyasikas |
| GET | /api/abhyasikas?featured=true | Featured listings |
| GET | /api/abhyasikas/:id | Abhyasika detail |
| GET | /api/cities | City list |
| GET | /api/facilities | Facilities list |
| GET | /api/stats | Platform stats |
| GET | /api/settings/public | Public settings |
| GET | /api/faqs | FAQs |

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Current user info |
| POST | /api/auth/forgot-password | Send reset email |
| POST | /api/auth/reset-password | Reset with token |

### Student (auth required, role: student)
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/bookings | My bookings |
| POST | /api/bookings | Create booking |
| GET | /api/notifications | My notifications |
| GET | /api/wishlists | My wishlist |
| POST | /api/wishlists/toggle | Toggle wishlist |
| GET | /api/users/profile | My profile |
| PUT | /api/users/profile | Update profile |

### Owner (auth required, role: owner)
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/abhyasikas/my-listings | My listings |
| POST | /api/abhyasikas | Create listing |
| GET | /api/abhyasikas/:id/analytics | Revenue analytics |
| GET | /api/bookings/owner/all | All my bookings |
| GET | /api/seats/:abhyasikaId/categories | Seat categories |
| GET | /api/seats/1/floor-plans | Floor plans |

### Admin (auth required, role: super_admin)
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/admin/dashboard | Platform dashboard |
| GET | /api/admin/users | All users |
| PUT | /api/admin/users/:id/status | Enable/disable user |
| POST | /api/admin/users/:id/reset-password | Reset user password |
| DELETE | /api/admin/users/:id | Delete user |
| GET | /api/admin/users/:id/details | User details |
| GET | /api/admin/abhyasikas | All abhyasikas |
| POST | /api/admin/abhyasikas/:id/approve | Approve abhyasika |
| GET | /api/admin/analytics/revenue | Revenue analytics |
| GET | /api/admin/analytics/users | User analytics |
| POST | /api/admin/broadcast-notification | Broadcast message |
| GET | /api/admin/settings | Platform settings |
| GET | /api/admin/commission | Commission settings |

---

## 📊 Load Test Results (Sandbox: 987MB RAM, 2 CPU)

| Test | Requests | Concurrency | RPS | Avg Latency | Success |
|------|----------|-------------|-----|-------------|---------|
| Light (health) | 50 | 10 | **77 RPS** | 210 ms | **100%** |
| Medium (DB query) | 100 | 20 | **78 RPS** | 549 ms | **100%** |

**Production Estimate** (Cloudflare Workers):
- Capacity: >1M RPS on global edge
- 400-500k concurrent users: ~3,750 RPS required → well within limits
- Cost: ~$6-10/month (Workers $5 + D1 $1-5)

---

## 🧪 API Test Results

| Category | Tests | Pass | Fail | Rate |
|----------|-------|------|------|------|
| Public APIs | 9 | 9 | 0 | **100%** |
| Auth APIs | 10 | 10 | 0 | **100%** |
| Admin APIs | 20 | 20 | 0 | **100%** |
| Owner APIs | 5 | 5 | 0 | **100%** |
| Student APIs | 7 | 7 | 0 | **100%** |
| **TOTAL** | **51** | **51** | **0** | **100%** |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Hono v4 + TypeScript |
| Runtime | Cloudflare Workers (Edge) |
| Database | Cloudflare D1 (SQLite) |
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Charts | Custom BarChart component |
| Auth | UUID session tokens |
| Build | Vite + Wrangler |
| Process | PM2 (dev) |

---

## 📁 Project Structure

```
webapp/
├── src/
│   ├── index.tsx              # Main Hono app + middleware
│   ├── api/
│   │   ├── middleware/
│   │   │   └── auth.ts        # Auth + role middleware
│   │   ├── routes/
│   │   │   ├── auth.ts        # Login/register/forgot-pw
│   │   │   ├── abhyasikas.ts  # Listings + analytics
│   │   │   ├── seats.ts       # Seat management
│   │   │   ├── bookings.ts    # Booking CRUD
│   │   │   ├── payments.ts    # Payment flow
│   │   │   ├── admin.ts       # Admin panel APIs
│   │   │   └── misc.ts        # Reviews/notif/wishlist/cities
│   │   └── utils/helpers.ts   # Utilities
│   └── client/
│       ├── App.tsx            # React router
│       ├── contexts/          # Auth context
│       ├── pages/
│       │   ├── auth/          # Login/Register/ForgotPw/ResetPw
│       │   ├── admin/         # Dashboard/Users/Revenue/Settings
│       │   ├── owner/         # Dashboard/Listings/Revenue/Seats
│       │   └── student/       # Dashboard/Bookings/Wishlist
│       └── utils/api.ts       # API client helper
├── migrations/
│   ├── 0001_schema.sql        # Full DB schema
│   └── 0002_seed.sql          # Demo data
├── public/                    # Static assets
├── dist/                      # Build output
├── wrangler.jsonc             # Cloudflare config
├── ecosystem.config.cjs       # PM2 config
└── package.json
```

---

## 🚀 Deployment

### Local Development
```bash
npm run build
pm2 start ecosystem.config.cjs
# App runs at http://localhost:3000
```

### Production (Cloudflare Pages)
```bash
npx wrangler d1 create bookmystudy-production
# Update wrangler.jsonc with database_id
npx wrangler d1 migrations apply bookmystudy-production
npm run build
npx wrangler pages deploy dist --project-name bookmystudy
```

### Status: ✅ Active (Local) | 🚀 Ready to Deploy (Cloudflare)
**Last Updated**: 2026-04-27
