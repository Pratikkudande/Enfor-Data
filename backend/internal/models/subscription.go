package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

// SubscriptionPlan represents a subscription plan
type SubscriptionPlan struct {
	ID          string    `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	DisplayName string    `json:"display_name" db:"display_name"`
	Description *string   `json:"description" db:"description"`
	
	// Pricing
	MonthlyPrice float64 `json:"monthly_price" db:"monthly_price"`
	AnnualPrice  float64 `json:"annual_price" db:"annual_price"`
	Currency     string  `json:"currency" db:"currency"`

	// SMS Package (per package-calculation sheet)
	SmsCredits int     `json:"sms_credits" db:"sms_credits"`
	SmsRate    float64 `json:"sms_rate" db:"sms_rate"`

	// Feature Limits (NULL means unlimited)
	MaxProperties              *int `json:"max_properties" db:"max_properties"`
	MaxClients                 *int `json:"max_clients" db:"max_clients"`
	MaxAppointmentsPerMonth    *int `json:"max_appointments_per_month" db:"max_appointments_per_month"`
	MaxWhatsappMessagesPerMonth *int `json:"max_whatsapp_messages_per_month" db:"max_whatsapp_messages_per_month"`
	MaxSmsMessagesPerMonth     *int `json:"max_sms_messages_per_month" db:"max_sms_messages_per_month"`
	MaxBrokerConnections       *int `json:"max_broker_connections" db:"max_broker_connections"`
	MaxBusinessPostsPerMonth   *int `json:"max_business_posts_per_month" db:"max_business_posts_per_month"`
	MaxTeamMembers             *int `json:"max_team_members" db:"max_team_members"`
	
	// Feature Flags
	HasAnalytics         bool `json:"has_analytics" db:"has_analytics"`
	HasAdvancedAnalytics bool `json:"has_advanced_analytics" db:"has_advanced_analytics"`
	HasAPIAccess         bool `json:"has_api_access" db:"has_api_access"`
	HasCustomTemplates   bool `json:"has_custom_templates" db:"has_custom_templates"`
	HasPrioritySupport   bool `json:"has_priority_support" db:"has_priority_support"`
	
	// Display Settings
	IsActive  bool `json:"is_active" db:"is_active"`
	IsVisible bool `json:"is_visible" db:"is_visible"`
	IsPopular bool `json:"is_popular" db:"is_popular"`
	SortOrder int  `json:"sort_order" db:"sort_order"`

	// Which user role this plan is offered to ('broker' or 'channel_partner')
	TargetRole string `json:"target_role" db:"target_role"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// UserSubscription represents a user's subscription
type UserSubscription struct {
	ID     string `json:"id" db:"id"`
	UserID string `json:"user_id" db:"user_id"`
	PlanID string `json:"plan_id" db:"plan_id"`
	
	// Subscription Status
	Status       string `json:"status" db:"status"` // trial, active, past_due, cancelled, expired, suspended
	BillingCycle string `json:"billing_cycle" db:"billing_cycle"` // monthly, annual, trial
	
	// Trial Information
	IsTrial       bool       `json:"is_trial" db:"is_trial"`
	TrialStartsAt *time.Time `json:"trial_starts_at" db:"trial_starts_at"`
	TrialEndsAt   *time.Time `json:"trial_ends_at" db:"trial_ends_at"`
	
	// Subscription Period
	CurrentPeriodStart time.Time `json:"current_period_start" db:"current_period_start"`
	CurrentPeriodEnd   time.Time `json:"current_period_end" db:"current_period_end"`
	
	// Cancellation
	CancelAtPeriodEnd  bool       `json:"cancel_at_period_end" db:"cancel_at_period_end"`
	CancelledAt        *time.Time `json:"cancelled_at" db:"cancelled_at"`
	CancellationReason *string    `json:"cancellation_reason" db:"cancellation_reason"`
	
	// Razorpay Integration
	RazorpaySubscriptionID *string `json:"razorpay_subscription_id" db:"razorpay_subscription_id"`
	RazorpayPlanID         *string `json:"razorpay_plan_id" db:"razorpay_plan_id"`
	RazorpayCustomerID     *string `json:"razorpay_customer_id" db:"razorpay_customer_id"`
	
	// Usage Tracking
	CurrentPropertiesCount        int       `json:"current_properties_count" db:"current_properties_count"`
	CurrentClientsCount           int       `json:"current_clients_count" db:"current_clients_count"`
	CurrentAppointmentsCount      int       `json:"current_appointments_count" db:"current_appointments_count"`
	CurrentWhatsappMessagesCount  int       `json:"current_whatsapp_messages_count" db:"current_whatsapp_messages_count"`
	CurrentSmsMessagesCount       int       `json:"current_sms_messages_count" db:"current_sms_messages_count"`
	SmsTopupCredits               int       `json:"sms_topup_credits" db:"sms_topup_credits"`
	CurrentBusinessPostsCount     int       `json:"current_business_posts_count" db:"current_business_posts_count"`
	UsageResetAt                  time.Time `json:"usage_reset_at" db:"usage_reset_at"`
	
	// Metadata
	Metadata JSONB `json:"metadata" db:"metadata"`
	
	// Timestamps
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// TrialDaysRemaining calculates days remaining in trial
func (s *UserSubscription) TrialDaysRemaining() int {
	if !s.IsTrial || s.TrialEndsAt == nil {
		return 0
	}
	
	remaining := time.Until(*s.TrialEndsAt).Hours() / 24
	if remaining < 0 {
		return 0
	}
	return int(remaining)
}

// IsExpired checks if subscription is expired
func (s *UserSubscription) IsExpired() bool {
	return time.Now().After(s.CurrentPeriodEnd)
}

// SubscriptionEvent represents a subscription event for audit log
type SubscriptionEvent struct {
	ID             string    `json:"id" db:"id"`
	UserID         string    `json:"user_id" db:"user_id"`
	SubscriptionID *string   `json:"subscription_id" db:"subscription_id"`
	EventType      string    `json:"event_type" db:"event_type"`
	EventData      JSONB     `json:"event_data" db:"event_data"`
	
	// Notification
	NotificationSent   bool       `json:"notification_sent" db:"notification_sent"`
	NotificationSentAt *time.Time `json:"notification_sent_at" db:"notification_sent_at"`
	
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// FeatureUsageLog tracks feature usage
type FeatureUsageLog struct {
	ID             string    `json:"id" db:"id"`
	UserID         string    `json:"user_id" db:"user_id"`
	SubscriptionID *string   `json:"subscription_id" db:"subscription_id"`
	FeatureName    string    `json:"feature_name" db:"feature_name"`
	Action         string    `json:"action" db:"action"`
	ResourceID     *string   `json:"resource_id" db:"resource_id"`
	Metadata       JSONB     `json:"metadata" db:"metadata"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
}

// JSONB type for PostgreSQL JSONB columns
type JSONB map[string]interface{}

// Value implements driver.Valuer interface
func (j JSONB) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

// Scan implements sql.Scanner interface
func (j *JSONB) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}
	
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	
	return json.Unmarshal(bytes, j)
}

// SubscriptionWithPlan combines subscription with plan details
type SubscriptionWithPlan struct {
	Subscription UserSubscription   `json:"subscription"`
	Plan         SubscriptionPlan   `json:"plan"`
}

// UsageStats represents current usage statistics
type UsageStats struct {
	Properties struct {
		Used       int  `json:"used"`
		Limit      *int `json:"limit"`
		Percentage int  `json:"percentage"`
		CanUse     bool `json:"can_use"`
	} `json:"properties"`
	
	Clients struct {
		Used       int  `json:"used"`
		Limit      *int `json:"limit"`
		Percentage int  `json:"percentage"`
		CanUse     bool `json:"can_use"`
	} `json:"clients"`
	
	Appointments struct {
		Used       int  `json:"used"`
		Limit      *int `json:"limit"`
		Percentage int  `json:"percentage"`
		CanUse     bool `json:"can_use"`
	} `json:"appointments"`
	
	WhatsappMessages struct {
		Used       int       `json:"used"`
		Limit      *int      `json:"limit"`
		Percentage int       `json:"percentage"`
		CanUse     bool      `json:"can_use"`
		ResetsAt   time.Time `json:"resets_at"`
	} `json:"whatsapp_messages"`
	
	SmsMessages struct {
		Used       int       `json:"used"`
		Limit      *int      `json:"limit"`
		Percentage int       `json:"percentage"`
		CanUse     bool      `json:"can_use"`
		ResetsAt   time.Time `json:"resets_at"`
	} `json:"sms_messages"`
	
	BusinessPosts struct {
		Used       int       `json:"used"`
		Limit      *int      `json:"limit"`
		Percentage int       `json:"percentage"`
		CanUse     bool      `json:"can_use"`
		ResetsAt   time.Time `json:"resets_at"`
	} `json:"business_posts"`
}

// Event type constants
const (
	EventTrialStarted          = "trial_started"
	EventTrialEndingSoon       = "trial_ending_soon"
	EventTrialExpired          = "trial_expired"
	EventSubscriptionCreated   = "subscription_created"
	EventSubscriptionRenewed   = "subscription_renewed"
	EventSubscriptionUpgraded  = "subscription_upgraded"
	EventSubscriptionDowngraded = "subscription_downgraded"
	EventSubscriptionCancelled = "subscription_cancelled"
	EventPaymentSuccess        = "payment_success"
	EventPaymentFailed         = "payment_failed"
)

// Subscription status constants
const (
	StatusTrial     = "trial"
	StatusActive    = "active"
	StatusPastDue   = "past_due"
	StatusCancelled = "cancelled"
	StatusExpired   = "expired"
	StatusSuspended = "suspended"
)

// Billing cycle constants
const (
	BillingCycleMonthly = "monthly"
	BillingCycleAnnual  = "annual"
	BillingCycleTrial   = "trial"
)

// Feature name constants
const (
	FeaturePropertyCreate      = "property_create"
	FeatureClientCreate        = "client_create"
	FeatureAppointmentCreate   = "appointment_create"
	FeatureWhatsappSend        = "whatsapp_send"
	FeatureSMSSend             = "sms_send"
	FeatureBusinessPostCreate  = "business_post_create"
	FeatureBrokerConnect       = "broker_connect"
)

// UserSubscriptionDetails represents detailed subscription information
type UserSubscriptionDetails struct {
	Subscription *UserSubscription  `json:"subscription"`
	Plan         *SubscriptionPlan  `json:"plan"`
	Usage        map[string]int     `json:"usage"`
	IsActive     bool               `json:"is_active"`
	DaysLeft     int                `json:"days_left"`
}

// PlanComparison represents a comparison of all plans
type PlanComparison struct {
	Plans    []SubscriptionPlan  `json:"plans"`
	Features []FeatureComparison `json:"features"`
}

// FeatureComparison represents a feature comparison across plans
type FeatureComparison struct {
	Category string        `json:"category"`
	Items    []FeatureItem `json:"items"`
}

// FeatureItem represents a single feature in comparison
type FeatureItem struct {
	Name   string                 `json:"name"`
	Key    string                 `json:"key"`
	Values map[string]interface{} `json:"values"`
}

// FeatureLimitCheck represents the result of a feature limit check
type FeatureLimitCheck struct {
	FeatureName string `json:"feature_name"`
	HasAccess   bool   `json:"has_access"`
	Limit       int    `json:"limit"`
	Used        int    `json:"used"`
	Remaining   int    `json:"remaining"`
}

// SubscriptionStatusInfo represents detailed subscription status
type SubscriptionStatusInfo struct {
	HasSubscription bool   `json:"has_subscription"`
	IsActive        bool   `json:"is_active"`
	IsTrialing      bool   `json:"is_trialing"`
	IsPaid          bool   `json:"is_paid"`
	DaysLeft        int    `json:"days_left"`
	PlanSlug        string `json:"plan_slug,omitempty"`
}
