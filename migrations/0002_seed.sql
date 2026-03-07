-- ============================================================
-- SEED DATA for Abhyasika Study Rooms Platform
-- ============================================================

-- CITIES
INSERT OR IGNORE INTO cities (name, state, latitude, longitude) VALUES
('Mumbai', 'Maharashtra', 19.0760, 72.8777),
('Pune', 'Maharashtra', 18.5204, 73.8567),
('Nagpur', 'Maharashtra', 21.1458, 79.0882),
('Nashik', 'Maharashtra', 19.9975, 73.7898),
('Aurangabad', 'Maharashtra', 19.8762, 75.3433),
('Kolhapur', 'Maharashtra', 16.7050, 74.2433),
('Solapur', 'Maharashtra', 17.6868, 75.9064),
('Thane', 'Maharashtra', 19.2183, 72.9781);

-- LOCALITIES (Pune)
INSERT OR IGNORE INTO localities (city_id, name, pincode, latitude, longitude) VALUES
(2, 'Kothrud', '411038', 18.5089, 73.8259),
(2, 'Shivajinagar', '411005', 18.5308, 73.8474),
(2, 'Deccan Gymkhana', '411004', 18.5196, 73.8453),
(2, 'Hinjewadi', '411057', 18.5912, 73.7378),
(2, 'Wakad', '411057', 18.6006, 73.7644),
(2, 'Baner', '411045', 18.5590, 73.7868),
(2, 'Aundh', '411007', 18.5590, 73.8074),
(2, 'Viman Nagar', '411014', 18.5679, 73.9143),
(2, 'Koregaon Park', '411001', 18.5362, 73.8931),
(2, 'Hadapsar', '411028', 18.5018, 73.9253);

-- FACILITY CATEGORIES
INSERT OR IGNORE INTO facility_categories (name, icon, sort_order) VALUES
('Comfort', 'thermometer', 1),
('Technology', 'wifi', 2),
('Security', 'shield', 3),
('Food & Drinks', 'coffee', 4),
('Transport', 'parking-circle', 5),
('Study', 'book', 6);

-- FACILITIES
INSERT OR IGNORE INTO facilities (category_id, name, description, icon) VALUES
(1, 'AC', 'Air Conditioned Rooms', 'thermometer-snowflake'),
(1, 'Non-AC', 'Fan Cooled Rooms', 'fan'),
(2, 'WiFi', 'High Speed Internet', 'wifi'),
(2, 'Computer', 'Desktop Computers Available', 'monitor'),
(2, 'Printing', 'Printing & Scanning', 'printer'),
(3, 'CCTV', 'Security Cameras', 'camera'),
(3, 'Lockers', 'Personal Lockers', 'lock'),
(3, '24x7 Security', 'Round the Clock Security', 'shield'),
(4, 'RO Water', 'Purified Water', 'droplets'),
(4, 'Cafeteria', 'Food & Snacks', 'coffee'),
(4, 'Tea/Coffee', 'Tea & Coffee Vending', 'cup-saucer'),
(5, 'Parking', 'Two Wheeler Parking', 'parking-circle'),
(5, 'Car Parking', 'Four Wheeler Parking', 'car'),
(6, 'Library', 'Books & Study Materials', 'library'),
(6, 'Discussion Rooms', 'Group Study Rooms', 'users'),
(6, 'Whiteboard', 'Writing Boards', 'pen-line'),
(1, 'Washroom', 'Clean Restrooms', 'bath'),
(2, 'Power Backup', 'UPS/Generator', 'zap'),
(1, 'Ergonomic Chairs', 'Comfortable Seating', 'armchair'),
(6, 'Newspaper/Magazines', 'Daily Newspapers', 'newspaper');

-- PLATFORM SETTINGS
INSERT OR IGNORE INTO platform_settings (key, value, value_type, description, category, is_public) VALUES
('platform_name', 'Abhyasika', 'string', 'Platform Name', 'general', 1),
('platform_tagline', 'Find Your Perfect Study Space', 'string', 'Platform Tagline', 'general', 1),
('platform_commission', '10', 'number', 'Default Commission Percentage', 'billing', 0),
('min_booking_days', '1', 'number', 'Minimum Booking Days', 'booking', 1),
('max_booking_days', '90', 'number', 'Maximum Booking Days', 'booking', 1),
('cancellation_window_hours', '24', 'number', 'Hours before booking for free cancellation', 'booking', 1),
('razorpay_key_id', 'rzp_test_demo', 'string', 'Razorpay Key ID', 'payment', 0),
('google_maps_key', 'demo_maps_key', 'string', 'Google Maps API Key', 'integration', 0),
('sms_provider', 'twilio', 'string', 'SMS Provider', 'notification', 0),
('email_from', 'noreply@abhyasika.in', 'string', 'From Email Address', 'notification', 0),
('support_email', 'support@abhyasika.in', 'string', 'Support Email', 'general', 1),
('support_phone', '+91-9999999999', 'string', 'Support Phone', 'general', 1),
('max_photos_per_abhyasika', '20', 'number', 'Maximum Photos per Abhyasika', 'content', 1),
('max_seats_per_floor', '200', 'number', 'Maximum Seats per Floor', 'booking', 1),
('loyalty_points_per_booking', '10', 'number', 'Points Earned per Booking', 'loyalty', 1),
('referral_reward_amount', '100', 'number', 'Referral Reward Amount (INR)', 'referral', 1);

-- COMMISSION SETTINGS
INSERT OR IGNORE INTO commission_settings (commission_type, commission_value, is_active, effective_from) VALUES
('percentage', 10, 1, '2024-01-01');

-- ADMIN USER (password: Admin@123)
INSERT OR IGNORE INTO users (uuid, email, phone, password_hash, first_name, last_name, role, is_verified, is_active) VALUES
('admin-uuid-001', 'admin@abhyasika.in', '+919999000001', '$2a$10$xJwLZy8LiXBP5fON6EFByOuJXfQFGD/J9K5TtXlHaM8F9CL0bkbLq', 'Super', 'Admin', 'super_admin', 1, 1);

-- SAMPLE OWNER (password: Owner@123)  
INSERT OR IGNORE INTO users (uuid, email, phone, password_hash, first_name, last_name, role, is_verified, is_active) VALUES
('owner-uuid-001', 'owner1@example.com', '+919999000002', '$2a$10$xJwLZy8LiXBP5fON6EFByOuJXfQFGD/J9K5TtXlHaM8F9CL0bkbLq', 'Rajesh', 'Sharma', 'owner', 1, 1),
('owner-uuid-002', 'owner2@example.com', '+919999000003', '$2a$10$xJwLZy8LiXBP5fON6EFByOuJXfQFGD/J9K5TtXlHaM8F9CL0bkbLq', 'Priya', 'Patel', 'owner', 1, 1);

-- SAMPLE STUDENT (password: Student@123)
INSERT OR IGNORE INTO users (uuid, email, phone, password_hash, first_name, last_name, role, is_verified, is_active) VALUES
('student-uuid-001', 'student1@example.com', '+919999000004', '$2a$10$xJwLZy8LiXBP5fON6EFByOuJXfQFGD/J9K5TtXlHaM8F9CL0bkbLq', 'Amit', 'Kumar', 'student', 1, 1),
('student-uuid-002', 'student2@example.com', '+919999000005', '$2a$10$xJwLZy8LiXBP5fON6EFByOuJXfQFGD/J9K5TtXlHaM8F9CL0bkbLq', 'Sneha', 'Desai', 'student', 1, 1);

-- SAMPLE ABHYASIKAS
INSERT OR IGNORE INTO abhyasikas (uuid, owner_id, name, slug, description, tagline, city_id, locality_id, address, pincode, latitude, longitude, phone, email, status, total_seats, available_seats, rating_avg, rating_count, opening_time, closing_time) VALUES
('abhy-uuid-001', 2, 'Vidya Study Hub', 'vidya-study-hub', 'Premium study environment with all modern facilities for competitive exam aspirants.', 'Where Toppers Study', 2, 1, '45 Kothrud Main Road, Near Vanaz Company', '411038', 18.5089, 73.8259, '+91-9876543210', 'vidya@example.com', 'approved', 60, 45, 4.5, 128, '05:00', '23:00'),
('abhy-uuid-002', 3, 'Saraswati Library & Study Room', 'saraswati-library', 'Peaceful and well-lit study space with extensive book collection.', 'Knowledge is Power', 2, 3, '12 Deccan Main Rd, FC Road', '411004', 18.5196, 73.8453, '+91-9876543211', 'saraswati@example.com', 'approved', 40, 25, 4.3, 89, '06:00', '22:00'),
('abhy-uuid-003', 2, 'Focus Zone', 'focus-zone', 'Modern AC study room with high-speed WiFi and comfortable ergonomic seats.', 'Focus. Study. Excel.', 2, 6, 'Shop 7, Baner Road, Opposite Blue Ridge', '411045', 18.5590, 73.7868, '+91-9876543212', 'focus@example.com', 'approved', 50, 30, 4.7, 215, '06:00', '23:00');

-- OWNER PROFILES
INSERT OR IGNORE INTO owner_profiles (user_id, business_name, kyc_status, total_abhyasikas) VALUES
(2, 'Sharma Study Centers', 'verified', 2),
(3, 'Patel Learning Hub', 'verified', 1);

-- STUDENT PROFILES
INSERT OR IGNORE INTO student_profiles (user_id, gender, exam_preparing, city_id) VALUES
(4, 'male', 'UPSC', 2),
(5, 'female', 'MPSC', 2);

-- SEAT CATEGORIES
INSERT OR IGNORE INTO seat_categories (abhyasika_id, name, description, color_code, daily_price, weekly_price, monthly_price) VALUES
(1, 'Standard', 'Regular study seat with table and chair', '#6B7280', 50, 300, 900),
(1, 'AC Premium', 'Air-conditioned premium seat', '#3B82F6', 80, 500, 1500),
(1, 'Window Side', 'Comfortable window-side seating', '#10B981', 60, 380, 1100),
(2, 'Regular', 'Standard study seat', '#6B7280', 40, 250, 750),
(2, 'Deluxe', 'Premium AC seat with locker', '#8B5CF6', 70, 450, 1300),
(3, 'Silver', 'Standard AC seat', '#6B7280', 60, 370, 1100),
(3, 'Gold', 'Premium seat with dedicated locker', '#F59E0B', 100, 650, 1900),
(3, 'Platinum', 'VIP cabin with personal whiteboard', '#EC4899', 150, 950, 2800);

-- SAMPLE SEATS (for abhyasika 1)
INSERT OR IGNORE INTO seats (abhyasika_id, category_id, seat_number, seat_label, row_number, column_number, status) VALUES
(1, 1, 'S01', 'Seat 01', 1, 1, 'available'),
(1, 1, 'S02', 'Seat 02', 1, 2, 'occupied'),
(1, 1, 'S03', 'Seat 03', 1, 3, 'available'),
(1, 2, 'A01', 'AC-01', 2, 1, 'available'),
(1, 2, 'A02', 'AC-02', 2, 2, 'reserved'),
(1, 3, 'W01', 'Window-01', 3, 1, 'available'),
(1, 3, 'W02', 'Window-02', 3, 2, 'available');

-- ABHYASIKA FACILITIES
INSERT OR IGNORE INTO abhyasika_facilities (abhyasika_id, facility_id) VALUES
(1, 1), (1, 3), (1, 6), (1, 7), (1, 9), (1, 11), (1, 12), (1, 18), (1, 19),
(2, 2), (2, 3), (2, 6), (2, 9), (2, 14), (2, 16), (2, 17),
(3, 1), (3, 3), (3, 5), (3, 6), (3, 7), (3, 9), (3, 11), (3, 12), (3, 18), (3, 19), (3, 20);

-- SAMPLE BOOKINGS
INSERT OR IGNORE INTO bookings (booking_number, student_id, abhyasika_id, seat_id, booking_type, start_date, end_date, total_days, base_amount, platform_fee, total_amount, status) VALUES
('ABH20240001', 4, 1, 1, 'monthly', '2024-02-01', '2024-02-29', 29, 900, 90, 990, 'completed'),
('ABH20240002', 5, 2, 4, 'weekly', '2024-02-05', '2024-02-11', 7, 250, 25, 275, 'completed'),
('ABH20240003', 4, 3, 8, 'daily', '2024-02-15', '2024-02-15', 1, 100, 10, 110, 'confirmed');

-- SAMPLE REVIEWS
INSERT OR IGNORE INTO reviews (abhyasika_id, student_id, booking_id, overall_rating, cleanliness_rating, facilities_rating, value_rating, title, review_text) VALUES
(1, 4, 1, 5, 5, 5, 4, 'Excellent Study Environment!', 'Great place to study. AC is perfect, WiFi is fast. Highly recommended!'),
(2, 5, 2, 4, 4, 4, 5, 'Good Value for Money', 'Nice peaceful place. Good for serious students.'),
(3, 4, 3, 5, 5, 5, 5, 'Best Study Room in Pune!', 'Amazing facilities. Premium seats are very comfortable. Will book again!');

-- NOTIFICATION TEMPLATES
INSERT OR IGNORE INTO notification_templates (name, type, subject, email_body, sms_body) VALUES
('booking_confirmed', 'booking', 'Booking Confirmed - Abhyasika', 'Your booking {{booking_number}} has been confirmed for {{abhyasika_name}}.', 'Booking {{booking_number}} confirmed at {{abhyasika_name}} from {{start_date}}.'),
('booking_cancelled', 'booking', 'Booking Cancelled', 'Your booking {{booking_number}} has been cancelled. Refund will be processed within 5-7 days.', 'Booking {{booking_number}} cancelled. Refund in 5-7 days.'),
('payment_success', 'payment', 'Payment Successful', 'Payment of ₹{{amount}} received for booking {{booking_number}}.', 'Payment ₹{{amount}} received for booking {{booking_number}}.'),
('new_abhyasika_approved', 'admin', 'Your Abhyasika is Approved!', 'Congratulations! Your Abhyasika "{{name}}" has been approved.', 'Your Abhyasika {{name}} is approved. Start receiving bookings!'),
('otp_verification', 'auth', 'OTP for Abhyasika', 'Your OTP is {{otp}}. Valid for 10 minutes. Do not share with anyone.', 'Your Abhyasika OTP: {{otp}}. Valid 10 mins. Do not share.');

-- FAQs
INSERT OR IGNORE INTO faqs (category, question, answer, target_role, sort_order) VALUES
('booking', 'How do I book a seat?', 'Search for an Abhyasika near you, select a seat, choose your dates, and make payment.', 'student', 1),
('booking', 'Can I cancel my booking?', 'Yes, you can cancel up to 24 hours before your booking starts for a full refund.', 'student', 2),
('payment', 'What payment methods are accepted?', 'We accept UPI, Credit/Debit Cards, Net Banking, and Wallets via Razorpay.', 'all', 1),
('listing', 'How do I list my Abhyasika?', 'Sign up as an owner, fill in your Abhyasika details, upload photos, and submit for approval.', 'owner', 1),
('listing', 'How long does approval take?', 'Typically 2-3 business days after submission of complete information.', 'owner', 2);
