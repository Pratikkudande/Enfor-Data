-- SMS Marketing Module Tables
-- Similar to WhatsApp module but for SMS campaigns

-- SMS Accounts Table (stores Twilio credentials per user)
CREATE TABLE IF NOT EXISTS sms_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Twilio Configuration
    twilio_account_sid VARCHAR(255),
    twilio_auth_token_encrypted TEXT, -- Encrypted
    twilio_phone_number VARCHAR(20) NOT NULL,
    
    -- Account Status
    status VARCHAR(50) DEFAULT 'not_connected' CHECK (status IN ('connected', 'not_connected', 'suspended')),
    connection_error TEXT,
    
    -- Usage Limits
    message_limit INTEGER DEFAULT 1000,
    messages_sent_today INTEGER DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    
    -- Timestamps
    connected_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- SMS Campaigns Table
CREATE TABLE IF NOT EXISTS sms_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sms_account_id UUID REFERENCES sms_accounts(id) ON DELETE SET NULL,
    
    name VARCHAR(255) NOT NULL,
    message_text TEXT NOT NULL,
    
    -- Campaign Stats
    total_recipients INTEGER DEFAULT 0,
    successful_sends INTEGER DEFAULT 0,
    failed_sends INTEGER DEFAULT 0,
    pending_sends INTEGER DEFAULT 0,
    
    -- Campaign Status
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'failed', 'cancelled')),
    
    -- Scheduling
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS Campaign Recipients Table
CREATE TABLE IF NOT EXISTS sms_campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES sms_campaigns(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    recipient_name VARCHAR(255),
    recipient_phone VARCHAR(20) NOT NULL,
    
    -- Send Status
    send_status VARCHAR(50) DEFAULT 'pending' CHECK (send_status IN ('pending', 'sent', 'delivered', 'failed')),
    provider_message_id VARCHAR(255), -- Twilio Message SID
    error_message TEXT,
    
    -- Timestamps
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS Message Templates Table
CREATE TABLE IF NOT EXISTS sms_message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    template_text TEXT NOT NULL,
    variables TEXT[], -- Array of variable names like {name}, {property}
    
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS Message Logs Table (audit trail)
CREATE TABLE IF NOT EXISTS sms_message_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES sms_campaigns(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('individual', 'campaign', 'appointment')),
    message_text TEXT NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    
    status VARCHAR(50) NOT NULL CHECK (status IN ('sent', 'delivered', 'failed')),
    provider_message_id VARCHAR(255), -- Twilio Message SID
    error_message TEXT,
    
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sms_accounts_user_id ON sms_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_accounts_status ON sms_accounts(status);

CREATE INDEX IF NOT EXISTS idx_sms_campaigns_user_id ON sms_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_status ON sms_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_created_at ON sms_campaigns(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sms_campaign_recipients_campaign_id ON sms_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sms_campaign_recipients_status ON sms_campaign_recipients(send_status);

CREATE INDEX IF NOT EXISTS idx_sms_templates_user_id ON sms_message_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_templates_category ON sms_message_templates(category);

CREATE INDEX IF NOT EXISTS idx_sms_logs_user_id ON sms_message_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_sent_at ON sms_message_logs(sent_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sms_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sms_accounts_updated_at BEFORE UPDATE ON sms_accounts FOR EACH ROW EXECUTE FUNCTION update_sms_updated_at_column();
CREATE TRIGGER update_sms_campaigns_updated_at BEFORE UPDATE ON sms_campaigns FOR EACH ROW EXECUTE FUNCTION update_sms_updated_at_column();
CREATE TRIGGER update_sms_campaign_recipients_updated_at BEFORE UPDATE ON sms_campaign_recipients FOR EACH ROW EXECUTE FUNCTION update_sms_updated_at_column();
CREATE TRIGGER update_sms_templates_updated_at BEFORE UPDATE ON sms_message_templates FOR EACH ROW EXECUTE FUNCTION update_sms_updated_at_column();

-- Comments
COMMENT ON TABLE sms_accounts IS 'Stores Twilio SMS account credentials for each user';
COMMENT ON TABLE sms_campaigns IS 'SMS marketing campaigns';
COMMENT ON TABLE sms_campaign_recipients IS 'Recipients for each SMS campaign';
COMMENT ON TABLE sms_message_templates IS 'Reusable SMS message templates';
COMMENT ON TABLE sms_message_logs IS 'Audit log of all SMS messages sent';
