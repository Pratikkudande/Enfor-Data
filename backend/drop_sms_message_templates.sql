-- Migration: Drop Basic SMS Templates
-- This removes the basic templates feature, keeping only DLT templates

-- Drop trigger
DROP TRIGGER IF EXISTS update_sms_templates_updated_at ON sms_message_templates;

-- Drop indexes
DROP INDEX IF EXISTS idx_sms_templates_user_id;
DROP INDEX IF EXISTS idx_sms_templates_category;

-- Drop table
DROP TABLE IF EXISTS sms_message_templates;

-- Comments
COMMENT ON TABLE sms_campaigns IS 'SMS marketing campaigns';
COMMENT ON TABLE sms_campaign_recipients IS 'Recipients for each SMS campaign';
COMMENT ON TABLE sms_message_logs IS 'Audit log of all SMS messages sent';
