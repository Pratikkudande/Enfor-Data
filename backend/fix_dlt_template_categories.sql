-- Fix DLT templates that might not have a category value
-- This script ensures all templates have a valid category

-- First, check if category column exists (in case migration wasn't run)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sms_dlt_templates' 
        AND column_name = 'category'
    ) THEN
        -- Add category column if it doesn't exist
        ALTER TABLE sms_dlt_templates 
        ADD COLUMN category VARCHAR(50) DEFAULT 'SERVICES' NOT NULL;
    END IF;
END $$;

-- Update any NULL or empty categories to SERVICES
UPDATE sms_dlt_templates 
SET category = 'SERVICES' 
WHERE category IS NULL OR category = '';

-- Add check constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'check_category' 
        AND table_name = 'sms_dlt_templates'
    ) THEN
        ALTER TABLE sms_dlt_templates
        ADD CONSTRAINT check_category CHECK (category IN ('FOR_SALE', 'FOR_RENT', 'FOR_BUY', 'LIST_FOR_RENT', 'SERVICES'));
    END IF;
END $$;

-- Create index on category if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'sms_dlt_templates' 
        AND indexname = 'idx_sms_dlt_templates_category'
    ) THEN
        CREATE INDEX idx_sms_dlt_templates_category ON sms_dlt_templates(category);
    END IF;
END $$;
