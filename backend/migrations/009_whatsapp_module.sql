-- ============================================================
-- WHATSAPP MARKETING MODULE
-- ============================================================

-- 1. WhatsApp Accounts (Connection Status)
CREATE TABLE IF NOT EXISTS whatsapp_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Meta Business Account Details
    business_account_id VARCHAR(255),
    phone_number_id VARCHAR(255),
    phone_number VARCHAR(20) NOT NULL,
    display_name VARCHAR(255),
    
    -- Security
    access_token_encrypted TEXT,
    webhook_verify_token VARCHAR(255),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'not_connected' 
        CHECK (status IN ('not_connected', 'pending_verification', 'connected', 'failed', 'reconnect_required')),
    connection_error TEXT,
    
    -- Limits
    message_limit INTEGER DEFAULT 1000,
    messages_sent_today INTEGER DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    
    -- Timestamps
    connected_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT uq_user_whatsapp UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_user ON whatsapp_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_status ON whatsapp_accounts(status);

-- 2. Message Templates
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('marketing', 'appointment', 'acknowledgment', 'general')),
    template_text TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    
    -- Usage stats
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_user ON message_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON message_templates(category);

-- 3. Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    whatsapp_account_id UUID REFERENCES whatsapp_accounts(id) ON DELETE SET NULL,
    
    name VARCHAR(255) NOT NULL,
    message_text TEXT NOT NULL,
    
    -- Recipients
    total_recipients INTEGER NOT NULL DEFAULT 0,
    successful_sends INTEGER DEFAULT 0,
    failed_sends INTEGER DEFAULT 0,
    pending_sends INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'queued', 'sending', 'completed', 'failed', 'cancelled')),
    
    -- Scheduling
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_user ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created ON campaigns(created_at DESC);

-- 4. Campaign Recipients (Message Tracking)
CREATE TABLE IF NOT EXISTS campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Recipient details (denormalized for history)
    recipient_name VARCHAR(255),
    recipient_phone VARCHAR(20) NOT NULL,
    
    -- Sending status
    send_status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (send_status IN ('pending', 'queued', 'sent', 'delivered', 'read', 'failed')),
    
    -- Provider details
    provider_message_id VARCHAR(255),
    error_message TEXT,
    
    -- Timestamps
    queued_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_client ON campaign_recipients(client_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON campaign_recipients(send_status);

-- 5. Message Logs (Audit Trail)
CREATE TABLE IF NOT EXISTS message_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('individual', 'bulk', 'campaign')),
    message_text TEXT NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    
    status VARCHAR(50) NOT NULL,
    provider_message_id VARCHAR(255),
    error_message TEXT,
    
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_logs_user ON message_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_campaign ON message_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_sent ON message_logs(sent_at DESC);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_whatsapp_accounts_updated_at ON whatsapp_accounts;
CREATE TRIGGER update_whatsapp_accounts_updated_at
    BEFORE UPDATE ON whatsapp_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_message_templates_updated_at ON message_templates;
CREATE TRIGGER update_message_templates_updated_at
    BEFORE UPDATE ON message_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaign_recipients_updated_at ON campaign_recipients;
CREATE TRIGGER update_campaign_recipients_updated_at
    BEFORE UPDATE ON campaign_recipients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
