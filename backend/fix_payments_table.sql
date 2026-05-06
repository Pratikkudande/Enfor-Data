-- Fix payments table to add missing columns
-- Run this script to update the existing payments table

-- Add missing columns to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES subscription_plans(id),
ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20);

-- Update existing payments to have a default billing cycle if any exist
UPDATE payments 
SET billing_cycle = 'monthly' 
WHERE billing_cycle IS NULL;

-- Make billing_cycle NOT NULL after setting defaults
ALTER TABLE payments 
ALTER COLUMN billing_cycle SET NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_payments_plan ON payments(plan_id);
CREATE INDEX IF NOT EXISTS idx_payments_billing_cycle ON payments(billing_cycle);

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;