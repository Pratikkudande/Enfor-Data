-- Create clients table with comprehensive schema
CREATE TABLE IF NOT EXISTS clients (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    
    -- Client Classification
    type VARCHAR(50) NOT NULL CHECK (type IN ('buyer', 'seller', 'tenant', 'owner', 'list_property_for_rent')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'converted', 'inactive')),
    
    -- Budget Information (optional - mainly for buyers/tenants)
    budget_min DECIMAL(15, 2),
    budget_max DECIMAL(15, 2),
    
    -- Location & Requirements
    preferred_location VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    
    -- Requirements/Enquiry
    requirements TEXT NOT NULL,
    notes TEXT,
    
    -- Ownership
    broker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Denormalized broker info (for performance)
    broker_name VARCHAR(200),
    broker_city VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes

-- Primary broker query optimization (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_clients_broker_created 
    ON clients(broker_id, created_at DESC);

-- Filter combinations for broker dashboard
CREATE INDEX IF NOT EXISTS idx_clients_broker_type 
    ON clients(broker_id, type);

CREATE INDEX IF NOT EXISTS idx_clients_broker_status 
    ON clients(broker_id, status);

-- Email and phone indexes for lookups
CREATE INDEX IF NOT EXISTS idx_clients_email 
    ON clients(email);

CREATE INDEX IF NOT EXISTS idx_clients_phone 
    ON clients(phone);

-- Fuzzy search indexes using trigram for name and location
CREATE INDEX IF NOT EXISTS idx_clients_name_trgm 
    ON clients USING gin((first_name || ' ' || last_name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_clients_location_trgm 
    ON clients USING gin(preferred_location gin_trgm_ops);

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to sync broker information from users table to clients
CREATE OR REPLACE FUNCTION sync_broker_info_to_clients()
RETURNS TRIGGER AS $$
BEGIN
    -- Update all clients for this broker when their name or city changes
    UPDATE clients
    SET 
        broker_name = NEW.first_name || ' ' || NEW.last_name,
        broker_city = NEW.city,
        updated_at = NOW()
    WHERE broker_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync broker info when user profile changes
CREATE TRIGGER sync_broker_info_to_clients_trigger
    AFTER UPDATE OF first_name, last_name, city ON users
    FOR EACH ROW
    EXECUTE FUNCTION sync_broker_info_to_clients();

-- Function to populate broker info on client insert
CREATE OR REPLACE FUNCTION populate_client_broker_info()
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
CREATE TRIGGER populate_client_broker_info_on_insert
    BEFORE INSERT ON clients
    FOR EACH ROW
    EXECUTE FUNCTION populate_client_broker_info();
