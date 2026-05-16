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

	log.Println("Database migrations completed successfully")
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

-- Conversations between connected brokers
CREATE TABLE IF NOT EXISTS conversations (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_a UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_b UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_conversation UNIQUE (participant_a, participant_b),
    CONSTRAINT chk_conversation_order CHECK (participant_a < participant_b)
);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_a ON conversations(participant_a);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_b ON conversations(participant_b);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- Messages within conversations
CREATE TABLE IF NOT EXISTS messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    message_type    VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
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
-- SMS account configuration per user
CREATE TABLE IF NOT EXISTS sms_accounts (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider          VARCHAR(50) NOT NULL DEFAULT 'twilio'
                          CHECK (provider IN ('twilio', 'aws_sns', 'custom')),
    account_sid       VARCHAR(255),
    auth_token        TEXT,
    from_number       VARCHAR(20),
    api_key           TEXT,
    api_secret        TEXT,
    region            VARCHAR(50),
    status            VARCHAR(20) NOT NULL DEFAULT 'inactive'
                          CHECK (status IN ('active', 'inactive', 'suspended')),
    monthly_limit     INTEGER DEFAULT 1000,
    used_this_month   INTEGER DEFAULT 0,
    reset_date        DATE DEFAULT (CURRENT_DATE + INTERVAL '1 month'),
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_sms_user UNIQUE (user_id)
);
CREATE INDEX IF NOT EXISTS idx_sms_accounts_user ON sms_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_accounts_status ON sms_accounts(status);
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
CREATE INDEX IF NOT EXISTS idx_sms_logs_created ON sms_message_logs(created_at DESC);
`

	_, err := db.Exec(sql)
	if err != nil {
		return fmt.Errorf("failed to run SMS marketing migrations: %w", err)
	}

	log.Println("SMS marketing migrations completed successfully")
	return nil
}

// RunSubscriptionMigrations creates the subscription and payment tables.
func (db *DB) RunSubscriptionMigrations() error {
	sql := `
-- Subscription plans (predefined plans)
CREATE TABLE IF NOT EXISTS subscription_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(50) UNIQUE NOT NULL,
    description     TEXT,
    price_monthly   DECIMAL(10, 2) NOT NULL,
    price_yearly    DECIMAL(10, 2),
    features        JSONB NOT NULL DEFAULT '{}',
    limits          JSONB NOT NULL DEFAULT '{}',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_slug ON subscription_plans(slug);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id           UUID NOT NULL REFERENCES subscription_plans(id),
    status            VARCHAR(20) NOT NULL DEFAULT 'active'
                          CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'expired')),
    billing_cycle     VARCHAR(10) NOT NULL DEFAULT 'monthly'
                          CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end   TIMESTAMP WITH TIME ZONE NOT NULL,
    trial_start       TIMESTAMP WITH TIME ZONE,
    trial_end         TIMESTAMP WITH TIME ZONE,
    cancelled_at      TIMESTAMP WITH TIME ZONE,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_user_subscription UNIQUE (user_id)
);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period_end ON user_subscriptions(current_period_end);
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Feature usage tracking
CREATE TABLE IF NOT EXISTS feature_usage (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature_name    VARCHAR(100) NOT NULL,
    usage_count     INTEGER NOT NULL DEFAULT 0,
    period_start    TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_user_feature_period UNIQUE (user_id, feature_name, period_start)
);
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_feature ON feature_usage(user_id, feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_usage_period ON feature_usage(period_start, period_end);
DROP TRIGGER IF EXISTS update_feature_usage_updated_at ON feature_usage;
CREATE TRIGGER update_feature_usage_updated_at
    BEFORE UPDATE ON feature_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`

	_, err := db.Exec(sql)
	if err != nil {
		return fmt.Errorf("failed to run subscription migrations: %w", err)
	}

	// Insert default subscription plans
	plansSql := `
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, features, limits, sort_order)
VALUES 
    ('Free Trial', 'free-trial', 'Perfect for getting started', 0.00, 0.00, 
     '{"properties": true, "clients": true, "appointments": true, "whatsapp": true, "sms": true}',
     '{"properties": 10, "clients": 50, "whatsapp_messages": 100, "sms_messages": 50, "appointments": 20}', 1),
    
    ('Basic', 'basic', 'Essential features for small brokers', 999.00, 9990.00,
     '{"properties": true, "clients": true, "appointments": true, "whatsapp": true, "sms": true, "network": true}',
     '{"properties": 100, "clients": 500, "whatsapp_messages": 1000, "sms_messages": 500, "appointments": 100}', 2),
    
    ('Professional', 'professional', 'Advanced features for growing businesses', 1999.00, 19990.00,
     '{"properties": true, "clients": true, "appointments": true, "whatsapp": true, "sms": true, "network": true, "analytics": true, "bulk_operations": true}',
     '{"properties": 500, "clients": 2000, "whatsapp_messages": 5000, "sms_messages": 2500, "appointments": 500}', 3),
    
    ('Enterprise', 'enterprise', 'Complete solution for large teams', 4999.00, 49990.00,
     '{"properties": true, "clients": true, "appointments": true, "whatsapp": true, "sms": true, "network": true, "analytics": true, "bulk_operations": true, "api_access": true, "priority_support": true}',
     '{"properties": -1, "clients": -1, "whatsapp_messages": 25000, "sms_messages": 12500, "appointments": -1}', 4)
ON CONFLICT (slug) DO NOTHING;
`

	_, err = db.Exec(plansSql)
	if err != nil {
		return fmt.Errorf("failed to insert default subscription plans: %w", err)
	}

	log.Println("Subscription migrations completed successfully")
	return nil
}oker_a < broker_b)
);
CREATE INDEX IF NOT EXISTS idx_connections_broker_a ON connections(broker_a);
CREATE INDEX IF NOT EXISTS idx_connections_broker_b ON connections(broker_b);

-- One conversation per connected pair
CREATE TABLE IF NOT EXISTS conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_a        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    broker_b        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_conversation UNIQUE (broker_a, broker_b),
    CONSTRAINT chk_conversation_order CHECK (broker_a < broker_b)
);
CREATE INDEX IF NOT EXISTS idx_conversations_broker_a ON conversations(broker_a, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_broker_b ON conversations(broker_b, last_message_at DESC);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body            TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conv_unread  ON messages(conversation_id, is_read) WHERE is_read = FALSE;
`
	if _, err := db.Exec(sql); err != nil {
		return fmt.Errorf("failed to run network migrations: %w", err)
	}
	
	// Add broker stats fields to users table
	brokerStatsMigration := `
-- Add experience and deals fields to users table for broker statistics
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS deals_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS specializations TEXT[] DEFAULT '{}';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_years_experience ON users(years_experience);
CREATE INDEX IF NOT EXISTS idx_users_deals_completed ON users(deals_completed);
`
	if _, err := db.Exec(brokerStatsMigration); err != nil {
		return fmt.Errorf("failed to run broker stats migration: %w", err)
	}
	
	log.Println("Network migrations completed successfully")
	return nil
}

// RunWhatsAppMigrations creates the WhatsApp marketing module tables.
func (db *DB) RunWhatsAppMigrations() error {
	sql := `
-- ============================================================
-- WHATSAPP MARKETING MODULE
-- ============================================================

-- 1. WhatsApp Accounts (Connection Status)
CREATE TABLE IF NOT EXISTS whatsapp_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Meta Business Account Details
    business_account_id VARCHAR(255),
    phone_number_id VARCHAR(255),
    phone_number VARCHAR(20) NOT NULL,
    display_name VARCHAR(255),
    
    -- Security
    access_token_encrypted TEXT,
    webhook_verify_token VARCHAR(255),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'not_connected' 
        CHECK (status IN ('not_connected', 'pending_verification', 'connected', 'failed', 'reconnect_required')),
    connection_error TEXT,
    
    -- Limits
    message_limit INTEGER DEFAULT 1000,
    messages_sent_today INTEGER DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    
    -- Timestamps
    connected_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT uq_user_whatsapp UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_user ON whatsapp_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_status ON whatsapp_accounts(status);

-- 2. Message Templates
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('marketing', 'appointment', 'acknowledgment', 'general')),
    template_text TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    
    -- Usage stats
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_user ON message_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON message_templates(category);

-- 3. Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    whatsapp_account_id UUID REFERENCES whatsapp_accounts(id) ON DELETE SET NULL,
    
    name VARCHAR(255) NOT NULL,
    message_text TEXT NOT NULL,
    
    -- Recipients
    total_recipients INTEGER NOT NULL DEFAULT 0,
    successful_sends INTEGER DEFAULT 0,
    failed_sends INTEGER DEFAULT 0,
    pending_sends INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'queued', 'sending', 'completed', 'failed', 'cancelled')),
    
    -- Scheduling
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_user ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created ON campaigns(created_at DESC);

-- 4. Campaign Recipients (Message Tracking)
CREATE TABLE IF NOT EXISTS campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Recipient details (denormalized for history)
    recipient_name VARCHAR(255),
    recipient_phone VARCHAR(20) NOT NULL,
    
    -- Sending status
    send_status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (send_status IN ('pending', 'queued', 'sent', 'delivered', 'read', 'failed')),
    
    -- Provider details
    provider_message_id VARCHAR(255),
    error_message TEXT,
    
    -- Timestamps
    queued_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_client ON campaign_recipients(client_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON campaign_recipients(send_status);

-- 5. Message Logs (Audit Trail)
CREATE TABLE IF NOT EXISTS message_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('individual', 'bulk', 'campaign')),
    message_text TEXT NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    
    status VARCHAR(50) NOT NULL,
    provider_message_id VARCHAR(255),
    error_message TEXT,
    
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_logs_user ON message_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_campaign ON message_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_sent ON message_logs(sent_at DESC);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_whatsapp_accounts_updated_at ON whatsapp_accounts;
CREATE TRIGGER update_whatsapp_accounts_updated_at
    BEFORE UPDATE ON whatsapp_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_message_templates_updated_at ON message_templates;
CREATE TRIGGER update_message_templates_updated_at
    BEFORE UPDATE ON message_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaign_recipients_updated_at ON campaign_recipients;
CREATE TRIGGER update_campaign_recipients_updated_at
    BEFORE UPDATE ON campaign_recipients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`
	if _, err := db.Exec(sql); err != nil {
		return fmt.Errorf("failed to run WhatsApp migrations: %w", err)
	}
	
	log.Println("WhatsApp migrations completed successfully")
	return nil
}

// RunSMSMarketingMigrations creates the SMS marketing module tables.
func (db *DB) RunSMSMarketingMigrations() error {
	sql := `
-- ============================================================
-- SMS MARKETING MODULE
-- ============================================================

-- SMS Accounts Table (stores Twilio credentials per user)
CREATE TABLE IF NOT EXISTS sms_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Twilio Configuration
    twilio_account_sid VARCHAR(255),
    twilio_auth_token_encrypted TEXT, -- Encrypted
    twilio_phone_number VARCHAR(20) NOT NULL,
    
    -- Account Status
    status VARCHAR(50) DEFAULT 'not_connected' CHECK (status IN ('connected', 'not_connected', 'suspended')),
    connection_error TEXT,
    
    -- Usage Limits
    message_limit INTEGER DEFAULT 1000,
    messages_sent_today INTEGER DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    
    -- Timestamps
    connected_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- SMS Campaigns Table
CREATE TABLE IF NOT EXISTS sms_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sms_account_id UUID REFERENCES sms_accounts(id) ON DELETE SET NULL,
    
    name VARCHAR(255) NOT NULL,
    message_text TEXT NOT NULL,
    
    -- Campaign Stats
    total_recipients INTEGER DEFAULT 0,
    successful_sends INTEGER DEFAULT 0,
    failed_sends INTEGER DEFAULT 0,
    pending_sends INTEGER DEFAULT 0,
    
    -- Campaign Status
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'failed', 'cancelled')),
    
    -- Scheduling
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS Campaign Recipients Table
CREATE TABLE IF NOT EXISTS sms_campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES sms_campaigns(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    recipient_name VARCHAR(255),
    recipient_phone VARCHAR(20) NOT NULL,
    
    -- Send Status
    send_status VARCHAR(50) DEFAULT 'pending' CHECK (send_status IN ('pending', 'sent', 'delivered', 'failed')),
    provider_message_id VARCHAR(255), -- Twilio Message SID
    error_message TEXT,
    
    -- Timestamps
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS Message Templates Table
CREATE TABLE IF NOT EXISTS sms_message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    template_text TEXT NOT NULL,
    variables TEXT[], -- Array of variable names like {name}, {property}
    
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS Message Logs Table (audit trail)
CREATE TABLE IF NOT EXISTS sms_message_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES sms_campaigns(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('individual', 'campaign', 'appointment')),
    message_text TEXT NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    
    status VARCHAR(50) NOT NULL CHECK (status IN ('sent', 'delivered', 'failed')),
    provider_message_id VARCHAR(255), -- Twilio Message SID
    error_message TEXT,
    
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sms_accounts_user_id ON sms_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_accounts_status ON sms_accounts(status);

CREATE INDEX IF NOT EXISTS idx_sms_campaigns_user_id ON sms_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_status ON sms_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_created_at ON sms_campaigns(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sms_campaign_recipients_campaign_id ON sms_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sms_campaign_recipients_status ON sms_campaign_recipients(send_status);

CREATE INDEX IF NOT EXISTS idx_sms_templates_user_id ON sms_message_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_templates_category ON sms_message_templates(category);

CREATE INDEX IF NOT EXISTS idx_sms_logs_user_id ON sms_message_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_sent_at ON sms_message_logs(sent_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sms_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_sms_accounts_updated_at ON sms_accounts;
CREATE TRIGGER update_sms_accounts_updated_at 
    BEFORE UPDATE ON sms_accounts 
    FOR EACH ROW EXECUTE FUNCTION update_sms_updated_at_column();

DROP TRIGGER IF EXISTS update_sms_campaigns_updated_at ON sms_campaigns;
CREATE TRIGGER update_sms_campaigns_updated_at 
    BEFORE UPDATE ON sms_campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_sms_updated_at_column();

DROP TRIGGER IF EXISTS update_sms_campaign_recipients_updated_at ON sms_campaign_recipients;
CREATE TRIGGER update_sms_campaign_recipients_updated_at 
    BEFORE UPDATE ON sms_campaign_recipients 
    FOR EACH ROW EXECUTE FUNCTION update_sms_updated_at_column();

DROP TRIGGER IF EXISTS update_sms_templates_updated_at ON sms_message_templates;
CREATE TRIGGER update_sms_templates_updated_at 
    BEFORE UPDATE ON sms_message_templates 
    FOR EACH ROW EXECUTE FUNCTION update_sms_updated_at_column();
`
	if _, err := db.Exec(sql); err != nil {
		return fmt.Errorf("failed to run SMS marketing migrations: %w", err)
	}
	
	log.Println("SMS Marketing migrations completed successfully")
	return nil
}

// RunSubscriptionMigrations creates the subscription management tables.
func (db *DB) RunSubscriptionMigrations() error {
	sql := `
-- ============================================================
-- SUBSCRIPTION MANAGEMENT SYSTEM
-- ============================================================

-- 1. Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Plan Identification
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Pricing
    monthly_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    annual_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Feature Limits
    max_properties INTEGER,
    max_clients INTEGER,
    max_appointments_per_month INTEGER,
    max_whatsapp_messages_per_month INTEGER,
    max_sms_messages_per_month INTEGER,
    max_broker_connections INTEGER,
    max_business_posts_per_month INTEGER,
    max_team_members INTEGER DEFAULT 1,
    
    -- Feature Flags
    has_analytics BOOLEAN DEFAULT true,
    has_advanced_analytics BOOLEAN DEFAULT false,
    has_api_access BOOLEAN DEFAULT false,
    has_custom_templates BOOLEAN DEFAULT false,
    has_priority_support BOOLEAN DEFAULT false,
    
    -- Display Settings
    is_active BOOLEAN DEFAULT true,
    is_visible BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Subscriptions Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    billing_cycle VARCHAR(20) NOT NULL,
    
    is_trial BOOLEAN DEFAULT false,
    trial_starts_at TIMESTAMP WITH TIME ZONE,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    
    razorpay_subscription_id VARCHAR(255) UNIQUE,
    razorpay_plan_id VARCHAR(255),
    razorpay_customer_id VARCHAR(255),
    
    current_properties_count INTEGER DEFAULT 0,
    current_clients_count INTEGER DEFAULT 0,
    current_appointments_count INTEGER DEFAULT 0,
    current_whatsapp_messages_count INTEGER DEFAULT 0,
    current_sms_messages_count INTEGER DEFAULT 0,
    current_business_posts_count INTEGER DEFAULT 0,
    usage_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_active_subscription 
    ON user_subscriptions(user_id) 
    WHERE status IN ('trial', 'active');

-- 3. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(50) NOT NULL,
    payment_method VARCHAR(50),
    
    razorpay_payment_id VARCHAR(255) UNIQUE,
    razorpay_order_id VARCHAR(255),
    razorpay_signature VARCHAR(500),
    
    description TEXT,
    invoice_number VARCHAR(100) UNIQUE,
    receipt_url TEXT,
    
    failure_reason TEXT,
    failure_code VARCHAR(100),
    
    paid_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. OTP Verifications Table
CREATE TABLE IF NOT EXISTS otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mobile_number VARCHAR(20) NOT NULL,
    
    otp_code VARCHAR(6) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    
    is_verified BOOLEAN DEFAULT false,
    attempts_count INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Subscription Events Table
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

-- 6. Feature Usage Logs Table
CREATE TABLE IF NOT EXISTS feature_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    
    feature_name VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource_id UUID,
    
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_name ON subscription_plans(name);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_mobile_purpose ON otp_verifications(mobile_number, purpose, is_verified);
CREATE INDEX IF NOT EXISTS idx_subscription_events_user ON subscription_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_feature ON feature_usage_logs(user_id, feature_name, created_at DESC);

-- Triggers
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_otp_verifications_updated_at ON otp_verifications;
CREATE TRIGGER update_otp_verifications_updated_at
    BEFORE UPDATE ON otp_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Seed Data - Default Subscription Plans
INSERT INTO subscription_plans (
    name, display_name, description,
    monthly_price, annual_price,
    max_properties, max_clients, max_appointments_per_month,
    max_whatsapp_messages_per_month, max_sms_messages_per_month,
    max_broker_connections, max_business_posts_per_month, max_team_members,
    has_analytics, has_advanced_analytics, has_api_access, has_custom_templates, has_priority_support,
    is_active, is_visible, is_popular, sort_order
) VALUES
('free_trial', 'Free Trial', '15-day free trial with limited features',
    0.00, 0.00, 5, 10, 5, 50, 50, 0, 0, 1,
    true, false, false, false, false, true, false, false, 0),
('starter', 'Starter Plan', 'Perfect for individual brokers getting started',
    999.00, 9999.00, 50, 100, NULL, 500, 500, 20, 5, 1,
    true, false, false, false, false, true, true, false, 1),
('professional', 'Professional Plan', 'For growing teams and serious brokers',
    2499.00, 24999.00, NULL, NULL, NULL, 2000, 2000, NULL, NULL, 3,
    true, true, true, true, true, true, true, true, 2),
('enterprise', 'Enterprise Plan', 'Custom solution for large organizations',
    0.00, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    true, true, true, true, true, true, true, false, 3)
ON CONFLICT (name) DO NOTHING;

-- Modify Users Table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS mobile_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mobile_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_otp_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS otp_attempts_count INTEGER DEFAULT 0;

-- Add unique constraint only if it doesn't exist and there are no duplicates
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_whatsapp_number'
    ) THEN
        -- Check for duplicates
        IF NOT EXISTS (
            SELECT whatsapp_number 
            FROM users 
            WHERE whatsapp_number IS NOT NULL
            GROUP BY whatsapp_number 
            HAVING COUNT(*) > 1
        ) THEN
            ALTER TABLE users ADD CONSTRAINT unique_whatsapp_number UNIQUE(whatsapp_number);
        ELSE
            -- Log warning but don't fail
            RAISE NOTICE 'Duplicate whatsapp_number values found. Skipping unique constraint.';
        END IF;
    END IF;
END $$;
`
	if _, err := db.Exec(sql); err != nil {
		return fmt.Errorf("failed to run subscription migrations: %w", err)
	}

	// Fix payments table - add missing columns
	fixSQL := `
-- Fix payments table to add missing columns
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES subscription_plans(id),
ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20);

-- Update existing payments to have a default billing cycle if any exist
UPDATE payments 
SET billing_cycle = 'monthly' 
WHERE billing_cycle IS NULL;

-- Make billing_cycle NOT NULL after setting defaults (only if column exists and has no nulls)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'billing_cycle') THEN
        -- Only set NOT NULL if there are no NULL values
        IF NOT EXISTS (SELECT 1 FROM payments WHERE billing_cycle IS NULL) THEN
            ALTER TABLE payments ALTER COLUMN billing_cycle SET NOT NULL;
        END IF;
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_plan ON payments(plan_id);
CREATE INDEX IF NOT EXISTS idx_payments_billing_cycle ON payments(billing_cycle);
`
	if _, err := db.Exec(fixSQL); err != nil {
		log.Printf("Warning: Failed to fix payments table (may already be fixed): %v", err)
		// Don't return error here as this is a fix, not a critical migration
	}
	
	log.Println("Subscription migrations completed successfully")
	return nil
}
=======
}
>>>>>>> fa908ec290d8ebe2e49f2de73483095060fd0fb6
er_b)
);
CREATE INDEX IF NOT EXISTS idx_connections_broker_a ON connections(broker_a);
CREATE INDEX IF NOT EXISTS idx_connections_broker_b ON connections(broker_b);

-- Conversations between connected brokers
CREATE TABLE IF NOT EXISTS conversations (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_a UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_b UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_conversation UNIQUE (participant_a, participant_b),
    CONSTRAINT chk_conversation_order CHECK (participant_a < participant_b)
);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_a ON conversations(participant_a);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_b ON conversations(participant_b);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- Messages within conversations
CREATE TABLE IF NOT EXISTS messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    message_type    VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
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
-- SMS account configuration per user
CREATE TABLE IF NOT EXISTS sms_accounts (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider          VARCHAR(50) NOT NULL DEFAULT 'twilio'
                          CHECK (provider IN ('twilio', 'aws_sns', 'custom')),
    account_sid       VARCHAR(255),
    auth_token        TEXT,
    from_number       VARCHAR(20),
    api_key           TEXT,
    api_secret        TEXT,
    region            VARCHAR(50),
    status            VARCHAR(20) NOT NULL DEFAULT 'inactive'
                          CHECK (status IN ('active', 'inactive', 'suspended')),
    monthly_limit     INTEGER DEFAULT 1000,
    used_this_month   INTEGER DEFAULT 0,
    reset_date        DATE DEFAULT (CURRENT_DATE + INTERVAL '1 month'),
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_sms_user UNIQUE (user_id)
);
CREATE INDEX IF NOT EXISTS idx_sms_accounts_user ON sms_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_accounts_status ON sms_accounts(status);
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
CREATE INDEX IF NOT EXISTS idx_sms_logs_created ON sms_message_logs(created_at DESC);
`

	_, err := db.Exec(sql)
	if err != nil {
		return fmt.Errorf("failed to run SMS marketing migrations: %w", err)
	}

	log.Println("SMS marketing migrations completed successfully")
	return nil
}

// RunSubscriptionMigrations creates the subscription and payment tables.
func (db *DB) RunSubscriptionMigrations() error {
	sql := `
-- Subscription plans (predefined plans)
CREATE TABLE IF NOT EXISTS subscription_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(50) UNIQUE NOT NULL,
    description     TEXT,
    price_monthly   DECIMAL(10, 2) NOT NULL,
    price_yearly    DECIMAL(10, 2),
    features        JSONB NOT NULL DEFAULT '{}',
    limits          JSONB NOT NULL DEFAULT '{}',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_slug ON subscription_plans(slug);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id           UUID NOT NULL REFERENCES subscription_plans(id),
    status            VARCHAR(20) NOT NULL DEFAULT 'active'
                          CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'expired')),
    billing_cycle     VARCHAR(10) NOT NULL DEFAULT 'monthly'
                          CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end   TIMESTAMP WITH TIME ZONE NOT NULL,
    trial_start       TIMESTAMP WITH TIME ZONE,
    trial_end         TIMESTAMP WITH TIME ZONE,
    cancelled_at      TIMESTAMP WITH TIME ZONE,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_user_subscription UNIQUE (user_id)
);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period_end ON user_subscriptions(current_period_end);
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Feature usage tracking
CREATE TABLE IF NOT EXISTS feature_usage (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature_name    VARCHAR(100) NOT NULL,
    usage_count     INTEGER NOT NULL DEFAULT 0,
    period_start    TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_user_feature_period UNIQUE (user_id, feature_name, period_start)
);
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_feature ON feature_usage(user_id, feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_usage_period ON feature_usage(period_start, period_end);
DROP TRIGGER IF EXISTS update_feature_usage_updated_at ON feature_usage;
CREATE TRIGGER update_feature_usage_updated_at
    BEFORE UPDATE ON feature_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Payment records
CREATE TABLE IF NOT EXISTS payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id     UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    plan_id             UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
    amount              DECIMAL(10, 2) NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'INR',
    status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    payment_method      VARCHAR(50) NOT NULL DEFAULT 'razorpay'
                            CHECK (payment_method IN ('razorpay', 'stripe', 'paypal', 'bank_transfer')),
    
    -- Razorpay specific fields
    razorpay_order_id   VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    razorpay_signature  VARCHAR(255),
    
    -- Generic payment gateway fields
    gateway_order_id    VARCHAR(100),
    gateway_payment_id  VARCHAR(100),
    gateway_response    JSONB,
    
    -- Billing information
    billing_cycle       VARCHAR(10) CHECK (billing_cycle IN ('monthly', 'yearly')),
    billing_period_start TIMESTAMP WITH TIME ZONE,
    billing_period_end   TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    description         TEXT,
    failure_reason      TEXT,
    refund_amount       DECIMAL(10, 2),
    refund_reason       TEXT,
    refunded_at         TIMESTAMP WITH TIME ZONE,
    
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment ON payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`

	_, err := db.Exec(sql)
	if err != nil {
		return fmt.Errorf("failed to run subscription migrations: %w", err)
	}

	// Insert default subscription plans
	plansSql := `
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, features, limits, sort_order)
VALUES 
    ('Free Trial', 'free-trial', 'Perfect for getting started', 0.00, 0.00, 
     '{"properties": true, "clients": true, "appointments": true, "whatsapp": true, "sms": true}',
     '{"properties": 10, "clients": 50, "whatsapp_messages": 100, "sms_messages": 50, "appointments": 20}', 1),
    
    ('Basic', 'basic', 'Essential features for small brokers', 999.00, 9990.00,
     '{"properties": true, "clients": true, "appointments": true, "whatsapp": true, "sms": true, "network": true}',
     '{"properties": 100, "clients": 500, "whatsapp_messages": 1000, "sms_messages": 500, "appointments": 100}', 2),
    
    ('Professional', 'professional', 'Advanced features for growing businesses', 1999.00, 19990.00,
     '{"properties": true, "clients": true, "appointments": true, "whatsapp": true, "sms": true, "network": true, "analytics": true, "bulk_operations": true}',
     '{"properties": 500, "clients": 2000, "whatsapp_messages": 5000, "sms_messages": 2500, "appointments": 500}', 3),
    
    ('Enterprise', 'enterprise', 'Complete solution for large teams', 4999.00, 49990.00,
     '{"properties": true, "clients": true, "appointments": true, "whatsapp": true, "sms": true, "network": true, "analytics": true, "bulk_operations": true, "api_access": true, "priority_support": true}',
     '{"properties": -1, "clients": -1, "whatsapp_messages": 25000, "sms_messages": 12500, "appointments": -1}', 4)
ON CONFLICT (slug) DO NOTHING;
`

	_, err = db.Exec(plansSql)
	if err != nil {
		return fmt.Errorf("failed to insert default subscription plans: %w", err)
	}

	log.Println("Subscription migrations completed successfully")
	return nil
}