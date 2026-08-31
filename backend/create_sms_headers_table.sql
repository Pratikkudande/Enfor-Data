-- Create SMS Headers table
CREATE TABLE IF NOT EXISTS sms_headers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    header VARCHAR(10) NOT NULL,
    provider VARCHAR(50),
    type VARCHAR(50) NOT NULL CHECK (type IN ('Promotional', 'Service', 'Implicit')),
    status VARCHAR(50) NOT NULL DEFAULT 'Created' CHECK (status IN ('Created', 'Approved', 'Active', 'Inactive', 'Rejected')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, header, provider)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_sms_headers_user_id ON sms_headers(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_headers_header ON sms_headers(header);
CREATE INDEX IF NOT EXISTS idx_sms_headers_status ON sms_headers(status);
CREATE INDEX IF NOT EXISTS idx_sms_headers_provider ON sms_headers(provider);
CREATE INDEX IF NOT EXISTS idx_sms_headers_created_by ON sms_headers(created_by);

-- Add comments to the table
COMMENT ON TABLE sms_headers IS 'Stores SMS sender IDs/headers for users';
COMMENT ON COLUMN sms_headers.header IS 'SMS sender ID/header (e.g., ENFOR, PROPRT)';
COMMENT ON COLUMN sms_headers.provider IS 'SMS provider (e.g., MSG91, Fast2SMS, JIO)';
COMMENT ON COLUMN sms_headers.type IS 'Header type: Promotional, Service, or Implicit';
COMMENT ON COLUMN sms_headers.status IS 'Approval status';
COMMENT ON COLUMN sms_headers.created_by IS 'User who created this header';
COMMENT ON COLUMN sms_headers.updated_by IS 'User who last updated this header';
