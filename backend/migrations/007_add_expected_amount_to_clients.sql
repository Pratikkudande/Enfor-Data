-- Add expected_amount column to clients table for seller and list_property_for_rent clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS expected_amount DECIMAL(15, 2);

-- Add comment to explain the column usage
COMMENT ON COLUMN clients.expected_amount IS 'Expected selling/renting price for seller and list_property_for_rent client types';
