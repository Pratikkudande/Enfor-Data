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
	// First, run the display_name column fix
	displayNameFix := `
-- Fix display_name column if missing
DO $$
BEGIN
    -- Check if display_name column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_plans' 
        AND column_name = 'display_name'
    ) THEN
        ALTER TABLE subscription_plans ADD COLUMN display_name VARCHAR(100) NOT NULL DEFAULT '';
        
        -- Update existing records with display names
        UPDATE subscription_plans SET display_name = 
            CASE 
                WHEN name = 'free_trial' THEN 'Free Trial'
                WHEN name = 'starter' THEN 'Starter Plan'
                WHEN name = 'professional' THEN 'Professional Plan'
                WHEN name = 'enterprise' THEN 'Enterprise Plan'
                ELSE INITCAP(REPLACE(name, '_', ' '))
            END;
    END IF;
END $$;
`
	_, err := db.Exec(displayNameFix)
	if err != nil {
		return fmt.Errorf("failed to run display_name fix: %w", err)
	}

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

	_, err = db.Exec(migrationSQL)
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
    type VARCHAR(50) NOT NULL CHECK (type IN ('apartment', 'house', 'commercial', 'plot', 'row_house', 'shop', 'pg', 'bungalow')),
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
    photos TEXT[] DEFAULT '{}',
    
    -- Status and Ownership
    status VARCHAR(50) NOT NULL DEFAULT 'available' 
        CHECK (status IN ('available', 'sold', 'rented', 'hold', 'closed', 'under_discussion', 'under_negotiation')),
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
ALTER TABLE clients ADD COLUMN IF NOT EXISTS min_price DECIMAL(15, 2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS max_price DECIMAL(15, 2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS property_address TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS buildup_area DECIMAL(10, 2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS carpet_area DECIMAL(10, 2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS measurement_unit VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS deposit_budget DECIMAL(15, 2);

-- Ensure all optional text columns have DEFAULT '' so NOT NULL is never violated by empty strings
ALTER TABLE clients ALTER COLUMN address           SET DEFAULT '';
ALTER TABLE clients ALTER COLUMN city              SET DEFAULT '';
ALTER TABLE clients ALTER COLUMN state             SET DEFAULT '';
ALTER TABLE clients ALTER COLUMN postal_code       SET DEFAULT '';
ALTER TABLE clients ALTER COLUMN preferred_location SET DEFAULT '';
ALTER TABLE clients ALTER COLUMN requirements      SET DEFAULT '';
ALTER TABLE clients ALTER COLUMN email             SET DEFAULT '';
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

	// Migration 008: Create agreements table
	agreementsMigration := `
CREATE TABLE IF NOT EXISTS agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
    broker_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date   DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'expired', 'terminated')),
    property_title   VARCHAR(255),
    property_address TEXT,
    client_name      VARCHAR(200),
    broker_name      VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_agreement_dates CHECK (end_date > start_date)
);

ALTER TABLE agreements ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS client_name VARCHAR(200);

CREATE INDEX IF NOT EXISTS idx_agreements_broker_created
    ON agreements(broker_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agreements_broker_status
    ON agreements(broker_id, status);

CREATE INDEX IF NOT EXISTS idx_agreements_property
    ON agreements(property_id);

CREATE INDEX IF NOT EXISTS idx_agreements_client
    ON agreements(client_id) WHERE client_id IS NOT NULL;
`
	_, err = db.Exec(agreementsMigration)
	if err != nil {
		return fmt.Errorf("failed to run agreements migration: %w", err)
	}

	// Agreements triggers (separate exec to avoid dollar-quote conflicts)
	agreementsTriggers := `
CREATE OR REPLACE FUNCTION update_agreements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_agreements_updated_at ON agreements;
CREATE TRIGGER trg_agreements_updated_at
    BEFORE UPDATE ON agreements
    FOR EACH ROW EXECUTE FUNCTION update_agreements_updated_at();

CREATE OR REPLACE FUNCTION populate_agreement_denormalized()
RETURNS TRIGGER AS $$
BEGIN
    SELECT p.title, p.address || ', ' || p.city
    INTO NEW.property_title, NEW.property_address
    FROM properties p
    WHERE p.id = NEW.property_id;

    IF NEW.client_id IS NOT NULL THEN
        SELECT c.first_name || ' ' || c.last_name
        INTO NEW.client_name
        FROM clients c
        WHERE c.id = NEW.client_id;
    END IF;

    SELECT u.first_name || ' ' || u.last_name
    INTO NEW.broker_name
    FROM users u
    WHERE u.id = NEW.broker_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_agreements_populate ON agreements;
CREATE TRIGGER trg_agreements_populate
    BEFORE INSERT ON agreements
    FOR EACH ROW EXECUTE FUNCTION populate_agreement_denormalized();
`
	_, err = db.Exec(agreementsTriggers)
	if err != nil {
		return fmt.Errorf("failed to run agreements triggers migration: %w", err)
	}

	// Migration 009: Create projects table
	projectsMigration := `
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    builder_name VARCHAR(255) NOT NULL,
    project_type VARCHAR(50) NOT NULL CHECK (project_type IN ('residential','commercial','mixed')),
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    total_units INTEGER NOT NULL CHECK (total_units > 0),
    available_units INTEGER NOT NULL DEFAULT 0 CHECK (available_units >= 0),
    price_range_min DECIMAL(15,2) NOT NULL CHECK (price_range_min > 0),
    price_range_max DECIMAL(15,2) NOT NULL CHECK (price_range_max > 0),
    amenities TEXT[] DEFAULT '{}',
    launch_date DATE NOT NULL,
    possession_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'upcoming'
        CHECK (status IN ('upcoming','launched','under_construction','ready','sold_out')),
    brochure_url VARCHAR(500),
    channel_partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    partner_name VARCHAR(200),
    partner_firm VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_partner_created
    ON projects(channel_partner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_projects_status
    ON projects(status);

CREATE INDEX IF NOT EXISTS idx_projects_city_state
    ON projects(city, state);
`
	_, err = db.Exec(projectsMigration)
	if err != nil {
		return fmt.Errorf("failed to run projects migration: %w", err)
	}

	projectsTriggers := `
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;
CREATE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_projects_updated_at();

CREATE OR REPLACE FUNCTION populate_project_partner_info()
RETURNS TRIGGER AS $$
BEGIN
    SELECT u.first_name || ' ' || u.last_name, u.firm_name
    INTO NEW.partner_name, NEW.partner_firm
    FROM users u
    WHERE u.id = NEW.channel_partner_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_projects_populate ON projects;
CREATE TRIGGER trg_projects_populate
    BEFORE INSERT ON projects
    FOR EACH ROW EXECUTE FUNCTION populate_project_partner_info();
`
	_, err = db.Exec(projectsTriggers)
	if err != nil {
		return fmt.Errorf("failed to run projects triggers migration: %w", err)
	}

	// Update property status check constraint for existing databases
	propertyStatusCheckFix := `
DO $$
BEGIN
    ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_status_check;
    ALTER TABLE properties ADD CONSTRAINT properties_status_check 
        CHECK (status IN ('available', 'sold', 'rented', 'hold', 'closed', 'under_discussion', 'under_negotiation'));
END $$;
`
	_, err = db.Exec(propertyStatusCheckFix)
	if err != nil {
		return fmt.Errorf("failed to run property status check constraint migration: %w", err)
	}

	log.Println("Database migrations completed successfully")

	// Migration 013: Add bio column to users table
	bioMigration := `
-- Add bio column to users table for profile updates
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
-- Add years_experience column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS years_experience INTEGER;
-- Add deals_completed column if not exists  
ALTER TABLE users ADD COLUMN IF NOT EXISTS deals_completed INTEGER;
-- Add specializations column if not exists (as TEXT, not array)
ALTER TABLE users ADD COLUMN IF NOT EXISTS specializations TEXT;
-- Fix specializations column type if it's an array
DO $$
BEGIN
    -- Check if specializations is text[] and convert to text
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'specializations' 
        AND data_type = 'ARRAY'
    ) THEN
        -- Clean up empty arrays first
        UPDATE users SET specializations = NULL WHERE specializations = '{}';
        -- Convert column type
        ALTER TABLE users ALTER COLUMN specializations TYPE TEXT;
    END IF;
END $$;
-- Add mobile verification columns if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_verified_at TIMESTAMP WITH TIME ZONE;
-- Per-user app settings (notifications/privacy/preferences) stored as JSON
ALTER TABLE users ADD COLUMN IF NOT EXISTS settings JSONB;
-- Contact form submissions from the public landing page (visible to admins)
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name    VARCHAR(255) NOT NULL,
    email   VARCHAR(255) NOT NULL,
    phone   VARCHAR(50),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON contact_messages(created_at DESC);
-- In-app notifications (e.g. a connected broker added a property)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       VARCHAR(50) NOT NULL,
    title      VARCHAR(255) NOT NULL,
    message    TEXT NOT NULL,
    action_url VARCHAR(500),
    metadata   JSONB,
    is_read    BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;
-- Broker → Channel Partner follow relationships (one-directional)
CREATE TABLE IF NOT EXISTS partner_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel_partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_partner_follow UNIQUE (broker_id, channel_partner_id)
);
CREATE INDEX IF NOT EXISTS idx_partner_follows_partner ON partner_follows(channel_partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_follows_broker ON partner_follows(broker_id);
`
	_, err = db.Exec(bioMigration)
	if err != nil {
		return fmt.Errorf("failed to run bio migration: %w", err)
	}

	log.Println("Bio column migration completed successfully")
	return nil
}

// RunNetworkMigrations creates the broker network tables.
func (db *DB) RunNetworkMigrations() error {
	sql := `
-- Connection requests between brokers
CREATE TABLE IF NOT EXISTS connection_requests (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status      VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_connection_request UNIQUE (sender_id, receiver_id),
    CONSTRAINT chk_no_self_connect CHECK (sender_id <> receiver_id)
);
CREATE INDEX IF NOT EXISTS idx_conn_req_receiver_status ON connection_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_conn_req_sender_status   ON connection_requests(sender_id, status);
DROP TRIGGER IF EXISTS update_connection_requests_updated_at ON connection_requests;
CREATE TRIGGER update_connection_requests_updated_at
    BEFORE UPDATE ON connection_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Materialised accepted connections
CREATE TABLE IF NOT EXISTS connections (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_a   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    broker_b   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_connection UNIQUE (broker_a, broker_b),
    CONSTRAINT chk_connection_order CHECK (broker_a < broker_b)
);
CREATE INDEX IF NOT EXISTS idx_connections_broker_a ON connections(broker_a);
CREATE INDEX IF NOT EXISTS idx_connections_broker_b ON connections(broker_b);

-- Drop and recreate conversations/messages to ensure correct schema
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Conversations between connected brokers
-- Column names match repository queries: broker_a / broker_b
CREATE TABLE conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_a        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    broker_b        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_conversation UNIQUE (broker_a, broker_b),
    CONSTRAINT chk_conversation_order CHECK (broker_a < broker_b)
);
CREATE INDEX IF NOT EXISTS idx_conversations_broker_a ON conversations(broker_a);
CREATE INDEX IF NOT EXISTS idx_conversations_broker_b ON conversations(broker_b);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- Messages within conversations
-- Column name matches repository queries: body (not content)
CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body            TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = FALSE;
`

	_, err := db.Exec(sql)
	if err != nil {
		return fmt.Errorf("failed to run network migrations: %w", err)
	}

	log.Println("Network migrations completed successfully")
	return nil
}

// RunWhatsAppMigrations creates the WhatsApp marketing tables.
func (db *DB) RunWhatsAppMigrations() error {
	sql := `
-- Drop and recreate to fix any corrupt schema from previous broken migrations
DROP TABLE IF EXISTS whatsapp_message_logs CASCADE;
DROP TABLE IF EXISTS whatsapp_campaigns CASCADE;
DROP TABLE IF EXISTS whatsapp_templates CASCADE;
DROP TABLE IF EXISTS whatsapp_accounts CASCADE;

-- WhatsApp account configuration per user
CREATE TABLE IF NOT EXISTS whatsapp_accounts (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone_number      VARCHAR(20) NOT NULL,
    business_name     VARCHAR(255) NOT NULL,
    is_verified       BOOLEAN NOT NULL DEFAULT FALSE,
    verification_code VARCHAR(10),
    verification_expires_at TIMESTAMP WITH TIME ZONE,
    access_token      TEXT,
    phone_number_id   VARCHAR(100),
    business_account_id VARCHAR(100),
    app_id            VARCHAR(100),
    app_secret        TEXT,
    webhook_verify_token TEXT,
    status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'verifying', 'active', 'suspended', 'disconnected')),
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_whatsapp_user UNIQUE (user_id),
    CONSTRAINT uq_whatsapp_phone UNIQUE (phone_number)
);
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_user ON whatsapp_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_phone ON whatsapp_accounts(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_status ON whatsapp_accounts(status);
DROP TRIGGER IF EXISTS update_whatsapp_accounts_updated_at ON whatsapp_accounts;
CREATE TRIGGER update_whatsapp_accounts_updated_at
    BEFORE UPDATE ON whatsapp_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- WhatsApp message templates
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    content     TEXT NOT NULL,
    variables   TEXT[] DEFAULT '{}',
    category    VARCHAR(50) NOT NULL DEFAULT 'marketing'
                    CHECK (category IN ('marketing', 'utility', 'authentication')),
    language    VARCHAR(10) NOT NULL DEFAULT 'en',
    status      VARCHAR(20) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_user ON whatsapp_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_status ON whatsapp_templates(status);
DROP TRIGGER IF EXISTS update_whatsapp_templates_updated_at ON whatsapp_templates;
CREATE TRIGGER update_whatsapp_templates_updated_at
    BEFORE UPDATE ON whatsapp_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- WhatsApp campaigns
CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id     UUID REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
    name            VARCHAR(255) NOT NULL,
    message_content TEXT NOT NULL,
    target_audience VARCHAR(50) NOT NULL DEFAULT 'all_clients'
                        CHECK (target_audience IN ('all_clients', 'buyers', 'sellers', 'tenants', 'owners', 'custom')),
    custom_recipients TEXT[] DEFAULT '{}',
    scheduled_at    TIMESTAMP WITH TIME ZONE,
    status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
    total_recipients INTEGER DEFAULT 0,
    sent_count      INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    failed_count    INTEGER DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_user ON whatsapp_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_status ON whatsapp_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_scheduled ON whatsapp_campaigns(scheduled_at) WHERE scheduled_at IS NOT NULL;
DROP TRIGGER IF EXISTS update_whatsapp_campaigns_updated_at ON whatsapp_campaigns;
CREATE TRIGGER update_whatsapp_campaigns_updated_at
    BEFORE UPDATE ON whatsapp_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- WhatsApp message logs
CREATE TABLE IF NOT EXISTS whatsapp_message_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id   UUID REFERENCES whatsapp_campaigns(id) ON DELETE SET NULL,
    client_id     UUID REFERENCES clients(id) ON DELETE SET NULL,
    phone_number  VARCHAR(20) NOT NULL,
    message_content TEXT NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    error_message TEXT,
    whatsapp_message_id VARCHAR(255),
    sent_at       TIMESTAMP WITH TIME ZONE,
    delivered_at  TIMESTAMP WITH TIME ZONE,
    read_at       TIMESTAMP WITH TIME ZONE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_user ON whatsapp_message_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_campaign ON whatsapp_message_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_client ON whatsapp_message_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_status ON whatsapp_message_logs(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created ON whatsapp_message_logs(created_at DESC);
`

	_, err := db.Exec(sql)
	if err != nil {
		return fmt.Errorf("failed to run WhatsApp migrations: %w", err)
	}

	log.Println("WhatsApp migrations completed successfully")
	return nil
}

// RunSMSMarketingMigrations creates the SMS marketing tables.
func (db *DB) RunSMSMarketingMigrations() error {
	sql := `
-- Drop and recreate to fix any corrupt schema from previous broken migrations
DROP TABLE IF EXISTS sms_message_logs CASCADE;
DROP TABLE IF EXISTS sms_campaigns CASCADE;
DROP TABLE IF EXISTS sms_templates CASCADE;
DROP TABLE IF EXISTS sms_accounts CASCADE;

-- SMS account configuration per user (MSG91 only)
CREATE TABLE IF NOT EXISTS sms_accounts (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- MSG91 specific fields
    msg91_auth_key           VARCHAR(255),
    msg91_auth_key_encrypted TEXT,
    msg91_sender_id          VARCHAR(50),
    
    status                   VARCHAR(20) NOT NULL DEFAULT 'not_connected'
                                 CHECK (status IN ('connected', 'not_connected', 'suspended')),
    connection_error         TEXT,
    message_limit            INTEGER DEFAULT 1000,
    messages_sent_today      INTEGER DEFAULT 0,
    last_reset_date          DATE,
    connected_at             TIMESTAMP WITH TIME ZONE,
    last_used_at             TIMESTAMP WITH TIME ZONE,
    created_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_sms_user UNIQUE (user_id)
);
CREATE INDEX IF NOT EXISTS idx_sms_accounts_user ON sms_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_accounts_status ON sms_accounts(status);
CREATE INDEX IF NOT EXISTS idx_sms_accounts_msg91_sender_id ON sms_accounts(msg91_sender_id);
DROP TRIGGER IF EXISTS update_sms_accounts_updated_at ON sms_accounts;
CREATE TRIGGER update_sms_accounts_updated_at
    BEFORE UPDATE ON sms_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- SMS message templates
CREATE TABLE IF NOT EXISTS sms_templates (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    content     TEXT NOT NULL,
    variables   TEXT[] DEFAULT '{}',
    category    VARCHAR(50) NOT NULL DEFAULT 'marketing'
                    CHECK (category IN ('marketing', 'transactional', 'reminder', 'notification')),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sms_templates_user ON sms_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_templates_category ON sms_templates(category);
CREATE INDEX IF NOT EXISTS idx_sms_templates_active ON sms_templates(is_active);
DROP TRIGGER IF EXISTS update_sms_templates_updated_at ON sms_templates;
CREATE TRIGGER update_sms_templates_updated_at
    BEFORE UPDATE ON sms_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- SMS campaigns
CREATE TABLE IF NOT EXISTS sms_campaigns (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id     UUID REFERENCES sms_templates(id) ON DELETE SET NULL,
    name            VARCHAR(255) NOT NULL,
    message_content TEXT NOT NULL,
    target_audience VARCHAR(50) NOT NULL DEFAULT 'all_clients'
                        CHECK (target_audience IN ('all_clients', 'buyers', 'sellers', 'tenants', 'owners', 'custom')),
    custom_recipients TEXT[] DEFAULT '{}',
    scheduled_at    TIMESTAMP WITH TIME ZONE,
    status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
    total_recipients INTEGER DEFAULT 0,
    sent_count      INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    failed_count    INTEGER DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_user ON sms_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_status ON sms_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_scheduled ON sms_campaigns(scheduled_at) WHERE scheduled_at IS NOT NULL;
DROP TRIGGER IF EXISTS update_sms_campaigns_updated_at ON sms_campaigns;
CREATE TRIGGER update_sms_campaigns_updated_at
    BEFORE UPDATE ON sms_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- SMS message logs
CREATE TABLE IF NOT EXISTS sms_message_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id   UUID REFERENCES sms_campaigns(id) ON DELETE SET NULL,
    client_id     UUID REFERENCES clients(id) ON DELETE SET NULL,
    message_type  VARCHAR(20) NOT NULL DEFAULT 'individual'
                      CHECK (message_type IN ('individual', 'campaign', 'appointment', 'transactional')),
    phone_number  VARCHAR(20) NOT NULL,
    message_content TEXT NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'undelivered')),
    error_message TEXT,
    provider_message_id VARCHAR(255),
    cost_amount   DECIMAL(10, 4),
    cost_currency VARCHAR(3) DEFAULT 'USD',
    sent_at       TIMESTAMP WITH TIME ZONE,
    delivered_at  TIMESTAMP WITH TIME ZONE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sms_logs_user ON sms_message_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_campaign ON sms_message_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_client ON sms_message_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_message_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_message_type ON sms_message_logs(message_type);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created ON sms_message_logs(created_at DESC);

-- SMS DLT Templates (Distributed Ledger Technology - Regulatory Compliance)
CREATE TABLE IF NOT EXISTS sms_dlt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    header VARCHAR(10) NOT NULL,
    template_id VARCHAR(255) NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('Promotional', 'Service')),
    provider VARCHAR(50) NOT NULL DEFAULT 'MSG91',
    template_content TEXT NOT NULL,
    sample_content TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Registered' CHECK (status IN ('Registered', 'Approved', 'Active', 'Inactive', 'Rejected')),
    variable_count INTEGER NOT NULL DEFAULT 0,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sms_dlt_templates_user_id ON sms_dlt_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_dlt_templates_template_id ON sms_dlt_templates(template_id);
CREATE INDEX IF NOT EXISTS idx_sms_dlt_templates_status ON sms_dlt_templates(status);
CREATE INDEX IF NOT EXISTS idx_sms_dlt_templates_provider ON sms_dlt_templates(provider);
CREATE INDEX IF NOT EXISTS idx_sms_dlt_templates_updated_by ON sms_dlt_templates(updated_by);
DROP TRIGGER IF EXISTS update_sms_dlt_templates_updated_at ON sms_dlt_templates;
CREATE TRIGGER update_sms_dlt_templates_updated_at
    BEFORE UPDATE ON sms_dlt_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`

	_, err := db.Exec(sql)
	if err != nil {
		return fmt.Errorf("failed to run SMS marketing migrations: %w", err)
	}

	log.Println("SMS marketing migrations completed successfully")
	return nil
}


// RunBuildingMigrations creates the building_contacts table.
func (db *DB) RunBuildingMigrations() error {
	sql := `
CREATE TABLE IF NOT EXISTS building_contacts (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_name    VARCHAR(200),
    mobile_number VARCHAR(20) NOT NULL,
    building_name VARCHAR(255),
    area          VARCHAR(255),
    notes         TEXT,
    broker_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    broker_name   VARCHAR(200),
    broker_city   VARCHAR(100),
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_building_contact_mobile_broker UNIQUE (mobile_number, broker_id)
);

CREATE INDEX IF NOT EXISTS idx_building_contacts_broker_created
    ON building_contacts(broker_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_building_contacts_broker_area
    ON building_contacts(broker_id, area);

CREATE INDEX IF NOT EXISTS idx_building_contacts_broker_building
    ON building_contacts(broker_id, building_name);

CREATE INDEX IF NOT EXISTS idx_building_contacts_mobile
    ON building_contacts(mobile_number);

DROP TRIGGER IF EXISTS update_building_contacts_updated_at ON building_contacts;
CREATE TRIGGER update_building_contacts_updated_at
    BEFORE UPDATE ON building_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION populate_building_contact_broker_info()
RETURNS TRIGGER AS $populate_building$
BEGIN
    SELECT first_name || ' ' || last_name, city
    INTO NEW.broker_name, NEW.broker_city
    FROM users
    WHERE id = NEW.broker_id;
    RETURN NEW;
END;
$populate_building$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS populate_building_contact_broker_info_on_insert ON building_contacts;
CREATE TRIGGER populate_building_contact_broker_info_on_insert
    BEFORE INSERT ON building_contacts
    FOR EACH ROW EXECUTE FUNCTION populate_building_contact_broker_info();
`
	_, err := db.Exec(sql)
	if err != nil {
		return fmt.Errorf("failed to run building migrations: %w", err)
	}
	log.Println("Building migrations completed successfully")
	return nil
}

// RunExternalBrokerMigrations creates the external_brokers table.
// A DB trigger automatically removes the row when the broker signs up on EnforData
// (matched by whatsapp_number == mobile_number).
func (db *DB) RunExternalBrokerMigrations() error {
	sql := `
CREATE TABLE IF NOT EXISTS external_brokers (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(200)  NOT NULL,
    mobile_number VARCHAR(20)   NOT NULL,
    area          VARCHAR(255),
    location      VARCHAR(255),
    notes         TEXT,
    added_by      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    added_by_name VARCHAR(200),
    added_by_city VARCHAR(100),
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_external_broker_mobile UNIQUE (mobile_number)
);

CREATE INDEX IF NOT EXISTS idx_ext_brokers_mobile   ON external_brokers(mobile_number);
CREATE INDEX IF NOT EXISTS idx_ext_brokers_area     ON external_brokers(area);
CREATE INDEX IF NOT EXISTS idx_ext_brokers_location ON external_brokers(location);
CREATE INDEX IF NOT EXISTS idx_ext_brokers_added_by ON external_brokers(added_by, created_at DESC);

DROP TRIGGER IF EXISTS update_external_brokers_updated_at ON external_brokers;
CREATE TRIGGER update_external_brokers_updated_at
    BEFORE UPDATE ON external_brokers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Populate added_by_name / added_by_city from the inserting user
CREATE OR REPLACE FUNCTION populate_ext_broker_adder_info()
RETURNS TRIGGER AS $populate_ext$
BEGIN
    SELECT first_name || ' ' || last_name, city
    INTO NEW.added_by_name, NEW.added_by_city
    FROM users WHERE id = NEW.added_by;
    RETURN NEW;
END;
$populate_ext$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ext_broker_adder_info ON external_brokers;
CREATE TRIGGER trg_ext_broker_adder_info
    BEFORE INSERT ON external_brokers
    FOR EACH ROW EXECUTE FUNCTION populate_ext_broker_adder_info();

-- Auto-convert: when a new EnforData user is created, remove any matching external broker record
CREATE OR REPLACE FUNCTION convert_external_broker_on_signup()
RETURNS TRIGGER AS $convert_ext$
BEGIN
    DELETE FROM external_brokers WHERE mobile_number = NEW.whatsapp_number;
    RETURN NEW;
END;
$convert_ext$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_convert_external_broker ON users;
CREATE TRIGGER trg_convert_external_broker
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION convert_external_broker_on_signup();
`
	_, err := db.Exec(sql)
	if err != nil {
		return fmt.Errorf("failed to run external broker migrations: %w", err)
	}
	log.Println("External broker migrations completed successfully")
	return nil
}

// RunBusinessPostsMigrations creates the business_posts and staff_listings tables.
func (db *DB) RunBusinessPostsMigrations() error {
	sql := `
-- Business posts table
CREATE TABLE IF NOT EXISTS business_posts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    title       VARCHAR(255) NOT NULL,
    category    VARCHAR(50)  NOT NULL
                    CHECK (category IN ('furniture_office','furniture_house','vendor','staff')),
    subcategory VARCHAR(50)  NOT NULL,
    description TEXT         NOT NULL,
    price       DECIMAL(15,2),
    location    VARCHAR(255) NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','sold','closed')),

    -- Contact info
    contact_name     VARCHAR(200) NOT NULL DEFAULT '',
    contact_phone    VARCHAR(20)  NOT NULL DEFAULT '',
    contact_email    VARCHAR(255),
    contact_whatsapp VARCHAR(20),
    contact_address  TEXT,

    -- Vendor-specific
    service_area VARCHAR(500),
    rating       DECIMAL(2,1) CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),

    -- Media
    images     TEXT[]  DEFAULT '{}',
    resume_url VARCHAR(500),

    -- Denormalized
    poster_name VARCHAR(200),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_posts_user     ON business_posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_posts_category ON business_posts(category, status);
CREATE INDEX IF NOT EXISTS idx_business_posts_location ON business_posts(location);
CREATE INDEX IF NOT EXISTS idx_business_posts_status   ON business_posts(status, created_at DESC);

DROP TRIGGER IF EXISTS update_business_posts_updated_at ON business_posts;
CREATE TRIGGER update_business_posts_updated_at
    BEFORE UPDATE ON business_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION populate_business_post_poster()
RETURNS TRIGGER AS $bp_poster$
BEGIN
    SELECT first_name || ' ' || last_name
    INTO NEW.poster_name
    FROM users WHERE id = NEW.user_id;
    RETURN NEW;
END;
$bp_poster$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_business_post_poster ON business_posts;
CREATE TRIGGER trg_business_post_poster
    BEFORE INSERT ON business_posts
    FOR EACH ROW EXECUTE FUNCTION populate_business_post_poster();

-- Staff listings table
CREATE TABLE IF NOT EXISTS staff_listings (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    type             VARCHAR(20) NOT NULL CHECK (type IN ('available','required')),
    first_name       VARCHAR(100) NOT NULL,
    last_name        VARCHAR(100) NOT NULL DEFAULT '',
    phone            VARCHAR(20)  NOT NULL DEFAULT '',
    email            VARCHAR(255) NOT NULL DEFAULT '',
    role             VARCHAR(100) NOT NULL,
    experience_years INTEGER      NOT NULL DEFAULT 0 CHECK (experience_years >= 0),
    status           VARCHAR(20)  NOT NULL DEFAULT 'available'
                         CHECK (status IN ('available','employed','inactive')),
    location         VARCHAR(255) NOT NULL,
    address          TEXT         NOT NULL DEFAULT '',
    description      TEXT         NOT NULL DEFAULT '',
    resume_url       VARCHAR(500),
    photo_url        VARCHAR(500),

    -- Denormalized
    poster_name VARCHAR(200),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_user     ON staff_listings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_type     ON staff_listings(type);
CREATE INDEX IF NOT EXISTS idx_staff_location ON staff_listings(location);
CREATE INDEX IF NOT EXISTS idx_staff_role     ON staff_listings(role);

DROP TRIGGER IF EXISTS update_staff_listings_updated_at ON staff_listings;
CREATE TRIGGER update_staff_listings_updated_at
    BEFORE UPDATE ON staff_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION populate_staff_poster()
RETURNS TRIGGER AS $staff_poster$
BEGIN
    SELECT first_name || ' ' || last_name
    INTO NEW.poster_name
    FROM users WHERE id = NEW.user_id;
    RETURN NEW;
END;
$staff_poster$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_staff_poster ON staff_listings;
CREATE TRIGGER trg_staff_poster
    BEFORE INSERT ON staff_listings
    FOR EACH ROW EXECUTE FUNCTION populate_staff_poster();
`
	_, err := db.Exec(sql)
	if err != nil {
		return fmt.Errorf("failed to run business posts migrations: %w", err)
	}
	log.Println("Business posts & staff migrations completed successfully")
	return nil
}

// RunSubscriptionMigrations creates the subscription and payment tables.
func (db *DB) RunSubscriptionMigrations() error {
	migrationSQL := `
-- Subscription Plans Table (schema matches repository queries)
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Plan Identification
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Pricing
    monthly_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    annual_price  DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'INR',

    -- SMS Package (per package-calculation sheet)
    sms_credits INTEGER NOT NULL DEFAULT 0,
    sms_rate    DECIMAL(10, 4) NOT NULL DEFAULT 0,

    -- Feature Limits (NULL means unlimited)
    max_properties              INTEGER,
    max_clients                 INTEGER,
    max_appointments_per_month  INTEGER,
    max_whatsapp_messages_per_month INTEGER,
    max_sms_messages_per_month  INTEGER,
    max_broker_connections      INTEGER,
    max_business_posts_per_month INTEGER,
    max_team_members            INTEGER DEFAULT 1,

    -- Feature Flags
    has_analytics         BOOLEAN DEFAULT true,
    has_advanced_analytics BOOLEAN DEFAULT false,
    has_api_access        BOOLEAN DEFAULT false,
    has_custom_templates  BOOLEAN DEFAULT false,
    has_priority_support  BOOLEAN DEFAULT false,

    -- Display Settings
    is_active  BOOLEAN DEFAULT true,
    is_visible BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,

    -- Which user role this plan is offered to ('broker' or 'channel_partner')
    target_role VARCHAR(20) NOT NULL DEFAULT 'broker',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_name ON subscription_plans(name);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active, is_visible);
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User Subscriptions Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),

    status VARCHAR(50) NOT NULL DEFAULT 'active'
        CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'expired', 'suspended')),
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly'
        CHECK (billing_cycle IN ('monthly', 'annual', 'trial')),

    is_trial BOOLEAN DEFAULT false,
    trial_starts_at TIMESTAMP WITH TIME ZONE,
    trial_ends_at   TIMESTAMP WITH TIME ZONE,

    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end   TIMESTAMP WITH TIME ZONE NOT NULL,

    cancel_at_period_end  BOOLEAN DEFAULT false,
    cancelled_at          TIMESTAMP WITH TIME ZONE,
    cancellation_reason   TEXT,

    razorpay_subscription_id VARCHAR(255) UNIQUE,
    razorpay_plan_id         VARCHAR(255),
    razorpay_customer_id     VARCHAR(255),

    current_properties_count       INTEGER DEFAULT 0,
    current_clients_count          INTEGER DEFAULT 0,
    current_appointments_count     INTEGER DEFAULT 0,
    current_whatsapp_messages_count INTEGER DEFAULT 0,
    current_sms_messages_count     INTEGER DEFAULT 0,
    current_business_posts_count   INTEGER DEFAULT 0,
    usage_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    metadata JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_active_subscription
    ON user_subscriptions(user_id)
    WHERE status IN ('trial', 'active');
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period_end ON user_subscriptions(current_period_end);
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),

    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(50) NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL,
    payment_method VARCHAR(50),

    razorpay_payment_id VARCHAR(255) UNIQUE,
    razorpay_order_id   VARCHAR(255),
    razorpay_signature  VARCHAR(500),

    description    TEXT,
    invoice_number VARCHAR(100) UNIQUE,
    receipt_url    TEXT,
    failure_reason TEXT,
    failure_code   VARCHAR(100),

    paid_at     TIMESTAMP WITH TIME ZONE,
    failed_at   TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order ON payments(razorpay_order_id);

-- Subscription Events Table
CREATE TABLE IF NOT EXISTS subscription_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    notification_sent BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscription_events_user ON subscription_events(user_id, created_at DESC);
`

	_, err := db.Exec(migrationSQL)
	if err != nil {
		return fmt.Errorf("failed to run subscription migrations: %w", err)
	}

	// Idempotent schema upgrades for existing databases (tables are no longer
	// dropped on startup, so add any newer columns here if they are missing).
	alterSQL := `
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS sms_credits INTEGER NOT NULL DEFAULT 0;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS sms_rate DECIMAL(10, 4) NOT NULL DEFAULT 0;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS target_role VARCHAR(20) NOT NULL DEFAULT 'broker';
-- SMS top-up support
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS sms_topup_credits INTEGER NOT NULL DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) NOT NULL DEFAULT 'subscription';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS sms_count INTEGER;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS description TEXT;
`
	if _, err := db.Exec(alterSQL); err != nil {
		return fmt.Errorf("failed to apply subscription schema upgrades: %w", err)
	}

	// Seed default subscription plans
	// Seeded from the package-calculation sheet. All paid plans are annual-only,
	// and annual_price is the GST-inclusive total charged via Razorpay.
	// max_sms_messages_per_month mirrors sms_credits so feature gating stays consistent.
	plansSql := `
INSERT INTO subscription_plans (
    name, display_name, description,
    monthly_price, annual_price,
    sms_credits, sms_rate,
    max_properties, max_clients, max_appointments_per_month,
    max_whatsapp_messages_per_month, max_sms_messages_per_month,
    max_broker_connections, max_business_posts_per_month, max_team_members,
    has_analytics, has_advanced_analytics, has_api_access, has_custom_templates, has_priority_support,
    is_active, is_visible, is_popular, sort_order, target_role
) VALUES
    -- ── Broker Plans ──────────────────────────────────────────────
    ('basic', 'Basic Plan', 'Annual subscription with 5,555 SMS credits',
     0.00, 6869.96, 5555, 0.40, NULL, NULL, NULL, NULL, 5555, NULL, NULL, 1,
     true, false, false, false, false, true, true, false, 1, 'broker'),
    ('standard', 'Standard Plan', 'Annual subscription with 11,111 SMS credits',
     0.00, 8836.84, 11111, 0.35, NULL, NULL, NULL, NULL, 11111, NULL, NULL, 1,
     true, false, false, true, false, true, true, false, 2, 'broker'),
    ('premium', 'Premium Plan', 'Annual subscription with 15,555 SMS credits',
     0.00, 9754.47, 15555, 0.30, NULL, NULL, NULL, NULL, 15555, NULL, NULL, 3,
     true, true, false, true, false, true, true, true, 3, 'broker'),
    ('enterprise', 'Enterprise Plan', 'Annual subscription with 25,555 SMS credits',
     0.00, 12389.82, 25555, 0.27, NULL, NULL, NULL, NULL, 25555, NULL, NULL, 5,
     true, true, true, true, true, true, true, false, 4, 'broker'),

    -- ── Channel Partner Plans ─────────────────────────────────────
    ('partner', 'Partner Plan', 'Annual channel partner subscription with 11,111 SMS credits',
     0.00, 8836.84, 11111, 0.35, NULL, NULL, NULL, NULL, 11111, NULL, NULL, 3,
     true, false, false, true, false, true, true, false, 5, 'channel_partner'),
    ('partner_pro', 'Partner Pro Plan', 'Annual channel partner subscription with 33,333 SMS credits',
     0.00, 14081.24, 33333, 0.25, NULL, NULL, NULL, NULL, 33333, NULL, NULL, 10,
     true, true, true, true, true, true, true, false, 6, 'channel_partner')
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    monthly_price = EXCLUDED.monthly_price,
    annual_price = EXCLUDED.annual_price,
    sms_credits = EXCLUDED.sms_credits,
    sms_rate = EXCLUDED.sms_rate,
    max_sms_messages_per_month = EXCLUDED.max_sms_messages_per_month,
    is_popular = EXCLUDED.is_popular,
    sort_order = EXCLUDED.sort_order,
    target_role = EXCLUDED.target_role,
    updated_at = NOW();
`

	_, err = db.Exec(plansSql)
	if err != nil {
		return fmt.Errorf("failed to insert default subscription plans: %w", err)
	}

	log.Println("Subscription migrations completed successfully")
	return nil
}
