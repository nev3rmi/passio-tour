-- Create tour_images table migration
-- Migration ID: 20251119_002
-- Created: 2025-11-19
-- Description: Create tour_images table for managing tour media files

CREATE TYPE image_status AS ENUM (
    'PROCESSING', 'ACTIVE', 'INACTIVE', 'DELETED'
);

CREATE TYPE image_type AS ENUM (
    'GALLERY', 'COVER', 'THUMBNAIL', 'ICON'
);

CREATE TABLE tour_images (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    
    -- File information
    original_filename VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL CHECK (file_size > 0),
    mime_type VARCHAR(100) NOT NULL CHECK (mime_type ~ '^image/'),
    
    -- Image metadata
    image_type image_type DEFAULT 'GALLERY',
    status image_status DEFAULT 'PROCESSING',
    alt_text TEXT,
    caption TEXT,
    sort_order INTEGER DEFAULT 0,
    
    -- Dimensions
    width INTEGER CHECK (width > 0),
    height INTEGER CHECK (height > 0),
    
    -- Processing information
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_error TEXT,
    
    -- URLs for different sizes
    thumbnail_url TEXT,
    medium_url TEXT,
    large_url TEXT,
    
    -- SEO and accessibility
    is_featured BOOLEAN DEFAULT FALSE,
    is_primary BOOLEAN DEFAULT FALSE,
    
    -- Analytics
    views INTEGER DEFAULT 0 CHECK (views >= 0),
    downloads INTEGER DEFAULT 0 CHECK (downloads >= 0),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_sort_order CHECK (sort_order >= 0),
    CONSTRAINT single_primary_per_tour CHECK (
        NOT EXISTS (
            SELECT 1 FROM tour_images ti 
            WHERE ti.tour_id = tour_images.tour_id 
            AND ti.is_primary = TRUE 
            AND ti.id != tour_images.id 
            AND ti.deleted_at IS NULL
        )
    )
);

-- Create indexes for performance
CREATE INDEX idx_tour_images_tour_id ON tour_images(tour_id);
CREATE INDEX idx_tour_images_status ON tour_images(status);
CREATE INDEX idx_tour_images_type ON tour_images(image_type);
CREATE INDEX idx_tour_images_sort_order ON tour_images(tour_id, sort_order);
CREATE INDEX idx_tour_images_featured ON tour_images(tour_id, is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_tour_images_primary ON tour_images(tour_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_tour_images_created_at ON tour_images(created_at DESC);

-- Create function to enforce single primary image per tour
CREATE OR REPLACE FUNCTION enforce_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = TRUE THEN
        -- Deactivate other primary images for the same tour
        UPDATE tour_images 
        SET is_primary = FALSE 
        WHERE tour_id = NEW.tour_id 
        AND id != NEW.id 
        AND deleted_at IS NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single primary image
CREATE TRIGGER enforce_single_primary_tour_image 
    BEFORE INSERT OR UPDATE ON tour_images 
    FOR EACH ROW 
    EXECUTE FUNCTION enforce_single_primary_image();

-- Create updated_at trigger
CREATE TRIGGER update_tour_images_updated_at 
    BEFORE UPDATE ON tour_images 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to handle image deletion
CREATE OR REPLACE FUNCTION handle_tour_image_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- If this was the primary image, unset primary status for all remaining images
    IF OLD.is_primary = TRUE THEN
        UPDATE tour_images 
        SET is_primary = FALSE 
        WHERE tour_id = OLD.tour_id 
        AND deleted_at IS NULL
        AND id != OLD.id;
    END IF;
    
    -- If this was the featured image, unset featured status for the tour
    IF OLD.is_featured = TRUE THEN
        UPDATE tours 
        SET featured_image_id = NULL 
        WHERE id = OLD.tour_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for image deletion handling
CREATE TRIGGER handle_tour_image_deletion_trigger 
    BEFORE DELETE ON tour_images 
    FOR EACH ROW 
    EXECUTE FUNCTION handle_tour_image_deletion();