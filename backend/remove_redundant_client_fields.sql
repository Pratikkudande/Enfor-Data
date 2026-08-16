-- Migration: Remove redundant fields from clients table
-- These fields should be tracked in client_requirements table instead

-- Remove redundant fields
ALTER TABLE clients
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS requirements,
DROP COLUMN IF EXISTS notes,
DROP COLUMN IF EXISTS broker_name,
DROP COLUMN IF EXISTS broker_city,
DROP COLUMN IF EXISTS expected_amount,
DROP COLUMN IF EXISTS min_price,
DROP COLUMN IF EXISTS max_price,
DROP COLUMN IF EXISTS property_address,
DROP COLUMN IF EXISTS buildup_area,
DROP COLUMN IF EXISTS carpet_area,
DROP COLUMN IF EXISTS measurement_unit,
DROP COLUMN IF EXISTS deposit_budget;

-- Keep only essential client fields:
-- id, broker_id, first_name, last_name, email, phone, type, status,
-- preferred_location, city, state, postal_code, budget_min, budget_max,
-- created_at, updated_at

-- Note: budget_min and budget_max are kept as they are commonly used for quick filtering
