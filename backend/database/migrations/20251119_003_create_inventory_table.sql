-- Create inventory table migration
-- Migration ID: 20251119_003
-- Created: 2025-11-19
-- Description: Create inventory table for managing real-time tour availability

CREATE TYPE inventory_status AS ENUM (
    'AVAILABLE', 'LIMITED', 'SOLD_OUT', 'BLOCKED', 'MAINTENANCE'
);

CREATE TYPE booking_type AS ENUM (
    'CONFIRMED', 'PENDING', 'CANCELLED', 'WAITLIST'
);

CREATE TABLE inventory (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    
    -- Date and time information
    tour_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    
    -- Availability configuration
    total_capacity INTEGER NOT NULL DEFAULT 0 CHECK (total_capacity >= 0),
    booked_count INTEGER NOT NULL DEFAULT 0 CHECK (booked_count >= 0),
    available_spots INTEGER GENERATED ALWAYS AS (total_capacity - booked_count) STORED CHECK (available_spots >= 0),
    
    -- Pricing configuration
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    currency CHAR(3) NOT NULL CHECK (currency IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY')),
    price_type VARCHAR(20) DEFAULT 'FIXED' CHECK (price_type IN ('FIXED', 'DYNAMIC', 'DISCOUNTED')),
    
    -- Status and availability
    status inventory_status DEFAULT 'AVAILABLE',
    cutoff_time TIMESTAMP WITH TIME ZONE,
    
    -- Seasonal pricing
    seasonal_price DECIMAL(10,2) CHECK (seasonal_price >= 0),
    season_start_date DATE,
    season_end_date DATE,
    
    -- Special conditions
    is_private BOOLEAN DEFAULT FALSE,
    requires_approval BOOLEAN DEFAULT FALSE,
    min_advance_booking INTEGER DEFAULT 24 CHECK (min_advance_booking >= 0),
    max_advance_booking INTEGER DEFAULT 365 CHECK (max_advance_booking >= 0),
    
    -- Blocked periods and special dates
    is_blocked BOOLEAN DEFAULT FALSE,
    block_reason TEXT,
    blocked_until TIMESTAMP WITH TIME ZONE,
    
    -- External synchronization
    external_id VARCHAR(255),
    external_source VARCHAR(100),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    
    -- Booking statistics
    total_bookings INTEGER DEFAULT 0 CHECK (total_bookings >= 0),
    no_show_count INTEGER DEFAULT 0 CHECK (no_show_count >= 0),
    cancellation_count INTEGER DEFAULT 0 CHECK (cancellation_count >= 0),
    waitlist_count INTEGER DEFAULT 0 CHECK (waitlist_count >= 0),
    
    -- Revenue tracking
    gross_revenue DECIMAL(12,2) DEFAULT 0.0 CHECK (gross_revenue >= 0),
    net_revenue DECIMAL(12,2) DEFAULT 0.0 CHECK (net_revenue >= 0),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_capacity CHECK (booked_count <= total_capacity),
    CONSTRAINT valid_advance_booking CHECK (min_advance_booking <= max_advance_booking),
    CONSTRAINT unique_tour_date_time UNIQUE (tour_id, tour_date, start_time, end_time),
    CONSTRAINT valid_seasonal_period CHECK (
        (season_start_date IS NULL AND season_end_date IS NULL) OR 
        (season_start_date IS NOT NULL AND season_end_date IS NOT NULL AND season_start_date <= season_end_date)
    )
);

-- Create indexes for performance
CREATE INDEX idx_inventory_tour_id ON inventory(tour_id);
CREATE INDEX idx_inventory_date ON inventory(tour_date);
CREATE INDEX idx_inventory_status ON inventory(status);
CREATE INDEX idx_inventory_capacity ON inventory(total_capacity, booked_count);
CREATE INDEX idx_inventory_availability ON inventory(tour_date, status) WHERE status != 'SOLD_OUT';
CREATE INDEX idx_inventory_tour_date ON inventory(tour_id, tour_date);
CREATE INDEX idx_inventory_price ON inventory(price, currency);
CREATE INDEX idx_inventory_created_at ON inventory(created_at DESC);
CREATE INDEX idx_inventory_external_sync ON inventory(external_source, last_sync_at);

-- Composite indexes for common queries
CREATE INDEX idx_inventory_booking_lookup ON inventory(tour_id, tour_date, status);
CREATE INDEX idx_inventory_price_availability ON inventory(tour_date, status, price) WHERE status != 'SOLD_OUT';
CREATE INDEX idx_inventory_capacity_alert ON inventory(tour_id, tour_date, available_spots) WHERE available_spots <= 5;

-- Partial indexes for active inventory
CREATE INDEX idx_inventory_active ON inventory(tour_id, tour_date, status) WHERE deleted_at IS NULL AND status != 'BLOCKED';
CREATE INDEX idx_inventory_bookable ON inventory(tour_id, tour_date, status) WHERE deleted_at IS NULL AND status IN ('AVAILABLE', 'LIMITED');

-- Create function to update inventory status based on availability
CREATE OR REPLACE FUNCTION update_inventory_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-update status based on availability
    IF NEW.available_spots <= 0 THEN
        NEW.status = 'SOLD_OUT';
    ELSIF NEW.available_spots <= 5 AND NEW.total_capacity > 10 THEN
        NEW.status = 'LIMITED';
    ELSIF NEW.status = 'SOLD_OUT' AND NEW.available_spots > 0 THEN
        NEW.status = 'AVAILABLE';
    ELSIF NEW.status = 'LIMITED' AND NEW.available_spots > 5 THEN
        NEW.status = 'AVAILABLE';
    END IF;
    
    -- Set cutoff time if not provided (24 hours before tour)
    IF NEW.cutoff_time IS NULL THEN
        NEW.cutoff_time := (NEW.tour_date - INTERVAL '1 day')::timestamp;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory status updates
CREATE TRIGGER update_inventory_status_trigger 
    BEFORE INSERT OR UPDATE ON inventory 
    FOR EACH ROW 
    EXECUTE FUNCTION update_inventory_status();

-- Create function to handle booking events
CREATE OR REPLACE FUNCTION handle_booking_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Update inventory based on booking status
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.booking_type != NEW.booking_type) THEN
        CASE NEW.booking_type
            WHEN 'CONFIRMED' THEN
                -- Confirmed booking increases booked count
                UPDATE inventory 
                SET booked_count = booked_count + 1,
                    total_bookings = total_bookings + 1
                WHERE id = NEW.inventory_id;
                
            WHEN 'CANCELLED' THEN
                -- Cancelled booking decreases booked count
                UPDATE inventory 
                SET booked_count = booked_count - 1,
                    cancellation_count = cancellation_count + 1
                WHERE id = NEW.inventory_id AND booked_count > 0;
                
            WHEN 'NO_SHOW' THEN
                -- No-show booking (confirmed but not used)
                UPDATE inventory 
                SET no_show_count = no_show_count + 1
                WHERE id = NEW.inventory_id;
                
            WHEN 'WAITLIST' THEN
                -- Waitlist booking
                UPDATE inventory 
                SET waitlist_count = waitlist_count + 1
                WHERE id = NEW.inventory_id;
        END CASE;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for booking event handling (this would reference a bookings table)
-- CREATE TRIGGER handle_booking_event_trigger 
--     AFTER INSERT OR UPDATE ON bookings 
--     FOR EACH ROW 
--     EXECUTE FUNCTION handle_booking_event();

-- Create function to check availability
CREATE OR REPLACE FUNCTION check_inventory_availability(
    p_tour_id UUID,
    p_tour_date DATE,
    p_group_size INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
    inventory_record inventory%ROWTYPE;
BEGIN
    SELECT * INTO inventory_record
    FROM inventory
    WHERE tour_id = p_tour_id 
    AND tour_date = p_tour_date 
    AND status NOT IN ('SOLD_OUT', 'BLOCKED', 'MAINTENANCE')
    AND deleted_at IS NULL;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if enough spots are available
    IF inventory_record.available_spots < p_group_size THEN
        RETURN FALSE;
    END IF;
    
    -- Check cutoff time
    IF inventory_record.cutoff_time < NOW() THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get inventory for date range
CREATE OR REPLACE FUNCTION get_inventory_for_range(
    p_tour_id UUID,
    p_start_date DATE,
    p_end_date DATE
) RETURNS TABLE(
    tour_date DATE,
    total_capacity INTEGER,
    booked_count INTEGER,
    available_spots INTEGER,
    status inventory_status,
    price DECIMAL(10,2),
    currency CHAR(3)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.tour_date,
        i.total_capacity,
        i.booked_count,
        i.available_spots,
        i.status,
        i.price,
        i.currency
    FROM inventory i
    WHERE i.tour_id = p_tour_id
    AND i.tour_date BETWEEN p_start_date AND p_end_date
    AND i.deleted_at IS NULL
    ORDER BY i.tour_date;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger
CREATE TRIGGER update_inventory_updated_at 
    BEFORE UPDATE ON inventory 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();