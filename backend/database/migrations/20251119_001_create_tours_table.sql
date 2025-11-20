-- Create tours table migration
-- Migration ID: 20251119_001
-- Created: 2025-11-19
-- Description: Create tours table with comprehensive tour management fields

CREATE TYPE tour_type AS ENUM (
    'ADVENTURE', 'CULTURAL', 'LEISURE', 'BUSINESS', 'WILDLIFE', 
    'BEACH', 'MOUNTAIN', 'CITY', 'HISTORICAL', 'FOOD', 'WELLNESS'
);

CREATE TYPE difficulty_level AS ENUM (
    'EASY', 'MODERATE', 'CHALLENGING', 'EXPERT'
);

CREATE TYPE tour_status AS ENUM (
    'DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'SUSPENDED', 'ARCHIVED'
);

CREATE TYPE age_restriction AS ENUM (
    'ALL_AGES', 'ADULTS_ONLY', 'FAMILIES', 'CHILDREN', 'SENIORS'
);

CREATE TABLE tours (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dmc_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic information
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL CHECK (length(description) >= 10),
    short_description VARCHAR(500),
    
    -- Categorization and classification
    tour_type tour_type NOT NULL,
    difficulty_level difficulty_level NOT NULL,
    age_restriction age_restriction DEFAULT 'ALL_AGES',
    
    -- Duration and scheduling
    duration_days INTEGER NOT NULL CHECK (duration_days >= 1 AND duration_days <= 365),
    duration_nights INTEGER NOT NULL CHECK (duration_nights >= 0 AND duration_nights <= 364),
    
    -- Group size configuration
    group_size_min INTEGER NOT NULL DEFAULT 1 CHECK (group_size_min >= 1 AND group_size_min <= 1000),
    group_size_max INTEGER NOT NULL DEFAULT 1 CHECK (group_size_max >= 1 AND group_size_max <= 1000),
    group_size_max CHECK (group_size_max >= group_size_min),
    
    -- Pricing information
    base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
    currency CHAR(3) NOT NULL CHECK (currency IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY')),
    
    -- Content arrays
    inclusions TEXT[] DEFAULT '{}' CHECK (array_length(inclusions, 1) <= 50),
    exclusions TEXT[] DEFAULT '{}' CHECK (array_length(exclusions, 1) <= 50),
    itinerary JSONB DEFAULT '[]' CHECK (jsonb_typeof(itinerary) = 'array'),
    
    -- Location and meeting information
    meeting_point JSONB NOT NULL CHECK (meeting_point ? 'address'),
    
    -- Requirements and equipment
    requirements TEXT[] DEFAULT '{}' CHECK (array_length(requirements, 1) <= 20),
    equipment TEXT[] DEFAULT '{}' CHECK (array_length(equipment, 1) <= 20),
    
    -- Policies
    policies JSONB NOT NULL,
    
    -- Media and images
    featured_image_id UUID,
    
    -- SEO and discovery
    slug VARCHAR(255) UNIQUE NOT NULL,
    meta_title VARCHAR(255),
    meta_description TEXT,
    keywords TEXT[],
    
    -- Status and workflow
    status tour_status DEFAULT 'DRAFT',
    published_at TIMESTAMP WITH TIME ZONE,
    suspended_at TIMESTAMP WITH TIME ZONE,
    suspension_reason TEXT,
    
    -- Quality metrics
    average_rating DECIMAL(3,2) DEFAULT 0.0 CHECK (average_rating >= 0.0 AND average_rating <= 5.0),
    total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
    total_bookings INTEGER DEFAULT 0 CHECK (total_bookings >= 0),
    total_revenue DECIMAL(12,2) DEFAULT 0.0 CHECK (total_revenue >= 0),
    
    -- Popularity and engagement
    total_views INTEGER DEFAULT 0 CHECK (total_views >= 0),
    weekly_bookings INTEGER DEFAULT 0 CHECK (weekly_bookings >= 0),
    monthly_bookings INTEGER DEFAULT 0 CHECK (monthly_bookings >= 0),
    conversion_rate DECIMAL(5,4) DEFAULT 0.0 CHECK (conversion_rate >= 0.0 AND conversion_rate <= 1.0),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_duration CHECK (duration_nights = duration_days - 1),
    CONSTRAINT valid_pricing CHECK (base_price > 0),
    CONSTRAINT valid_rating CHECK (total_reviews = 0 OR average_rating > 0)
);

-- Create indexes for performance
CREATE INDEX idx_tours_dmc_id ON tours(dmc_id);
CREATE INDEX idx_tours_created_by ON tours(created_by);
CREATE INDEX idx_tours_status ON tours(status);
CREATE INDEX idx_tours_tour_type ON tours(tour_type);
CREATE INDEX idx_tours_difficulty_level ON tours(difficulty_level);
CREATE INDEX idx_tours_price ON tours(base_price, currency);
CREATE INDEX idx_tours_duration ON tours(duration_days);
CREATE INDEX idx_tours_group_size ON tours(group_size_min, group_size_max);
CREATE INDEX idx_tours_rating ON tours(average_rating DESC);
CREATE INDEX idx_tours_published_at ON tours(published_at DESC);
CREATE INDEX idx_tours_created_at ON tours(created_at DESC);
CREATE INDEX idx_tours_popularity ON tours(total_views DESC, average_rating DESC);
CREATE INDEX idx_tours_weekly_bookings ON tours(weekly_bookings DESC);

-- Full-text search indexes
CREATE INDEX idx_tours_search ON tours USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(short_description, '')));

-- Composite indexes for common queries
CREATE INDEX idx_tours_search_basic ON tours(status, tour_type, base_price, currency);
CREATE INDEX idx_tours_dmc_status ON tours(dmc_id, status);
CREATE INDEX idx_tours_featured ON tours(status, average_rating DESC) WHERE status = 'PUBLISHED';

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_tours_updated_at 
    BEFORE UPDATE ON tours 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION generate_tour_slug(title_text TEXT)
RETURNS TEXT AS $$
DECLARE
    slug_text TEXT;
    counter INTEGER := 1;
    final_slug TEXT;
BEGIN
    -- Basic slug generation
    slug_text := lower(trim(regexp_replace(title_text, '[^a-zA-Z0-9\s-]', '', 'g')));
    slug_text := regexp_replace(slug_text, '\s+', '-', 'g');
    slug_text := regexp_replace(slug_text, '-+', '-', 'g');
    
    -- Ensure uniqueness
    LOOP
        final_slug := slug_text;
        IF counter > 1 THEN
            final_slug := slug_text || '-' || counter;
        END IF;
        
        EXIT WHEN NOT EXISTS (SELECT 1 FROM tours WHERE slug = final_slug);
        counter := counter + 1;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically generate slug on insert
CREATE OR REPLACE FUNCTION set_tour_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_tour_slug(NEW.title);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic slug generation
CREATE TRIGGER set_tours_slug 
    BEFORE INSERT OR UPDATE ON tours 
    FOR EACH ROW 
    EXECUTE FUNCTION set_tour_slug();