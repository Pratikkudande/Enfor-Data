-- Update WhatsApp accounts table for Meta WhatsApp Cloud API
-- Each user will have their own WhatsApp Business Account credentials

ALTER TABLE whatsapp_accounts
ADD COLUMN IF NOT EXISTS meta_app_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS meta_app_secret VARCHAR(255),
ADD COLUMN IF NOT EXISTS meta_access_token TEXT,
ADD COLUMN IF NOT EXISTS meta_phone_number_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS meta_business_account_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS meta_waba_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS verification_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS business_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS business_description TEXT,
ADD COLUMN IF NOT EXISTS business_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS business_website VARCHAR(500),
ADD COLUMN IF NOT EXISTS webhook_verify_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_meta_phone_id ON whatsapp_accounts(meta_phone_number_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_verification_status ON whatsapp_accounts(verification_status);

-- Add comments
COMMENT ON COLUMN whatsapp_accounts.meta_app_id IS 'Meta App ID from Facebook Developer Console';
COMMENT ON COLUMN whatsapp_accounts.meta_app_secret IS 'Meta App Secret (encrypted)';
COMMENT ON COLUMN whatsapp_accounts.meta_access_token IS 'Meta Access Token for API calls';
COMMENT ON COLUMN whatsapp_accounts.meta_phone_number_id IS 'WhatsApp Phone Number ID from Meta';
COMMENT ON COLUMN whatsapp_accounts.meta_business_account_id IS 'Meta Business Account ID';
COMMENT ON COLUMN whatsapp_accounts.meta_waba_id IS 'WhatsApp Business Account ID';
COMMENT ON COLUMN whatsapp_accounts.verification_status IS 'pending, verified, failed';
