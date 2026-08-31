-- Make template_id and provider nullable in sms_dlt_templates table
ALTER TABLE sms_dlt_templates 
ALTER COLUMN template_id DROP NOT NULL,
ALTER COLUMN provider DROP NOT NULL;

-- Update comments to reflect optional fields
COMMENT ON COLUMN sms_dlt_templates.template_id IS 'Unique template ID from SMS provider (e.g., JIO, MSG91) - Optional';
COMMENT ON COLUMN sms_dlt_templates.provider IS 'SMS provider (e.g., MSG91, Fast2SMS, JIO) - Optional';
