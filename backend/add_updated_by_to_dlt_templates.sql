-- Add updated_by column to sms_dlt_templates table
-- This tracks which user last modified the template

ALTER TABLE sms_dlt_templates 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add index for faster lookups by updated_by
CREATE INDEX IF NOT EXISTS idx_sms_dlt_templates_updated_by ON sms_dlt_templates(updated_by);

-- Add comment
COMMENT ON COLUMN sms_dlt_templates.updated_by IS 'User ID who last updated this template';

-- Verify the change
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sms_dlt_templates' 
  AND column_name = 'updated_by';
