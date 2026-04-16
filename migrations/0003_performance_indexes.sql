-- ============================================================
-- PERFORMANCE INDEXES FOR HIGH TRAFFIC (4-5 LAKH USERS)
-- Improves query speed for most common operations
-- ============================================================

-- Abhyasikas: most common search filters
CREATE INDEX IF NOT EXISTS idx_abhyasikas_status_active 
  ON abhyasikas(status, is_active);

CREATE INDEX IF NOT EXISTS idx_abhyasikas_city_status 
  ON abhyasikas(city_id, status, is_active);

CREATE INDEX IF NOT EXISTS idx_abhyasikas_featured 
  ON abhyasikas(is_featured, status, is_active, rating_avg);

CREATE INDEX IF NOT EXISTS idx_abhyasikas_rating 
  ON abhyasikas(rating_avg DESC, total_bookings DESC);

CREATE INDEX IF NOT EXISTS idx_abhyasikas_owner 
  ON abhyasikas(owner_id, status);

-- Seats: availability lookups
CREATE INDEX IF NOT EXISTS idx_seats_abhyasika_status 
  ON seats(abhyasika_id, status);

CREATE INDEX IF NOT EXISTS idx_seats_category 
  ON seats(category_id, status);

-- Bookings: active/upcoming lookups
CREATE INDEX IF NOT EXISTS idx_bookings_user_status 
  ON bookings(user_id, status, start_date);

CREATE INDEX IF NOT EXISTS idx_bookings_seat_dates 
  ON bookings(seat_id, status, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_bookings_abhyasika 
  ON bookings(abhyasika_id, status, start_date);

-- Users: login and role lookups
CREATE INDEX IF NOT EXISTS idx_users_email 
  ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_role_active 
  ON users(role, is_active);

-- Photos: primary photo lookup (common in listing queries)
CREATE INDEX IF NOT EXISTS idx_photos_primary 
  ON abhyasika_photos(abhyasika_id, is_primary);

-- Notifications: unread count lookup
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
  ON notifications(user_id, is_read, created_at DESC);

-- Reviews: per-abhyasika lookups
CREATE INDEX IF NOT EXISTS idx_reviews_abhyasika 
  ON reviews(abhyasika_id, created_at DESC);

-- Seat categories: pricing lookups
CREATE INDEX IF NOT EXISTS idx_seat_categories_abhyasika 
  ON seat_categories(abhyasika_id);
