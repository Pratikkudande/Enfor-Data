-- Migration script to update SMS functionality to use MSG91 only
-- Run this script to update your database schema

-- Add new MSG91 columns to sms_accounts table if they don't exist
ALTER TABLE sms_accounts 
ADD COLUMN IF NOT EXISTS msg91_auth_key VARCHAR(255),
ADD COLUMN IF NOT EXISTS msg91_auth_key_encrypted TEXT,
ADD COLUMN IF NOT EXISTS msg91_sender_id VARCHAR(50);

-- Remove all Twilio-related columns completely
ALTER TABLE sms_accounts DROP COLUMN IF EXISTS twilio_account_sid;
ALTER TABLE sms_accounts DROP COLUMN IF EXISTS twilio_auth_token_encrypted;
ALTER TABLE sms_accounts DROP COLUMN IF EXISTS twilio_phone_number;
ALTER TABLE sms_accounts DROP COLUMN IF EXISTS provider;
ALTER TABLE sms_accounts DROP COLUMN IF EXISTS account_sid;
ALTER TABLE sms_accounts DROP COLUMN IF EXISTS auth_token;
ALTER TABLE sms_accounts DROP COLUMN IF EXISTS from_number;
ALTER TABLE sms_accounts DROP COLUMN IF EXISTS api_key;
ALTER TABLE sms_accounts DROP COLUMN IF EXISTS api_secret;
ALTER TABLE sms_accounts DROP COLUMN IF EXISTS region;

-- Update status values to match new schema
UPDATE sms_accounts SET status = 'not_connected' WHERE status = 'inactive';
UPDATE sms_accounts SET status = 'connected' WHERE status = 'active';

-- Update status constraint
ALTER TABLE sms_accounts DROP CONSTRAINT IF EXISTS sms_accounts_status_check;
ALTER TABLE sms_accounts 
ADD CONSTRAINT sms_accounts_status_check 
CHECK (status IN ('connected', 'not_connected', 'suspended'));

-- Create indexes for MSG91 fields
CREATE INDEX IF NOT EXISTS idx_sms_accounts_msg91_sender_id ON sms_accounts(msg91_sender_id);

-- Add comments to document the MSG91 fields
COMMENT ON COLUMN sms_accounts.msg91_auth_key IS 'MSG91 API authentication key';
COMMENT ON COLUMN sms_accounts.msg91_auth_key_encrypted IS 'Encrypted MSG91 API authentication key';
COMMENT ON COLUMN sms_accounts.msg91_sender_id IS 'MSG91 sender ID for SMS messages';