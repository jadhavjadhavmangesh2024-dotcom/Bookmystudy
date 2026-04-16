-- ============================================================
-- ABHYASIKA STUDY ROOMS - COMPLETE DATABASE SCHEMA
-- 50+ Tables for full SaaS marketplace platform
-- ============================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('super_admin','owner','student')),
  avatar_url TEXT,
  is_verified INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  email_verified_at DATETIME,
  phone_verified_at DATETIME,
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. USER SESSIONS
CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  refresh_token TEXT UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. EMAIL VERIFICATIONS
CREATE TABLE IF NOT EXISTS email_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  verified_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. PHONE VERIFICATIONS (OTP)
CREATE TABLE IF NOT EXISTS phone_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL,
  otp TEXT NOT NULL,
  purpose TEXT DEFAULT 'login',
  expires_at DATETIME NOT NULL,
  verified_at DATETIME,
  attempts INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. PASSWORD RESETS
CREATE TABLE IF NOT EXISTS password_resets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. CITIES
CREATE TABLE IF NOT EXISTS cities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT DEFAULT 'India',
  latitude REAL,
  longitude REAL,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. LOCALITIES (Areas within cities)
CREATE TABLE IF NOT EXISTS localities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  pincode TEXT,
  latitude REAL,
  longitude REAL,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (city_id) REFERENCES cities(id)
);

-- 8. FACILITY CATEGORIES
CREATE TABLE IF NOT EXISTS facility_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. FACILITIES
CREATE TABLE IF NOT EXISTS facilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_premium INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES facility_categories(id)
);

-- 10. ABHYASIKA PROFILES (Study Rooms/Libraries)
CREATE TABLE IF NOT EXISTS abhyasikas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  owner_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  tagline TEXT,
  city_id INTEGER,
  locality_id INTEGER,
  address TEXT NOT NULL,
  pincode TEXT,
  latitude REAL,
  longitude REAL,
  phone TEXT,
  email TEXT,
  website TEXT,
  google_maps_url TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','suspended')),
  approval_notes TEXT,
  approved_at DATETIME,
  approved_by INTEGER,
  is_featured INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  total_seats INTEGER DEFAULT 0,
  available_seats INTEGER DEFAULT 0,
  rating_avg REAL DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  opening_time TEXT DEFAULT '06:00',
  closing_time TEXT DEFAULT '22:00',
  days_open TEXT DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
  cancellation_policy TEXT DEFAULT 'flexible',
  cancellation_hours INTEGER DEFAULT 24,
  refund_percentage INTEGER DEFAULT 100,
  late_cancel_refund INTEGER DEFAULT 50,
  no_show_policy TEXT DEFAULT 'no_refund',
  custom_policy_text TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (city_id) REFERENCES cities(id),
  FOREIGN KEY (locality_id) REFERENCES localities(id)
);

-- 11. ABHYASIKA PHOTOS
CREATE TABLE IF NOT EXISTS abhyasika_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  abhyasika_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  is_primary INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (abhyasika_id) REFERENCES abhyasikas(id) ON DELETE CASCADE
);

-- 12. ABHYASIKA FACILITIES MAPPING
CREATE TABLE IF NOT EXISTS abhyasika_facilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  abhyasika_id INTEGER NOT NULL,
  facility_id INTEGER NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (abhyasika_id) REFERENCES abhyasikas(id) ON DELETE CASCADE,
  FOREIGN KEY (facility_id) REFERENCES facilities(id)
);

-- 13. FLOOR PLANS
CREATE TABLE IF NOT EXISTS floor_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  abhyasika_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  floor_number INTEGER DEFAULT 1,
  layout_data TEXT,
  image_url TEXT,
  total_seats INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (abhyasika_id) REFERENCES abhyasikas(id) ON DELETE CASCADE
);

-- 14. SEAT CATEGORIES
CREATE TABLE IF NOT EXISTS seat_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  abhyasika_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color_code TEXT DEFAULT '#3B82F6',
  daily_price REAL DEFAULT 0,
  weekly_price REAL DEFAULT 0,
  monthly_price REAL DEFAULT 0,
  amenities TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (abhyasika_id) REFERENCES abhyasikas(id) ON DELETE CASCADE
);

-- 15. SEATS
CREATE TABLE IF NOT EXISTS seats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  abhyasika_id INTEGER NOT NULL,
  floor_plan_id INTEGER,
  category_id INTEGER,
  seat_number TEXT NOT NULL,
  seat_label TEXT,
  row_number INTEGER,
  column_number INTEGER,
  position_x REAL,
  position_y REAL,
  status TEXT DEFAULT 'available' CHECK(status IN ('available','occupied','reserved','maintenance','blocked')),
  is_active INTEGER DEFAULT 1,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (abhyasika_id) REFERENCES abhyasikas(id) ON DELETE CASCADE,
  FOREIGN KEY (floor_plan_id) REFERENCES floor_plans(id),
  FOREIGN KEY (category_id) REFERENCES seat_categories(id)
);

-- 16. SEAT PRICING (Flexible pricing overrides)
CREATE TABLE IF NOT EXISTS seat_pricing (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seat_id INTEGER,
  category_id INTEGER,
  abhyasika_id INTEGER NOT NULL,
  pricing_type TEXT NOT NULL CHECK(pricing_type IN ('daily','weekly','monthly','hourly')),
  price REAL NOT NULL,
  discount_price REAL,
  valid_from DATE,
  valid_to DATE,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seat_id) REFERENCES seats(id),
  FOREIGN KEY (category_id) REFERENCES seat_categories(id),
  FOREIGN KEY (abhyasika_id) REFERENCES abhyasikas(id)
);

-- 17. OPERATING HOURS
CREATE TABLE IF NOT EXISTS operating_hours (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  abhyasika_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
  opening_time TEXT NOT NULL,
  closing_time TEXT NOT NULL,
  is_closed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (abhyasika_id) REFERENCES abhyasikas(id) ON DELETE CASCADE
);

-- 18. BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_number TEXT UNIQUE NOT NULL,
  student_id INTEGER NOT NULL,
  abhyasika_id INTEGER NOT NULL,
  seat_id INTEGER NOT NULL,
  category_id INTEGER,
  booking_type TEXT NOT NULL CHECK(booking_type IN ('daily','weekly','monthly','hourly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TEXT,
  end_time TEXT,
  total_days INTEGER DEFAULT 1,
  base_amount REAL NOT NULL,
  discount_amount REAL DEFAULT 0,
  coupon_code TEXT,
  coupon_discount REAL DEFAULT 0,
  platform_fee REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  total_amount REAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','cancelled','completed','no_show')),
  cancellation_reason TEXT,
  cancelled_at DATETIME,
  cancelled_by INTEGER,
  check_in_at DATETIME,
  check_out_at DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (abhyasika_id) REFERENCES abhyasikas(id),
  FOREIGN KEY (seat_id) REFERENCES seats(id)
);

-- 19. BOOKING HISTORY (Status tracking)
CREATE TABLE IF NOT EXISTS booking_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by INTEGER,
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- 20. SEAT AVAILABILITY (Calendar blocking)
CREATE TABLE IF NOT EXISTS seat_availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seat_id INTEGER NOT NULL,
  date DATE NOT NULL,
  is_available INTEGER DEFAULT 1,
  booking_id INTEGER,
  blocked_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seat_id) REFERENCES seats(id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- 21. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_number TEXT UNIQUE NOT NULL,
  booking_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_method TEXT,
  payment_gateway TEXT DEFAULT 'razorpay',
  gateway_order_id TEXT,
  gateway_payment_id TEXT,
  gateway_signature TEXT,
  gateway_response TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','processing','success','failed','refunded','partial_refund')),
  failure_reason TEXT,
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 22. REFUNDS
CREATE TABLE IF NOT EXISTS refunds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER NOT NULL,
  booking_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  reason TEXT,
  gateway_refund_id TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','processing','completed','failed')),
  processed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- 23. PLATFORM COMMISSION SETTINGS
CREATE TABLE IF NOT EXISTS commission_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  commission_type TEXT DEFAULT 'percentage' CHECK(commission_type IN ('percentage','fixed')),
  commission_value REAL NOT NULL DEFAULT 10,
  min_amount REAL DEFAULT 0,
  max_amount REAL,
  applies_to TEXT DEFAULT 'all',
  is_active INTEGER DEFAULT 1,
  effective_from DATE,
  effective_to DATE,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 24. OWNER PAYOUTS
CREATE TABLE IF NOT EXISTS owner_payouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payout_number TEXT UNIQUE NOT NULL,
  owner_id INTEGER NOT NULL,
  abhyasika_id INTEGER,
  total_bookings INTEGER DEFAULT 0,
  gross_amount REAL NOT NULL,
  commission_amount REAL NOT NULL,
  tax_deducted REAL DEFAULT 0,
  net_amount REAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','processing','paid','failed')),
  payment_method TEXT,
  bank_account TEXT,
  upi_id TEXT,
  transaction_id TEXT,
  paid_at DATETIME,
  period_from DATE,
  period_to DATE,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- 25. PAYOUT ITEMS (Individual booking commissions)
CREATE TABLE IF NOT EXISTS payout_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payout_id INTEGER NOT NULL,
  booking_id INTEGER NOT NULL,
  booking_amount REAL NOT NULL,
  commission_rate REAL NOT NULL,
  commission_amount REAL NOT NULL,
  owner_amount REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payout_id) REFERENCES owner_payouts(id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- 26. REVIEWS AND RATINGS
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  abhyasika_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  booking_id INTEGER,
  overall_rating INTEGER NOT NULL CHECK(overall_rating BETWEEN 1 AND 5),
  cleanliness_rating INTEGER CHECK(cleanliness_rating BETWEEN 1 AND 5),
  facilities_rating INTEGER CHECK(facilities_rating BETWEEN 1 AND 5),
  value_rating INTEGER CHECK(value_rating BETWEEN 1 AND 5),
  staff_rating INTEGER CHECK(staff_rating BETWEEN 1 AND 5),
  title TEXT,
  review_text TEXT,
  owner_response TEXT,
  owner_responded_at DATETIME,
  is_approved INTEGER DEFAULT 1,
  is_featured INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (abhyasika_id) REFERENCES abhyasikas(id),
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- 27. REVIEW HELPFUL VOTES
CREATE TABLE IF NOT EXISTS review_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  is_helpful INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (review_id) REFERENCES reviews(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 28. COUPONS & DISCOUNTS
CREATE TABLE IF NOT EXISTS coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage','fixed')),
  discount_value REAL NOT NULL,
  min_booking_amount REAL DEFAULT 0,
  max_discount_amount REAL,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1,
  applicable_for TEXT DEFAULT 'all' CHECK(applicable_for IN ('all','new_users','specific_abhyasika')),
  abhyasika_id INTEGER,
  valid_from DATETIME,
  valid_to DATETIME,
  is_active INTEGER DEFAULT 1,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 29. COUPON USAGE HISTORY
CREATE TABLE IF NOT EXISTS coupon_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coupon_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  booking_id INTEGER NOT NULL,
  discount_amount REAL NOT NULL,
  used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- 30. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data TEXT,
  channel TEXT DEFAULT 'app' CHECK(channel IN ('app','email','sms','push')),
  is_read INTEGER DEFAULT 0,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 31. NOTIFICATION TEMPLATES
CREATE TABLE IF NOT EXISTS notification_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  subject TEXT,
  email_body TEXT,
  sms_body TEXT,
  push_body TEXT,
  variables TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 32. EMAIL LOGS
CREATE TABLE IF NOT EXISTS email_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  to_email TEXT NOT NULL,
  from_email TEXT,
  subject TEXT NOT NULL,
  body TEXT,
  template_id INTEGER,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','sent','failed','bounced')),
  error_message TEXT,
  sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES notification_templates(id)
);

-- 33. SMS LOGS
CREATE TABLE IF NOT EXISTS sms_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  to_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  template_id INTEGER,
  gateway_message_id TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','sent','delivered','failed')),
  error_message TEXT,
  sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES notification_templates(id)
);

-- 34. ADVERTISEMENTS
CREATE TABLE IF NOT EXISTS advertisements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  placement TEXT NOT NULL CHECK(placement IN ('homepage_banner','search_results','sidebar','popup','mobile_banner')),
  target_audience TEXT DEFAULT 'all' CHECK(target_audience IN ('all','students','owners')),
  city_id INTEGER,
  start_date DATE,
  end_date DATE,
  budget REAL,
  cost_per_click REAL DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (city_id) REFERENCES cities(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 35. AD INTERACTIONS
CREATE TABLE IF NOT EXISTS ad_interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ad_id INTEGER NOT NULL,
  user_id INTEGER,
  interaction_type TEXT NOT NULL CHECK(interaction_type IN ('impression','click')),
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ad_id) REFERENCES advertisements(id)
);

-- 36. WISHLISTS / SAVED ABHYASIKAS
CREATE TABLE IF NOT EXISTS wishlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  abhyasika_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (abhyasika_id) REFERENCES abhyasikas(id) ON DELETE CASCADE
);

-- 37. STUDENT PROFILES
CREATE TABLE IF NOT EXISTS student_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  qualification TEXT,
  exam_preparing TEXT,
  preferred_study_time TEXT,
  city_id INTEGER,
  locality_id INTEGER,
  address TEXT,
  id_proof_type TEXT,
  id_proof_number TEXT,
  id_proof_url TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  total_bookings INTEGER DEFAULT 0,
  total_spent REAL DEFAULT 0,
  loyalty_points INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 38. OWNER PROFILES
CREATE TABLE IF NOT EXISTS owner_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  business_name TEXT,
  gst_number TEXT,
  pan_number TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  upi_id TEXT,
  id_proof_type TEXT,
  id_proof_url TEXT,
  address_proof_url TEXT,
  kyc_status TEXT DEFAULT 'pending' CHECK(kyc_status IN ('pending','verified','rejected')),
  total_abhyasikas INTEGER DEFAULT 0,
  total_revenue REAL DEFAULT 0,
  total_payout REAL DEFAULT 0,
  commission_rate REAL DEFAULT 10,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 39. SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS support_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_number TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high','urgent')),
  status TEXT DEFAULT 'open' CHECK(status IN ('open','in_progress','resolved','closed')),
  assigned_to INTEGER,
  resolved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- 40. TICKET MESSAGES
CREATE TABLE IF NOT EXISTS ticket_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  attachments TEXT,
  is_internal INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id),
  FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- 41. ANALYTICS EVENTS
CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id INTEGER,
  metadata TEXT,
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 42. SEARCH LOGS
CREATE TABLE IF NOT EXISTS search_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  search_query TEXT,
  filters TEXT,
  city_id INTEGER,
  latitude REAL,
  longitude REAL,
  results_count INTEGER DEFAULT 0,
  clicked_abhyasika_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 43. PLATFORM SETTINGS
CREATE TABLE IF NOT EXISTS platform_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  value_type TEXT DEFAULT 'string' CHECK(value_type IN ('string','number','boolean','json')),
  description TEXT,
  category TEXT DEFAULT 'general',
  is_public INTEGER DEFAULT 0,
  updated_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 44. ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK(type IN ('info','warning','success','danger')),
  target_roles TEXT DEFAULT 'all',
  city_id INTEGER,
  is_active INTEGER DEFAULT 1,
  start_date DATETIME,
  end_date DATETIME,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 45. FAQs
CREATE TABLE IF NOT EXISTS faqs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  target_role TEXT DEFAULT 'all',
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  helpful_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 46. LOYALTY POINTS TRANSACTIONS
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK(transaction_type IN ('earned','redeemed','expired','bonus')),
  points INTEGER NOT NULL,
  booking_id INTEGER,
  description TEXT,
  balance_after INTEGER,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- 47. HOLIDAY CALENDAR (Abhyasika-specific closures)
CREATE TABLE IF NOT EXISTS holidays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  abhyasika_id INTEGER,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  is_partial_closure INTEGER DEFAULT 0,
  closure_from TEXT,
  closure_to TEXT,
  is_platform_wide INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (abhyasika_id) REFERENCES abhyasikas(id)
);

-- 48. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id INTEGER,
  old_values TEXT,
  new_values TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 49. BLOG POSTS
CREATE TABLE IF NOT EXISTS blog_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT,
  featured_image TEXT,
  author_id INTEGER,
  category TEXT,
  tags TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
  view_count INTEGER DEFAULT 0,
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

-- 50. WAITLIST
CREATE TABLE IF NOT EXISTS waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  abhyasika_id INTEGER NOT NULL,
  seat_category_id INTEGER,
  preferred_dates TEXT,
  booking_type TEXT,
  status TEXT DEFAULT 'waiting' CHECK(status IN ('waiting','notified','booked','cancelled')),
  notified_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (abhyasika_id) REFERENCES abhyasikas(id)
);

-- 51. REVENUE REPORTS (Cached)
CREATE TABLE IF NOT EXISTS revenue_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_date DATE NOT NULL,
  report_type TEXT NOT NULL CHECK(report_type IN ('daily','weekly','monthly','yearly')),
  entity_type TEXT DEFAULT 'platform' CHECK(entity_type IN ('platform','abhyasika','owner')),
  entity_id INTEGER,
  total_bookings INTEGER DEFAULT 0,
  total_revenue REAL DEFAULT 0,
  platform_commission REAL DEFAULT 0,
  owner_revenue REAL DEFAULT 0,
  cancelled_bookings INTEGER DEFAULT 0,
  refund_amount REAL DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 52. REFERRAL PROGRAM
CREATE TABLE IF NOT EXISTS referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_id INTEGER NOT NULL,
  referred_id INTEGER,
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','registered','first_booking','rewarded')),
  reward_amount REAL DEFAULT 0,
  referred_at DATETIME,
  rewarded_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referrer_id) REFERENCES users(id),
  FOREIGN KEY (referred_id) REFERENCES users(id)
);

-- 53. PUSH NOTIFICATION TOKENS
CREATE TABLE IF NOT EXISTS push_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL,
  platform TEXT CHECK(platform IN ('web','android','ios')),
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_abhyasikas_owner ON abhyasikas(owner_id);
CREATE INDEX IF NOT EXISTS idx_abhyasikas_status ON abhyasikas(status);
CREATE INDEX IF NOT EXISTS idx_abhyasikas_city ON abhyasikas(city_id);
CREATE INDEX IF NOT EXISTS idx_abhyasikas_location ON abhyasikas(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_seats_abhyasika ON seats(abhyasika_id);
CREATE INDEX IF NOT EXISTS idx_seats_status ON seats(status);
CREATE INDEX IF NOT EXISTS idx_bookings_student ON bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_abhyasika ON bookings(abhyasika_id);
CREATE INDEX IF NOT EXISTS idx_bookings_seat ON bookings(seat_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_reviews_abhyasika ON reviews(abhyasika_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_date ON analytics_events(created_at);
