-- Fix: Add missing message_type column to sms_message_logs table
-- Run this against your database to fix the "column message_type does not exist" error

ALTER TABLE sms_message_logs 
  ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'individual';

-- Optional: set a comment for clarity
COMMENT ON COLUMN sms_message_logs.message_type IS 'Type of SMS: individual, campaign, or appointment';
