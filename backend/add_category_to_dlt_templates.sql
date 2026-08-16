-- Add category column to sms_dlt_templates table
ALTER TABLE sms_dlt_templates 
ADD COLUMN category VARCHAR(50) DEFAULT 'SERVICES' NOT NULL;

-- Add check constraint for valid categories
ALTER TABLE sms_dlt_templates
ADD CONSTRAINT check_category CHECK (category IN ('FOR_SALE', 'FOR_RENT', 'FOR_BUY', 'LIST_FOR_RENT', 'SERVICES'));

-- Create index on category for better query performance
CREATE INDEX idx_sms_dlt_templates_category ON sms_dlt_templates(category);

-- Update existing records to have a default category
UPDATE sms_dlt_templates SET category = 'SERVICES' WHERE category IS NULL;
