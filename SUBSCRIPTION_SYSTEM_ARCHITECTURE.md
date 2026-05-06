# SaaS Subscription Management System - Complete Architecture

## Project Analysis Summary

### Current Implementation
**Tech Stack:**
- **Backend**: Go (Gin framework), PostgreSQL
- **Frontend**: React, TypeScript, TailwindCSS
- **Authentication**: JWT-based (access + refresh tokens)
- **Payment**: Twilio integrated (for SMS)
- **User Roles**: broker, channel_partner, admin

**Existing Features:**
- User registration/login (email + password)
- Properties management
- Clients management  
- Appointments with SMS notifications
- WhatsApp Marketing module
- SMS Marketing module
- Broker Network
- Business Posts

**Current Auth Flow:**
1. User registers with email/password
2. JWT tokens generated (access + refresh)
3. No mobile verification currently
4. No subscription/payment system
5. All features accessible to all users

---

## Phase 1: Complete Architecture & Design

### 1. SUBSCRIPTION MODEL

#### 1.1 Pricing Tiers

**FREE TRIAL PLAN**
- **Duration**: 15 days from mobile verification
- **Price**: ₹0
- **Activation**: Automatic after OTP verification
- **Credit Card**: Not required
- **Features**:
  - 5 properties listing
  - 10 clients
  - 5 appointments per month
  - 50 WhatsApp messages
  - 50 SMS messages
  - Basic analytics
  - No broker network access
  - No business posts
  - Single user only

**STARTER PLAN**
- **Monthly**: ₹999/month
- **Annual**: ₹9,999/year (₹833/month - 17% discount)
- **Features**:
  - 50 properties listing
  - 100 clients
  - Unlimited appointments
  - 500 WhatsApp messages/month
  - 500 SMS messages/month
  - Advanced analytics
  - Broker network (up to 20 connections)
  - Business posts (5/month)
  - Single user
  - Email support

**PROFESSIONAL PLAN**
- **Monthly**: ₹2,499/month
- **Annual**: ₹24,999/year (₹2,083/month - 17% discount)
- **Features**:
  - Unlimited properties
  - Unlimited clients
  - Unlimited appointments
  - 2,000 WhatsApp messages/month
  - 2,000 SMS messages/month
  - Premium analytics & reports
  - Unlimited broker network
  - Unlimited business posts
  - Up to 3 team members
  - Priority email + chat support
  - Custom templates
  - API access

**ENTERPRISE PLAN**
- **Price**: Custom pricing
- **Features**:
  - Everything in Professional
  - Unlimited messaging
  - Unlimited team members
  - White-label options
  - Dedicated account manager
  - Custom integrations
  - SLA guarantee
  - Phone support

#### 1.2 Feature Access Matrix

| Feature | Free Trial | Starter | Professional | Enterprise |
|---------|-----------|---------|--------------|------------|
| Properties | 5 | 50 | Unlimited | Unlimited |
| Clients | 10 | 100 | Unlimited | Unlimited |
| Appointments | 5/month | Unlimited | Unlimited | Unlimited |
| WhatsApp Messages | 50/month | 500/month | 2000/month | Unlimited |
| SMS Messages | 50/month | 500/month | 2000/month | Unlimited |
| Broker Network | ❌ | 20 connections | Unlimited | Unlimited |
| Business Posts | ❌ | 5/month | Unlimited | Unlimited |
| Team Members | 1 | 1 | 3 | Unlimited |
| Analytics | Basic | Advanced | Premium | Custom |
| Templates | Basic | Standard | Custom | Custom |
| Support | Email | Email | Email + Chat | Phone + Dedicated |
| API Access | ❌ | ❌ | ✅ | ✅ |

---

### 2. AUTHENTICATION & MOBILE VERIFICATION

#### 2.1 New Registration Flow

```
1. User Registration Form
   ├─ First Name, Last Name
   ├─ Email (unique)
   ├─ Password
   ├─ Mobile Number (unique, primary identifier)
   ├─ Firm Name
   ├─ Role (broker/channel_partner)
   └─ Address details

2. Account Created (is_verified = false, is_active = false)
   └─ User cannot login yet

3. OTP Verification Screen
   ├─ Send OTP to mobile number (via Twilio)
   ├─ 6-digit OTP
   ├─ Valid for 10 minutes
   ├─ Max 3 attempts
   └─ Resend after 60 seconds

4. OTP Verified
   ├─ is_verified = true
   ├─ is_active = true
   ├─ Free Trial Activated
   ├─ trial_starts_at = NOW()
   ├─ trial_ends_at = NOW() + 15 days
   └─ Redirect to Dashboard

5. Login Flow (Existing users)
   ├─ Email + Password
   ├─ Check is_verified = true
   ├─ Check subscription status
   └─ Grant access based on plan
```

#### 2.2 OTP Security Features

- **Rate Limiting**: Max 3 OTP requests per 15 minutes per mobile
- **Attempt Limiting**: Max 5 verification attempts per OTP
- **Expiry**: OTP valid for 10 minutes
- **Resend Cooldown**: 60 seconds between resend requests
- **Blacklist**: Block suspicious mobile numbers
- **Audit Log**: Track all OTP requests and verifications

---

### 3. DATABASE SCHEMA DESIGN

#### 3.1 New Tables

**subscription_plans**
```sql
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE, -- 'free_trial', 'starter', 'professional', 'enterprise'
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Pricing
    monthly_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    annual_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Feature Limits
    max_properties INTEGER,
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
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_visible BOOLEAN DEFAULT true, -- Show on pricing page
    sort_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**user_subscriptions**
```sql
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    
    -- Subscription Details
    status VARCHAR(50) NOT NULL DEFAULT 'active', 
    -- 'trial', 'active', 'past_due', 'cancelled', 'expired', 'suspended'
    
    billing_cycle VARCHAR(20) NOT NULL, -- 'monthly', 'annual', 'trial'
    
    -- Trial Information
    is_trial BOOLEAN DEFAULT false,
    trial_starts_at TIMESTAMP WITH TIME ZONE,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    trial_days_remaining INTEGER,
    
    -- Subscription Dates
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
    usage_reset_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_active_subscription UNIQUE(user_id, status) 
        WHERE status IN ('trial', 'active')
);
```

**payments**
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    
    -- Payment Details
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(50) NOT NULL, -- 'pending', 'success', 'failed', 'refunded'
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
```

**otp_verifications**
```sql
CREATE TABLE otp_verifications (
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
    
    -- Rate Limiting
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_otp_mobile_purpose ON otp_verifications(mobile_number, purpose, is_verified);
CREATE INDEX idx_otp_expires ON otp_verifications(expires_at);
```

**subscription_events**
```sql
CREATE TABLE subscription_events (
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

CREATE INDEX idx_subscription_events_user ON subscription_events(user_id, created_at DESC);
CREATE INDEX idx_subscription_events_type ON subscription_events(event_type, created_at DESC);
```

**feature_usage_logs**
```sql
CREATE TABLE feature_usage_logs (
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

CREATE INDEX idx_feature_usage_user_feature ON feature_usage_logs(user_id, feature_name, created_at DESC);
```

#### 3.2 Modified Tables

**users table - Add columns:**
```sql
ALTER TABLE users 
ADD COLUMN mobile_verified BOOLEAN DEFAULT false,
ADD COLUMN mobile_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN last_otp_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN otp_attempts_count INTEGER DEFAULT 0;

-- Make whatsapp_number unique
ALTER TABLE users ADD CONSTRAINT unique_whatsapp_number UNIQUE(whatsapp_number);
```

---

### 4. SUBSCRIPTION LIFECYCLE WORKFLOW

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Send OTP to     │
                    │  Mobile Number   │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  User Enters OTP │
                    └──────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                 Valid?              Invalid?
                    │                   │
                    ▼                   ▼
          ┌──────────────────┐   ┌──────────────┐
          │ Mobile Verified  │   │ Show Error   │
          │ is_verified=true │   │ Retry/Resend │
          └──────────────────┘   └──────────────┘
                    │
                    ▼
          ┌──────────────────────┐
          │ ACTIVATE FREE TRIAL  │
          │ - Create subscription│
          │ - plan: free_trial   │
          │ - status: trial      │
          │ - 15 days duration   │
          └──────────────────────┘
                    │
                    ▼
          ┌──────────────────────┐
          │  REDIRECT TO         │
          │  DASHBOARD           │
          └──────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TRIAL PERIOD (15 DAYS)                        │
│  - Show trial countdown banner                                   │
│  - Send notifications: 7 days, 3 days, 1 day, expired          │
│  - Limited feature access                                        │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
          ┌──────────────────────┐
          │  TRIAL EXPIRING?     │
          └──────────────────────┘
                    │
          ┌─────────┴─────────┐
          │                   │
      Upgraded?           Not Upgraded?
          │                   │
          ▼                   ▼
┌──────────────────┐   ┌──────────────────┐
│ PAID SUBSCRIPTION│   │  TRIAL EXPIRED   │
│ - Razorpay flow  │   │ - Restrict access│
│ - Activate plan  │   │ - Show upgrade   │
└──────────────────┘   │   prompt         │
          │             └──────────────────┘
          │                   │
          ▼                   │
┌──────────────────────────┐ │
│  ACTIVE SUBSCRIPTION     │ │
│  - Full feature access   │ │
│  - Usage tracking        │ │
│  - Auto-renewal          │ │
└──────────────────────────┘ │
          │                   │
          ▼                   │
┌──────────────────────────┐ │
│  RENEWAL/UPGRADE/        │ │
│  DOWNGRADE/CANCEL        │ │
└──────────────────────────┘ │
          │                   │
          └───────────────────┘
```

---

### 5. RAZORPAY PAYMENT INTEGRATION

#### 5.1 Razorpay Setup

**Required Razorpay Features:**
- Subscriptions API
- Payment Links
- Webhooks
- Customer Management
- Invoice Generation

**Configuration:**
```go
type RazorpayConfig struct {
    KeyID     string
    KeySecret string
    WebhookSecret string
    BaseURL   string
}
```

#### 5.2 Payment Flow

**Subscription Purchase Flow:**
```
1. User clicks "Upgrade to Starter"
   └─ Frontend: Show plan details

2. User confirms plan selection
   └─ Backend: POST /api/subscriptions/create
      ├─ Create Razorpay Customer (if not exists)
      ├─ Create Razorpay Subscription
      ├─ Generate payment link
      └─ Return checkout URL

3. Redirect to Razorpay Checkout
   └─ User completes payment

4. Razorpay Webhook: subscription.activated
   └─ Backend: POST /api/webhooks/razorpay
      ├─ Verify signature
      ├─ Update user_subscriptions status = 'active'
      ├─ Create payment record
      ├─ Log subscription_event
      └─ Send confirmation email/SMS

5. Redirect back to app
   └─ Show success message
   └─ Refresh subscription status
```

#### 5.3 Webhook Events to Handle

```go
const (
    EventSubscriptionActivated   = "subscription.activated"
    EventSubscriptionCharged     = "subscription.charged"
    EventSubscriptionCompleted   = "subscription.completed"
    EventSubscriptionPaused      = "subscription.paused"
    EventSubscriptionResumed     = "subscription.resumed"
    EventSubscriptionCancelled   = "subscription.cancelled"
    EventPaymentAuthorized       = "payment.authorized"
    EventPaymentCaptured         = "payment.captured"
    EventPaymentFailed           = "payment.failed"
    EventRefundProcessed         = "refund.processed"
)
```

#### 5.4 Proration Logic

**Upgrade Scenario:**
```
User on Starter (₹999/month) upgrades to Professional (₹2,499/month)
- Calculate unused days in current period
- Calculate prorated amount
- Charge difference immediately
- Update subscription
```

**Downgrade Scenario:**
```
User on Professional downgrades to Starter
- Schedule downgrade for end of current period
- No immediate charge
- Update subscription with cancel_at_period_end flag
```

---

### 6. FEATURE ACCESS CONTROL

#### 6.1 Middleware Architecture

```go
// Subscription Middleware
func (m *SubscriptionMiddleware) RequireActiveSubscription() gin.HandlerFunc
func (m *SubscriptionMiddleware) RequirePlan(plans ...string) gin.HandlerFunc
func (m *SubscriptionMiddleware) CheckFeatureLimit(feature string) gin.HandlerFunc
```

#### 6.2 Feature Gating Examples

**Property Creation:**
```go
// Route
router.POST("/properties", 
    authMiddleware.RequireAuth(),
    subscriptionMiddleware.CheckFeatureLimit("property_create"),
    propertyHandler.CreateProperty)

// In Handler
func (h *PropertyHandler) CreateProperty(c *gin.Context) {
    userID := c.GetString("user_id")
    
    // Check if user can create more properties
    canCreate, err := h.subscriptionService.CanUseFeature(userID, "property_create")
    if !canCreate {
        c.JSON(http.StatusForbidden, gin.H{
            "error": "Property limit reached",
            "message": "Upgrade your plan to create more properties",
            "upgrade_url": "/pricing"
        })
        return
    }
    
    // Create property...
    
    // Track usage
    h.subscriptionService.TrackFeatureUsage(userID, "property_create", propertyID)
}
```

**WhatsApp Message Sending:**
```go
func (h *WhatsAppHandler) SendMessage(c *gin.Context) {
    userID := c.GetString("user_id")
    
    // Check message limit
    canSend, remaining, err := h.subscriptionService.CheckMessageLimit(userID, "whatsapp")
    if !canSend {
        c.JSON(http.StatusForbidden, gin.H{
            "error": "Message limit reached",
            "message": fmt.Sprintf("You've used all %d WhatsApp messages for this month", limit),
            "upgrade_url": "/pricing"
        })
        return
    }
    
    // Send message...
    
    // Increment usage
    h.subscriptionService.IncrementMessageUsage(userID, "whatsapp")
}
```

---

### 7. NOTIFICATION SYSTEM

#### 7.1 Trial Notifications

**7 Days Remaining:**
```
Subject: Your trial expires in 7 days
Body: You have 7 days left in your free trial. Upgrade now to continue using all features.
CTA: View Plans
```

**3 Days Remaining:**
```
Subject: Only 3 days left in your trial!
Body: Your trial ends soon. Don't lose access to your data and features.
CTA: Upgrade Now
```

**1 Day Remaining:**
```
Subject: Last day of your trial!
Body: Your trial expires tomorrow. Upgrade today to avoid interruption.
CTA: Upgrade Now
```

**Trial Expired:**
```
Subject: Your trial has expired
Body: Your trial has ended. Upgrade to regain full access.
CTA: Choose a Plan
```

#### 7.2 Subscription Notifications

- Payment successful
- Payment failed (with retry link)
- Subscription renewed
- Subscription expiring soon
- Subscription cancelled
- Plan upgraded/downgraded

---

### 8. ADMIN MANAGEMENT

#### 8.1 Admin Dashboard Features

**Subscription Analytics:**
- Total active subscriptions by plan
- Trial conversion rate
- Monthly recurring revenue (MRR)
- Annual recurring revenue (ARR)
- Churn rate
- Average revenue per user (ARPU)

**User Management:**
- View all users and their subscription status
- Manually upgrade/downgrade users
- Grant trial extensions
- Suspend/unsuspend accounts
- View payment history

**Plan Management:**
- Create/edit/delete plans
- Update pricing
- Modify feature limits
- Enable/disable plans

**Reports:**
- Revenue reports
- Subscription growth
- Feature usage statistics
- Payment success/failure rates

---

### 9. UI/UX PAGES

#### 9.1 New Pages Required

**1. Pricing Page** (`/pricing`)
- Professional pricing table
- Feature comparison matrix
- FAQ section
- "Start Free Trial" CTA
- Annual/Monthly toggle

**2. Subscription Management** (`/settings/subscription`)
- Current plan details
- Usage statistics
- Billing history
- Payment method
- Upgrade/downgrade options
- Cancel subscription

**3. Billing Dashboard** (`/settings/billing`)
- Payment history table
- Download invoices
- Update payment method
- Billing address

**4. Upgrade Modal**
- Triggered when feature limit reached
- Show current vs required plan
- Quick upgrade flow

**5. Trial Countdown Banner**
- Persistent banner in dashboard
- Shows days remaining
- "Upgrade Now" button

**6. OTP Verification Screen**
- After registration
- Clean, focused UI
- Resend OTP button
- Timer countdown

#### 9.2 UI Components

**Trial Banner:**
```tsx
<div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Clock className="w-5 h-5 text-yellow-600" />
      <span className="text-sm text-yellow-800">
        {daysRemaining} days left in your free trial
      </span>
    </div>
    <button className="btn-primary">Upgrade Now</button>
  </div>
</div>
```

**Feature Limit Modal:**
```tsx
<Modal>
  <h2>Property Limit Reached</h2>
  <p>You've reached the limit of 5 properties on the Free Trial plan.</p>
  <div className="plan-comparison">
    <div>Current: Free Trial (5 properties)</div>
    <div>Upgrade to: Starter (50 properties)</div>
  </div>
  <button>Upgrade to Starter - ₹999/month</button>
</Modal>
```

---

### 10. API ENDPOINTS

#### 10.1 OTP Endpoints

```
POST   /api/auth/send-otp
POST   /api/auth/verify-otp
POST   /api/auth/resend-otp
```

#### 10.2 Subscription Endpoints

```
GET    /api/subscriptions/plans
GET    /api/subscriptions/current
POST   /api/subscriptions/create
POST   /api/subscriptions/upgrade
POST   /api/subscriptions/downgrade
POST   /api/subscriptions/cancel
POST   /api/subscriptions/resume
GET    /api/subscriptions/usage
```

#### 10.3 Payment Endpoints

```
POST   /api/payments/create-order
POST   /api/payments/verify
GET    /api/payments/history
GET    /api/payments/invoice/:id
POST   /api/webhooks/razorpay
```

#### 10.4 Feature Check Endpoints

```
GET    /api/features/check/:feature
GET    /api/features/limits
POST   /api/features/track-usage
```

---

### 11. SECURITY CONSIDERATIONS

**OTP Security:**
- Hash OTP codes before storing
- Rate limit OTP requests (3 per 15 min)
- Limit verification attempts (5 max)
- Expire OTPs after 10 minutes
- Log all OTP activities

**Payment Security:**
- Verify Razorpay webhook signatures
- Use HTTPS only
- Never store card details
- PCI DSS compliance
- Audit all payment transactions

**Subscription Security:**
- Prevent subscription tampering
- Server-side feature checks only
- Validate all usage limits
- Log subscription changes
- Implement grace periods

**Access Control:**
- JWT token validation
- Subscription status checks
- Feature entitlement verification
- Rate limiting on all endpoints
- CORS configuration

---

### 12. IMPLEMENTATION PHASES

**Phase 1: Database & Models (Week 1)**
- Create new tables
- Modify users table
- Create Go models
- Write migrations

**Phase 2: OTP System (Week 1-2)**
- OTP service
- Twilio integration
- OTP verification flow
- Rate limiting

**Phase 3: Subscription Core (Week 2-3)**
- Subscription service
- Plan management
- Feature entitlement engine
- Usage tracking

**Phase 4: Razorpay Integration (Week 3-4)**
- Payment service
- Razorpay SDK integration
- Webhook handling
- Invoice generation

**Phase 5: Middleware & Guards (Week 4)**
- Subscription middleware
- Feature gating
- Usage limit checks
- Access control

**Phase 6: Frontend - Auth Flow (Week 5)**
- OTP verification UI
- Registration flow update
- Login flow update

**Phase 7: Frontend - Subscription UI (Week 5-6)**
- Pricing page
- Subscription management
- Billing dashboard
- Upgrade modals
- Trial banners

**Phase 8: Admin Panel (Week 6-7)**
- Admin dashboard
- User management
- Plan management
- Analytics

**Phase 9: Notifications (Week 7)**
- Email notifications
- SMS notifications
- In-app notifications
- Trial reminders

**Phase 10: Testing & Polish (Week 8)**
- End-to-end testing
- Edge case handling
- Performance optimization
- Security audit

---

## NEXT STEPS

1. ✅ Review and approve this architecture
2. Create detailed API specifications
3. Design database migrations
4. Set up Razorpay account
5. Begin Phase 1 implementation

---

**Document Version**: 1.0  
**Last Updated**: April 27, 2026  
**Status**: Awaiting Approval
