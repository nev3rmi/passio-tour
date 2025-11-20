-- @up

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('customer', 'admin', 'tour_operator', 'partner');
CREATE TYPE entity_status AS ENUM ('active', 'inactive', 'draft', 'archived');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded');
CREATE TYPE tour_type AS ENUM ('adventure', 'cultural', 'historical', 'nature', 'food', 'city', 'beach', 'mountain', 'wildlife', 'religious', 'luxury', 'budget', 'family', 'solo', 'couple', 'group', 'custom');
CREATE TYPE difficulty_level AS ENUM ('easy', 'moderate', 'challenging', 'difficult');
CREATE TYPE notification_type AS ENUM ('booking_confirmation', 'reminder', 'update', 'cancellation', 'completion');
CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'push');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email CITEXT UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role user_role DEFAULT 'customer',
    status entity_status DEFAULT 'active',
    avatar TEXT,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    push_notifications BOOLEAN DEFAULT TRUE,
    marketing BOOLEAN DEFAULT FALSE,
    currency VARCHAR(3) DEFAULT 'USD',
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    time_format VARCHAR(5) DEFAULT '12h',
    theme VARCHAR(10) DEFAULT 'light',
    marketing_opt_in BOOLEAN DEFAULT FALSE,
    data_sharing_opt_in BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- User addresses
CREATE TABLE user_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('home', 'work', 'billing', 'shipping')),
    street TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_default BOOLEAN DEFAULT FALSE,
    label VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency contacts
CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tour categories
CREATE TABLE tour_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES tour_categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tours table
CREATE TABLE tours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    short_description TEXT,
    slug VARCHAR(500) UNIQUE NOT NULL,
    status entity_status DEFAULT 'draft',
    category_id UUID REFERENCES tour_categories(id),
    type tour_type NOT NULL,
    operator_id UUID NOT NULL REFERENCES users(id),
    base_price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    price_per_person BOOLEAN DEFAULT TRUE,
    
    -- Duration fields
    duration_days INTEGER DEFAULT 0,
    duration_hours INTEGER NOT NULL,
    duration_minutes INTEGER DEFAULT 0,
    
    -- Frequency and scheduling
    frequency_type VARCHAR(20) DEFAULT 'daily' CHECK (frequency_type IN ('daily', 'weekly', 'monthly', 'custom')),
    frequency_pattern TEXT,
    seasonal BOOLEAN DEFAULT FALSE,
    start_date DATE,
    end_date DATE,
    available_days INTEGER[] DEFAULT '{1,2,3,4,5,6,0}', -- 0=Sunday, 1=Monday, etc.
    start_time TIME NOT NULL,
    end_time TIME,
    
    -- Location
    country VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    coordinates_lat DECIMAL(10, 8),
    coordinates_lng DECIMAL(11, 8),
    
    -- Capacity
    max_participants INTEGER NOT NULL,
    min_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    is_private BOOLEAN DEFAULT FALSE,
    
    -- Media
    primary_image TEXT,
    video_url TEXT,
    
    -- SEO and metadata
    meta_title VARCHAR(255),
    meta_description TEXT,
    tags TEXT[],
    difficulty difficulty_level DEFAULT 'moderate',
    min_age INTEGER DEFAULT 0,
    max_age INTEGER,
    requires_adult_supervision BOOLEAN DEFAULT FALSE,
    adult_required BOOLEAN DEFAULT FALSE,
    languages TEXT[] DEFAULT '{"English"}',
    
    -- Ratings
    average_rating DECIMAL(3, 2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    booking_count INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5, 2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tour images
CREATE TABLE tour_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    caption TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tour locations and points
CREATE TABLE tour_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('meeting_point', 'end_point', 'landmark', 'waypoint')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    street TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    instructions TEXT,
    meeting_time TIME,
    drop_off_time TIME,
    what_to_look_for TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tour itinerary
CREATE TABLE tour_itinerary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    day INTEGER NOT NULL,
    sort_order INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    duration VARCHAR(50),
    included BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tour dates and availability
CREATE TABLE tour_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    available BOOLEAN DEFAULT TRUE,
    max_participants INTEGER NOT NULL,
    current_participants INTEGER DEFAULT 0,
    price_multiplier DECIMAL(5, 2) DEFAULT 1.0,
    special_instructions TEXT,
    blocked BOOLEAN DEFAULT FALSE,
    blocked_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tour_id, date)
);

-- Tour policies
CREATE TABLE tour_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('cancellation', 'refund', 'booking', 'participation')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    free_cancellation_until INTEGER, -- Hours before start
    partial_refund_until INTEGER, -- Hours before start
    no_refund_after INTEGER, -- Hours before start
    processing_time INTEGER, -- Days
    methods TEXT[],
    conditions TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tour highlights and inclusions
CREATE TABLE tour_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('highlight', 'included', 'excluded', 'requirement', 'recommendation')),
    description TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    tour_id UUID NOT NULL REFERENCES tours(id),
    tour_date_id UUID REFERENCES tour_dates(id),
    status booking_status DEFAULT 'pending',
    
    -- Booking details
    total_participants INTEGER NOT NULL,
    booking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tour_date DATE NOT NULL,
    
    -- Contact information
    primary_contact JSONB NOT NULL, -- {firstName, lastName, email, phone}
    billing_address JSONB,
    emergency_contact JSONB,
    
    -- Special requests
    special_requests TEXT,
    dietary_restrictions TEXT,
    accessibility_needs TEXT,
    
    -- Communication
    communication_preference VARCHAR(10) DEFAULT 'email' CHECK (communication_preference IN ('email', 'sms', 'phone')),
    
    -- Source and tracking
    source VARCHAR(50) DEFAULT 'website',
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),
    
    -- Notes
    internal_notes TEXT,
    customer_notes TEXT,
    operator_notes TEXT,
    
    -- Timestamps
    confirmed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Booking participants
CREATE TABLE booking_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    date_of_birth DATE,
    age INTEGER,
    gender VARCHAR(20),
    nationality VARCHAR(100),
    passport_number VARCHAR(50),
    passport_expiry DATE,
    dietary_restrictions TEXT,
    medical_conditions TEXT,
    tshirt_size VARCHAR(10),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status payment_status DEFAULT 'pending',
    method VARCHAR(50) NOT NULL,
    gateway VARCHAR(50) NOT NULL,
    
    -- Transaction details
    transaction_id VARCHAR(255),
    gateway_transaction_id VARCHAR(255),
    reference_id VARCHAR(255),
    
    -- Customer details
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_ip INET,
    
    -- Billing address
    billing_address JSONB,
    
    -- Security
    fraud_score INTEGER,
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
    fraud_flags TEXT[],
    
    -- Metadata
    description TEXT,
    metadata JSONB,
    
    -- Fees
    fees_amount DECIMAL(10, 2) DEFAULT 0,
    net_amount DECIMAL(10, 2) NOT NULL,
    
    -- Timestamps
    authorized_at TIMESTAMP WITH TIME ZONE,
    captured_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refunds table
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    reason VARCHAR(255) NOT NULL,
    status payment_status DEFAULT 'pending',
    gateway VARCHAR(50) NOT NULL,
    gateway_refund_id VARCHAR(255),
    transaction_id VARCHAR(255),
    method VARCHAR(50) DEFAULT 'original_payment',
    
    -- Customer communication
    notification_sent BOOLEAN DEFAULT FALSE,
    customer_notified_at TIMESTAMP WITH TIME ZONE,
    
    -- Admin details
    requested_by_user_id UUID REFERENCES users(id),
    approved_by_user_id UUID REFERENCES users(id),
    processed_by_user_id UUID REFERENCES users(id),
    admin_notes TEXT,
    
    -- Financial details
    fee_refund DECIMAL(10, 2) DEFAULT 0,
    net_refund_amount DECIMAL(10, 2) NOT NULL,
    
    -- Timestamps
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE
);

-- Booking notifications
CREATE TABLE booking_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    channel notification_channel NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    tour_id UUID NOT NULL REFERENCES tours(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT NOT NULL,
    would_recommend BOOLEAN DEFAULT TRUE,
    verified BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(booking_id)
);

-- Review aspects (detailed ratings)
CREATE TABLE review_aspects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    aspect VARCHAR(50) NOT NULL CHECK (aspect IN ('guide', 'transportation', 'food', 'itinerary', 'value', 'overall')),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_tours_operator_id ON tours(operator_id);
CREATE INDEX idx_tours_category_id ON tours(category_id);
CREATE INDEX idx_tours_status ON tours(status);
CREATE INDEX idx_tours_type ON tours(type);
CREATE INDEX idx_tours_created_at ON tours(created_at);
CREATE INDEX idx_tours_slug ON tours(slug);

CREATE INDEX idx_tour_dates_tour_id ON tour_dates(tour_id);
CREATE INDEX idx_tour_dates_date ON tour_dates(date);
CREATE INDEX idx_tour_dates_available ON tour_dates(available);

CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_tour_id ON bookings(tour_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX idx_bookings_tour_date ON bookings(tour_date);
CREATE INDEX idx_bookings_booking_number ON bookings(booking_number);

CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_gateway ON payments(gateway);
CREATE INDEX idx_payments_created_at ON payments(created_at);

CREATE INDEX idx_reviews_tour_id ON reviews(tour_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_addresses_updated_at BEFORE UPDATE ON user_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_emergency_contacts_updated_at BEFORE UPDATE ON emergency_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tour_categories_updated_at BEFORE UPDATE ON tour_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tours_updated_at BEFORE UPDATE ON tours FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tour_dates_updated_at BEFORE UPDATE ON tour_dates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_booking_participants_updated_at BEFORE UPDATE ON booking_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system settings
INSERT INTO system_settings (key, value, description, is_public) VALUES
('site_name', '"Passio Tour"', 'Site name', true),
('site_description', '"Comprehensive tour management system"', 'Site description', true),
('default_currency', '"USD"', 'Default currency', true),
('booking_confirmation_required', 'true', 'Require booking confirmation', false),
('max_booking_participants', '50', 'Maximum participants per booking', false),
('cancellation_policy_days', '24', 'Days before tour for free cancellation', false),
('email_notifications_enabled', 'true', 'Enable email notifications', false),
('sms_notifications_enabled', 'false', 'Enable SMS notifications', false),
('maintenance_mode', 'false', 'Enable maintenance mode', false),
('api_version', '"v1"', 'API version', true);

-- Insert default tour categories
INSERT INTO tour_categories (name, slug, description, sort_order) VALUES
('Adventure Tours', 'adventure', 'Exciting adventure activities and outdoor experiences', 1),
('Cultural Tours', 'cultural', 'Immerse yourself in local culture and traditions', 2),
('Historical Tours', 'historical', 'Discover historical sites and landmarks', 3),
('Nature Tours', 'nature', 'Explore natural wonders and wildlife', 4),
('Food Tours', 'food', 'Culinary experiences and food tastings', 5),
('City Tours', 'city', 'Urban exploration and city highlights', 6),
('Beach Tours', 'beach', 'Coastal destinations and beach activities', 7),
('Mountain Tours', 'mountain', 'Mountain adventures and hiking experiences', 8);

-- Update tour statistics trigger
CREATE OR REPLACE FUNCTION update_tour_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update tour average rating and review count
    UPDATE tours 
    SET 
        average_rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM reviews
            WHERE tour_id = COALESCE(NEW.tour_id, OLD.tour_id)
        ),
        review_count = (
            SELECT COUNT(*)
            FROM reviews
            WHERE tour_id = COALESCE(NEW.tour_id, OLD.tour_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.tour_id, OLD.tour_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tour_stats_on_review_change
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_tour_statistics();

-- Update booking counts trigger
CREATE OR REPLACE FUNCTION update_booking_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update tour booking count
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status != OLD.status) THEN
        IF NEW.status = 'confirmed' THEN
            UPDATE tours 
            SET booking_count = booking_count + 1,
                updated_at = NOW()
            WHERE id = NEW.tour_id;
        END IF;
    END IF;
    
    -- Handle status changes
    IF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
            -- Booking confirmed
            UPDATE tours 
            SET booking_count = booking_count + 1,
                updated_at = NOW()
            WHERE id = NEW.tour_id;
        ELSIF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
            -- Booking no longer confirmed
            UPDATE tours 
            SET booking_count = GREATEST(0, booking_count - 1),
                updated_at = NOW()
            WHERE id = NEW.tour_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_booking_counts_on_status_change
    AFTER INSERT OR UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_booking_counts();

-- @down

-- Drop triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
DROP TRIGGER IF EXISTS update_user_addresses_updated_at ON user_addresses;
DROP TRIGGER IF EXISTS update_emergency_contacts_updated_at ON emergency_contacts;
DROP TRIGGER IF EXISTS update_tour_categories_updated_at ON tour_categories;
DROP TRIGGER IF EXISTS update_tours_updated_at ON tours;
DROP TRIGGER IF EXISTS update_tour_dates_updated_at ON tour_dates;
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
DROP TRIGGER IF EXISTS update_booking_participants_updated_at ON booking_participants;
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;

DROP TRIGGER IF EXISTS update_tour_stats_on_review_change ON reviews;
DROP TRIGGER IF EXISTS update_booking_counts_on_status_change ON bookings;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS update_tour_statistics();
DROP FUNCTION IF EXISTS update_booking_counts();

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS review_aspects CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS booking_notifications CASCADE;
DROP TABLE IF EXISTS refunds CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS booking_participants CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS tour_policies CASCADE;
DROP TABLE IF EXISTS tour_features CASCADE;
DROP TABLE IF EXISTS tour_itinerary CASCADE;
DROP TABLE IF EXISTS tour_locations CASCADE;
DROP TABLE IF EXISTS tour_images CASCADE;
DROP TABLE IF EXISTS tour_dates CASCADE;
DROP TABLE IF EXISTS tours CASCADE;
DROP TABLE IF EXISTS tour_categories CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS emergency_contacts CASCADE;
DROP TABLE IF EXISTS user_addresses CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;

-- Drop ENUM types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS entity_status CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS tour_type CASCADE;
DROP TYPE IF EXISTS difficulty_level CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS notification_channel CASCADE;