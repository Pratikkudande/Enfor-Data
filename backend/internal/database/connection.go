package database

import (
	"database/sql"
	"fmt"
	"log"

	"enfor-data-backend/internal/config"

	_ "github.com/lib/pq"
)

type DB struct {
	*sql.DB
}

func NewConnection(cfg *config.Config) (*DB, error) {
    dsn := cfg.Database.URL
    if dsn == "" {
        dsn = fmt.Sprintf(
            "host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
            cfg.Database.Host,
            cfg.Database.Port,
            cfg.Database.User,
            cfg.Database.Password,
            cfg.Database.DBName,
            cfg.Database.SSLMode,
        )
    }

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Clear any stale prepared statements from the connection pooler
	// This prevents "bind message has X result formats but query has Y columns" errors
	// when the server restarts with a different query shape
	if _, err := db.Exec("DEALLOCATE ALL"); err != nil {
		log.Printf("Warning: DEALLOCATE ALL failed (harmless): %v", err)
	}

	// Set connection pool settings
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	log.Println("Database connection established successfully")
	return &DB{db}, nil
}

func (db *DB) Close() error {
	return db.DB.Close()
}

func (db *DB) RunMigrations() error {
	// Read and execute migration file
	migrationSQL := `
-- Create users table with all fields from frontend registration form
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    
    -- Business Information
    firm_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('broker', 'channel_partner', 'admin')),
    
    -- Contact Information
    whatsapp_number VARCHAR(20) NOT NULL,
    alternative_number VARCHAR(20),
    foreign_number VARCHAR(20),
    
    -- Address Information
    address TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    
    -- Profile
    profile_image VARCHAR(500),
    
    -- Status and Verification
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_city_state ON users(city, state);
CREATE INDEX IF NOT EXISTS idx_users_whatsapp ON users(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
`

	_, err := db.Exec(migrationSQL)
	if err != nil {
		return fmt.Errorf("failed to run users migration: %w", err)
	}

	// Migration 002: Create properties table
	propertiesMigration := `
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

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS client_id UUID,
ADD COLUMN IF NOT EXISTS client_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

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

CREATE INDEX IF NOT EXISTS idx_properties_client
    ON properties(client_id)
    WHERE client_id IS NOT NULL AND deleted_at IS NULL;

-- Search functionality using trigram indexes for fuzzy text search
CREATE INDEX IF NOT EXISTS idx_properties_title_trgm 
    ON properties USING gin(title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_properties_location_trgm 
    ON properties USING gin(location gin_trgm_ops);

-- Trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at 
    BEFORE UPDATE ON properties 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to sync broker information from users table to properties
CREATE OR REPLACE FUNCTION sync_broker_info_to_properties()
RETURNS TRIGGER AS $sync$
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
$sync$ LANGUAGE plpgsql;

-- Trigger to sync broker info when user profile changes
DROP TRIGGER IF EXISTS sync_broker_info ON users;
CREATE TRIGGER sync_broker_info
    AFTER UPDATE OF first_name, last_name, city ON users
    FOR EACH ROW
    EXECUTE FUNCTION sync_broker_info_to_properties();

-- Function to populate broker info on property insert
CREATE OR REPLACE FUNCTION populate_broker_info()
RETURNS TRIGGER AS $populate$
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
$populate$ LANGUAGE plpgsql;

-- Trigger to populate broker info on insert
DROP TRIGGER IF EXISTS populate_broker_info_on_insert ON properties;
CREATE TRIGGER populate_broker_info_on_insert
    BEFORE INSERT ON properties
    FOR EACH ROW
    EXECUTE FUNCTION populate_broker_info();
`

	_, err = db.Exec(propertiesMigration)
	if err != nil {
		return fmt.Errorf("failed to run properties migration: %w", err)
	}

	// Migration 003: Create clients table
	clientsMigration := `
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
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to sync broker information from users table to clients
CREATE OR REPLACE FUNCTION sync_broker_info_to_clients()
RETURNS TRIGGER AS $sync_clients$
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
$sync_clients$ LANGUAGE plpgsql;

-- Trigger to sync broker info when user profile changes
DROP TRIGGER IF EXISTS sync_broker_info_to_clients_trigger ON users;
CREATE TRIGGER sync_broker_info_to_clients_trigger
    AFTER UPDATE OF first_name, last_name, city ON users
    FOR EACH ROW
    EXECUTE FUNCTION sync_broker_info_to_clients();

-- Function to populate broker info on client insert
CREATE OR REPLACE FUNCTION populate_client_broker_info()
RETURNS TRIGGER AS $populate_client$
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
$populate_client$ LANGUAGE plpgsql;

-- Trigger to populate broker info on insert
DROP TRIGGER IF EXISTS populate_client_broker_info_on_insert ON clients;
CREATE TRIGGER populate_client_broker_info_on_insert
    BEFORE INSERT ON clients
    FOR EACH ROW
    EXECUTE FUNCTION populate_client_broker_info();
`

	_, err = db.Exec(clientsMigration)
	if err != nil {
		return fmt.Errorf("failed to run clients migration: %w", err)
	}

	// Migration: ensure clients table has all required columns (handles schema drift)
	clientsAlterMigration := `
ALTER TABLE clients ADD COLUMN IF NOT EXISTS budget_min DECIMAL(15, 2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS budget_max DECIMAL(15, 2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS expected_amount DECIMAL(15, 2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS preferred_location VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20) NOT NULL DEFAULT '';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS broker_name VARCHAR(200);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS broker_city VARCHAR(100);
`
	_, err = db.Exec(clientsAlterMigration)
	if err != nil {
		return fmt.Errorf("failed to run clients alter migration: %w", err)
	}

	clientsTypeConstraintMigration := `
ALTER TABLE clients
    DROP CONSTRAINT IF EXISTS clients_type_check,
    ADD CONSTRAINT clients_type_check CHECK (type IN ('buyer', 'seller', 'tenant', 'owner', 'list_property_for_rent'));
`
	_, err = db.Exec(clientsTypeConstraintMigration)
	if err != nil {
		return fmt.Errorf("failed to run clients type constraint migration: %w", err)
	}

	propertyClientMigration := `
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'properties_client_id_fkey'
    ) THEN
        ALTER TABLE properties
        ADD CONSTRAINT properties_client_id_fkey
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE OR REPLACE FUNCTION populate_property_client_info()
RETURNS TRIGGER AS $populate_property_client$
BEGIN
    IF NEW.client_id IS NOT NULL THEN
        SELECT first_name || ' ' || last_name
        INTO NEW.client_name
        FROM clients
        WHERE id = NEW.client_id;
    ELSE
        NEW.client_name = NULL;
    END IF;

    RETURN NEW;
END;
$populate_property_client$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS populate_property_client_info_on_write ON properties;
CREATE TRIGGER populate_property_client_info_on_write
    BEFORE INSERT OR UPDATE OF client_id ON properties
    FOR EACH ROW
    EXECUTE FUNCTION populate_property_client_info();

CREATE OR REPLACE FUNCTION sync_client_info_to_properties()
RETURNS TRIGGER AS $sync_property_client$
BEGIN
    UPDATE properties
    SET
        client_name = NEW.first_name || ' ' || NEW.last_name,
        updated_at = NOW()
    WHERE client_id = NEW.id;

    RETURN NEW;
END;
$sync_property_client$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_client_info_to_properties_trigger ON clients;
CREATE TRIGGER sync_client_info_to_properties_trigger
    AFTER UPDATE OF first_name, last_name ON clients
    FOR EACH ROW
    EXECUTE FUNCTION sync_client_info_to_properties();
`

	_, err = db.Exec(propertyClientMigration)
	if err != nil {
		return fmt.Errorf("failed to run property-client migration: %w", err)
	}

	// Migration 004: Create appointments table
	appointmentsMigration := `
-- Create appointments table with comprehensive schema
CREATE TABLE IF NOT EXISTS appointments (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Appointment Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    
    -- Relationships
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    broker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Classification
    type VARCHAR(50) NOT NULL CHECK (type IN ('site_visit', 'meeting', 'call')),
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' 
        CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    
    -- Denormalized fields for performance
    client_name VARCHAR(200),
    client_phone VARCHAR(20),
    property_address TEXT,
    broker_name VARCHAR(200),
    broker_city VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes

-- Primary query pattern: broker's appointments ordered by date/time
CREATE INDEX IF NOT EXISTS idx_appointments_broker_datetime 
    ON appointments(broker_id, date ASC, time ASC);

-- Filter by status
CREATE INDEX IF NOT EXISTS idx_appointments_broker_status 
    ON appointments(broker_id, status);

-- Filter by type
CREATE INDEX IF NOT EXISTS idx_appointments_broker_type 
    ON appointments(broker_id, type);

-- Filter by client
CREATE INDEX IF NOT EXISTS idx_appointments_client 
    ON appointments(client_id);

-- Filter by property (partial index for non-null values)
CREATE INDEX IF NOT EXISTS idx_appointments_property 
    ON appointments(property_id) WHERE property_id IS NOT NULL;

-- Date range queries for calendar
CREATE INDEX IF NOT EXISTS idx_appointments_broker_date_range 
    ON appointments(broker_id, date);

-- Trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to populate client info on appointment insert
CREATE OR REPLACE FUNCTION populate_appointment_client_info()
RETURNS TRIGGER AS $populate_appt_client$
BEGIN
    -- Automatically populate client_name and client_phone from clients table
    SELECT 
        first_name || ' ' || last_name,
        phone
    INTO 
        NEW.client_name,
        NEW.client_phone
    FROM clients
    WHERE id = NEW.client_id;
    
    RETURN NEW;
END;
$populate_appt_client$ LANGUAGE plpgsql;

-- Trigger to populate client info on insert
DROP TRIGGER IF EXISTS populate_appointment_client_info_on_insert ON appointments;
CREATE TRIGGER populate_appointment_client_info_on_insert
    BEFORE INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION populate_appointment_client_info();

-- Function to populate property info on appointment insert
CREATE OR REPLACE FUNCTION populate_appointment_property_info()
RETURNS TRIGGER AS $populate_appt_property$
BEGIN
    -- Automatically populate property_address from properties table if property_id is provided
    IF NEW.property_id IS NOT NULL THEN
        SELECT address
        INTO NEW.property_address
        FROM properties
        WHERE id = NEW.property_id;
    END IF;
    
    RETURN NEW;
END;
$populate_appt_property$ LANGUAGE plpgsql;

-- Trigger to populate property info on insert
DROP TRIGGER IF EXISTS populate_appointment_property_info_on_insert ON appointments;
CREATE TRIGGER populate_appointment_property_info_on_insert
    BEFORE INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION populate_appointment_property_info();

-- Function to populate broker info on appointment insert
CREATE OR REPLACE FUNCTION populate_appointment_broker_info()
RETURNS TRIGGER AS $populate_appt_broker$
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
$populate_appt_broker$ LANGUAGE plpgsql;

-- Trigger to populate broker info on insert
DROP TRIGGER IF EXISTS populate_appointment_broker_info_on_insert ON appointments;
CREATE TRIGGER populate_appointment_broker_info_on_insert
    BEFORE INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION populate_appointment_broker_info();

-- Function to sync client info when client is updated
CREATE OR REPLACE FUNCTION sync_client_info_to_appointments()
RETURNS TRIGGER AS $sync_client_appt$
BEGIN
    -- Update all appointments for this client when their name or phone changes
    UPDATE appointments
    SET 
        client_name = NEW.first_name || ' ' || NEW.last_name,
        client_phone = NEW.phone,
        updated_at = NOW()
    WHERE client_id = NEW.id;
    
    RETURN NEW;
END;
$sync_client_appt$ LANGUAGE plpgsql;

-- Trigger to sync client info when client profile changes
DROP TRIGGER IF EXISTS sync_client_info_to_appointments_trigger ON clients;
CREATE TRIGGER sync_client_info_to_appointments_trigger
    AFTER UPDATE OF first_name, last_name, phone ON clients
    FOR EACH ROW
    EXECUTE FUNCTION sync_client_info_to_appointments();

-- Function to sync property info when property is updated
CREATE OR REPLACE FUNCTION sync_property_info_to_appointments()
RETURNS TRIGGER AS $sync_property_appt$
BEGIN
    -- Update all appointments for this property when address changes
    UPDATE appointments
    SET 
        property_address = NEW.address,
        updated_at = NOW()
    WHERE property_id = NEW.id;
    
    RETURN NEW;
END;
$sync_property_appt$ LANGUAGE plpgsql;

-- Trigger to sync property info when property address changes
DROP TRIGGER IF EXISTS sync_property_info_to_appointments_trigger ON properties;
CREATE TRIGGER sync_property_info_to_appointments_trigger
    AFTER UPDATE OF address ON properties
    FOR EACH ROW
    EXECUTE FUNCTION sync_property_info_to_appointments();

-- Function to sync broker info to appointments when user is updated
CREATE OR REPLACE FUNCTION sync_broker_info_to_appointments()
RETURNS TRIGGER AS $sync_broker_appt$
BEGIN
    -- Update all appointments for this broker when their name or city changes
    UPDATE appointments
    SET 
        broker_name = NEW.first_name || ' ' || NEW.last_name,
        broker_city = NEW.city,
        updated_at = NOW()
    WHERE broker_id = NEW.id;
    
    RETURN NEW;
END;
$sync_broker_appt$ LANGUAGE plpgsql;

-- Trigger to sync broker info when user profile changes
DROP TRIGGER IF EXISTS sync_broker_info_to_appointments_trigger ON users;
CREATE TRIGGER sync_broker_info_to_appointments_trigger
    AFTER UPDATE OF first_name, last_name, city ON users
    FOR EACH ROW
    EXECUTE FUNCTION sync_broker_info_to_appointments();
`

	_, err = db.Exec(appointmentsMigration)
	if err != nil {
		return fmt.Errorf("failed to run appointments migration: %w", err)
	}

	log.Println("Database migrations completed successfully")
	return nil
}
