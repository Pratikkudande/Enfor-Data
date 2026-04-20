-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create properties table with comprehensive schema
CREATE TABLE IF NOT EXISTS properties (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Property Information
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('apartment', 'house', 'commercial', 'plot')),
    listing_type VARCHAR(50) NOT NULL CHECK (listing_type IN ('sale', 'rent')),
    
    -- Pricing and Size
    price DECIMAL(15, 2) NOT NULL,
    area DECIMAL(10, 2) NOT NULL,
    
    -- Property Details (optional for commercial/plot)
    bedrooms INTEGER,
    bathrooms INTEGER,
    
    -- Location Information
    location VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    
    -- Description and Features
    description TEXT NOT NULL,
    amenities TEXT[] DEFAULT '{}',
    
    -- Status and Ownership
    status VARCHAR(50) NOT NULL DEFAULT 'available' 
        CHECK (status IN ('available', 'sold', 'rented', 'under_negotiation')),
    broker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID,
    
    -- Denormalized broker/client info for admin queries and performance
    broker_name VARCHAR(200),
    broker_city VARCHAR(100),
    client_name VARCHAR(200),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Performance Indexes

-- Primary broker query optimization (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_properties_broker_created 
    ON properties(broker_id, created_at DESC)
    WHERE deleted_at IS NULL;

-- Filter combinations for broker dashboard
CREATE INDEX IF NOT EXISTS idx_properties_broker_status 
    ON properties(broker_id, status)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_properties_broker_type 
    ON properties(broker_id, type)
    WHERE deleted_at IS NULL;

-- Admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_properties_status_created 
    ON properties(status, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_properties_city_state 
    ON properties(city, state)
    WHERE deleted_at IS NULL;

-- Search functionality using trigram indexes for fuzzy text search
CREATE INDEX IF NOT EXISTS idx_properties_title_trgm 
    ON properties USING gin(title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_properties_location_trgm 
    ON properties USING gin(location gin_trgm_ops);

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_properties_updated_at 
    BEFORE UPDATE ON properties 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to sync broker information from users table to properties
CREATE OR REPLACE FUNCTION sync_broker_info_to_properties()
RETURNS TRIGGER AS $$
BEGIN
    -- Update all properties for this broker when their name or city changes
    UPDATE properties
    SET 
        broker_name = NEW.first_name || ' ' || NEW.last_name,
        broker_city = NEW.city,
        updated_at = NOW()
    WHERE broker_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync broker info when user profile changes
CREATE TRIGGER sync_broker_info
    AFTER UPDATE OF first_name, last_name, city ON users
    FOR EACH ROW
    EXECUTE FUNCTION sync_broker_info_to_properties();

-- Function to populate broker info on property insert
CREATE OR REPLACE FUNCTION populate_broker_info()
RETURNS TRIGGER AS $$
BEGIN
    -- Automatically populate broker_name and broker_city from users table
    SELECT 
        first_name || ' ' || last_name,
        city
    INTO 
        NEW.broker_name,
        NEW.broker_city
    FROM users
    WHERE id = NEW.broker_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to populate broker info on insert
CREATE TRIGGER populate_broker_info_on_insert
    BEFORE INSERT ON properties
    FOR EACH ROW
    EXECUTE FUNCTION populate_broker_info();
