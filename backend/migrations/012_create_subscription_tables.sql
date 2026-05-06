-- ============================================================
-- SUBSCRIPTION MANAGEMENT SYSTEM
-- Migration 012: Create subscription tables
-- ============================================================

-- 1. Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Plan Identification
    name VARCHAR(50) NOT NULL UNIQUE, -- 'free_trial', 'starter', 'professional', 'enterprise'
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Pricing
    monthly_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    annual_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Feature Limits
    max_properties INTEGER, -- NULL means unlimited
    max_clients INTEGER,
    max_appointments_per_month INTEGER,
    max_whatsapp_messages_per_month INTEGER,
    max_sms_messages_per_month INTEGER,
    max_broker_connections INTEGER,
    max_business_posts_per_month INTEGER,
    max_team_members INTEGER DEFAULT 1,
    
    -- Feature Flags
    has_analytics BOOLEAN DEFAULT true,
    has_advanced_analytics BOOLEAN DEFAULT false,
    has_api_access BOOLEAN DEFAULT false,
    has_custom_templates BOOLEAN DEFAULT false,
    has_priority_support BOOLEAN DEFAULT false,
    
    -- Display Settings
    is_active BOOLEAN DEFAULT true,
    is_visible BOOLEAN DEFAULT true, -- Show on pricing page
    is_popular BOOLEAN DEFAULT false, -- Highlight as popular
    sort_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Subscriptions Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    
    -- Subscription Status
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    -- Possible values: 'trial', 'active', 'past_due', 'cancelled', 'expired', 'suspended'
    
    billing_cycle VARCHAR(20) NOT NULL, -- 'monthly', 'annual', 'trial'
    
    -- Trial Information
    is_trial BOOLEAN DEFAULT false,
    trial_starts_at TIMESTAMP WITH TIME ZONE,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Subscription Period
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Cancellation
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    
    -- Razorpay Integration
    razorpay_subscription_id VARCHAR(255) UNIQUE,
    razorpay_plan_id VARCHAR(255),
    razorpay_customer_id VARCHAR(255),
    
    -- Usage Tracking (reset monthly)
    current_properties_count INTEGER DEFAULT 0,
    current_clients_count INTEGER DEFAULT 0,
    current_appointments_count INTEGER DEFAULT 0,
    current_whatsapp_messages_count INTEGER DEFAULT 0,
    current_sms_messages_count INTEGER DEFAULT 0,
    current_business_posts_count INTEGER DEFAULT 0,
    usage_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Only one active/trial subscription per user
CREATE UNIQUE INDEX idx_user_active_subscription 
    ON user_subscriptions(user_id) 
    WHERE status IN ('trial', 'active');

-- 3. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    
    -- Payment Details
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(50) NOT NULL, -- 'pending', 'success', 'failed', 'refunded'
    billing_cycle VARCHAR(20) NOT NULL, -- 'monthly', 'annual'
    payment_method VARCHAR(50), -- 'card', 'upi', 'netbanking', 'wallet'
    
    -- Razorpay Integration
    razorpay_payment_id VARCHAR(255) UNIQUE,
    razorpay_order_id VARCHAR(255),
    razorpay_signature VARCHAR(500),
    
    -- Payment Metadata
    description TEXT,
    invoice_number VARCHAR(100) UNIQUE,
    receipt_url TEXT,
    
    -- Failure Information
    failure_reason TEXT,
    failure_code VARCHAR(100),
    
    -- Timestamps
    paid_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. OTP Verifications Table
CREATE TABLE IF NOT EXISTS otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mobile_number VARCHAR(20) NOT NULL,
    
    -- OTP Details
    otp_code VARCHAR(6) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL, -- Hashed OTP for security
    purpose VARCHAR(50) NOT NULL, -- 'registration', 'login', 'password_reset'
    
    -- Status
    is_verified BOOLEAN DEFAULT false,
    attempts_count INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    
    -- Expiry
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Rate Limiting & Security
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Subscription Events Table (Audit Log)
CREATE TABLE IF NOT EXISTS subscription_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    
    -- Event Details
    event_type VARCHAR(100) NOT NULL,
    -- 'trial_started', 'trial_ending_soon', 'trial_expired', 
    -- 'subscription_created', 'subscription_renewed', 'subscription_upgraded',
    -- 'subscription_downgraded', 'subscription_cancelled', 'payment_success', 'payment_failed'
    
    event_data JSONB,
    
    -- Notification
    notification_sent BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Feature Usage Logs Table
CREATE TABLE IF NOT EXISTS feature_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    
    -- Feature Details
    feature_name VARCHAR(100) NOT NULL,
    -- 'property_create', 'client_create', 'appointment_create',
    -- 'whatsapp_send', 'sms_send', 'business_post_create'
    
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'send'
    resource_id UUID,
    
    -- Usage Metadata
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Subscription Plans
CREATE INDEX IF NOT EXISTS idx_subscription_plans_name ON subscription_plans(name);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active, is_visible);

-- User Subscriptions
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_trial_end ON user_subscriptions(trial_ends_at) 
    WHERE is_trial = true AND status = 'trial';
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period_end ON user_subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_razorpay ON user_subscriptions(razorpay_subscription_id);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_subscription ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment ON payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order ON payments(razorpay_order_id);

-- OTP Verifications
CREATE INDEX IF NOT EXISTS idx_otp_mobile_purpose ON otp_verifications(mobile_number, purpose, is_verified);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_user ON otp_verifications(user_id);

-- Subscription Events
CREATE INDEX IF NOT EXISTS idx_subscription_events_user ON subscription_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type ON subscription_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_events_subscription ON subscription_events(subscription_id);

-- Feature Usage Logs
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_feature ON feature_usage_logs(user_id, feature_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_usage_subscription ON feature_usage_logs(subscription_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Update updated_at timestamp for subscription_plans
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at timestamp for user_subscriptions
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at timestamp for payments
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at timestamp for otp_verifications
DROP TRIGGER IF EXISTS update_otp_verifications_updated_at ON otp_verifications;
CREATE TRIGGER update_otp_verifications_updated_at
    BEFORE UPDATE ON otp_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SEED DATA - Default Subscription Plans
-- ============================================================

INSERT INTO subscription_plans (
    name, display_name, description,
    monthly_price, annual_price,
    max_properties, max_clients, max_appointments_per_month,
    max_whatsapp_messages_per_month, max_sms_messages_per_month,
    max_broker_connections, max_business_posts_per_month, max_team_members,
    has_analytics, has_advanced_analytics, has_api_access, has_custom_templates, has_priority_support,
    is_active, is_visible, is_popular, sort_order
) VALUES
-- Free Trial Plan
(
    'free_trial', 'Free Trial', '15-day free trial with limited features',
    0.00, 0.00,
    5, 10, 5,
    50, 50,
    0, 0, 1,
    true, false, false, false, false,
    true, false, false, 0
),
-- Starter Plan
(
    'starter', 'Starter Plan', 'Perfect for individual brokers getting started',
    999.00, 9999.00,
    50, 100, NULL,
    500, 500,
    20, 5, 1,
    true, false, false, false, false,
    true, true, false, 1
),
-- Professional Plan
(
    'professional', 'Professional Plan', 'For growing teams and serious brokers',
    2499.00, 24999.00,
    NULL, NULL, NULL,
    2000, 2000,
    NULL, NULL, 3,
    true, true, true, true, true,
    true, true, true, 2
),
-- Enterprise Plan
(
    'enterprise', 'Enterprise Plan', 'Custom solution for large organizations',
    0.00, 0.00,
    NULL, NULL, NULL,
    NULL, NULL,
    NULL, NULL, NULL,
    true, true, true, true, true,
    true, true, false, 3
)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- MODIFY USERS TABLE
-- ============================================================

-- Add mobile verification fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS mobile_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mobile_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_otp_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS otp_attempts_count INTEGER DEFAULT 0;

-- Make whatsapp_number unique (it's the primary mobile identifier)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_whatsapp_number'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT unique_whatsapp_number UNIQUE(whatsapp_number);
    END IF;
END $$;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE subscription_plans IS 'Defines available subscription plans and their features';
COMMENT ON TABLE user_subscriptions IS 'Tracks user subscriptions and usage';
COMMENT ON TABLE payments IS 'Payment history and Razorpay transaction data';
COMMENT ON TABLE otp_verifications IS 'OTP codes for mobile verification';
COMMENT ON TABLE subscription_events IS 'Audit log of all subscription-related events';
COMMENT ON TABLE feature_usage_logs IS 'Tracks feature usage for limit enforcement';

COMMENT ON COLUMN user_subscriptions.status IS 'trial, active, past_due, cancelled, expired, suspended';
COMMENT ON COLUMN payments.status IS 'pending, success, failed, refunded';
COMMENT ON COLUMN otp_verifications.purpose IS 'registration, login, password_reset';

