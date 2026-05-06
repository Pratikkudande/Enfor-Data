package models

import (
	"time"
)

// WhatsAppAccount represents a connected WhatsApp Business account
type WhatsAppAccount struct {
	ID                   string     `json:"id" db:"id"`
	UserID               string     `json:"user_id" db:"user_id"`
	BusinessAccountID    *string    `json:"business_account_id,omitempty" db:"business_account_id"`
	PhoneNumberID        *string    `json:"phone_number_id,omitempty" db:"phone_number_id"`
	PhoneNumber          string     `json:"phone_number" db:"phone_number"`
	DisplayName          *string    `json:"display_name,omitempty" db:"display_name"`
	AccessTokenEncrypted *string    `json:"-" db:"access_token_encrypted"` // Never expose in JSON
	WebhookVerifyToken   *string    `json:"-" db:"webhook_verify_token"`   // Never expose in JSON
	Status               string     `json:"status" db:"status"`
	ConnectionError      *string    `json:"connection_error,omitempty" db:"connection_error"`
	MessageLimit         int        `json:"message_limit" db:"message_limit"`
	MessagesSentToday    int        `json:"messages_sent_today" db:"messages_sent_today"`
	LastResetDate        *time.Time `json:"last_reset_date,omitempty" db:"last_reset_date"`
	ConnectedAt          *time.Time `json:"connected_at,omitempty" db:"connected_at"`
	LastUsedAt           *time.Time `json:"last_used_at,omitempty" db:"last_used_at"`
	
	// Meta WhatsApp Cloud API additional fields
	MetaAppID              *string    `json:"meta_app_id,omitempty" db:"meta_app_id"`
	MetaAppSecret          *string    `json:"-" db:"meta_app_secret"` // Never expose in JSON
	MetaWABAID             *string    `json:"meta_waba_id,omitempty" db:"meta_waba_id"`
	VerificationCode       *string    `json:"-" db:"verification_code"` // Never expose in JSON
	VerificationStatus     string     `json:"verification_status" db:"verification_status"` // "pending", "verified", "failed"
	VerificationExpiresAt  *time.Time `json:"verification_expires_at,omitempty" db:"verification_expires_at"`
	BusinessName           *string    `json:"business_name,omitempty" db:"business_name"`
	BusinessDescription    *string    `json:"business_description,omitempty" db:"business_description"`
	BusinessCategory       *string    `json:"business_category,omitempty" db:"business_category"`
	BusinessWebsite        *string    `json:"business_website,omitempty" db:"business_website"`
	
	CreatedAt            time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at" db:"updated_at"`
}

// Campaign represents a WhatsApp message campaign
type Campaign struct {
	ID                 string     `json:"id" db:"id"`
	UserID             string     `json:"user_id" db:"user_id"`
	WhatsAppAccountID  *string    `json:"whatsapp_account_id,omitempty" db:"whatsapp_account_id"`
	Name               string     `json:"name" db:"name"`
	MessageText        string     `json:"message_text" db:"message_text"`
	TotalRecipients    int        `json:"total_recipients" db:"total_recipients"`
	SuccessfulSends    int        `json:"successful_sends" db:"successful_sends"`
	FailedSends        int        `json:"failed_sends" db:"failed_sends"`
	PendingSends       int        `json:"pending_sends" db:"pending_sends"`
	Status             string     `json:"status" db:"status"`
	ScheduledAt        *time.Time `json:"scheduled_at,omitempty" db:"scheduled_at"`
	StartedAt          *time.Time `json:"started_at,omitempty" db:"started_at"`
	CompletedAt        *time.Time `json:"completed_at,omitempty" db:"completed_at"`
	ErrorMessage       *string    `json:"error_message,omitempty" db:"error_message"`
	CreatedAt          time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at" db:"updated_at"`
}

// CampaignRecipient represents a recipient in a campaign
type CampaignRecipient struct {
	ID                string     `json:"id" db:"id"`
	CampaignID        string     `json:"campaign_id" db:"campaign_id"`
	ClientID          string     `json:"client_id" db:"client_id"`
	RecipientName     *string    `json:"recipient_name,omitempty" db:"recipient_name"`
	RecipientPhone    string     `json:"recipient_phone" db:"recipient_phone"`
	SendStatus        string     `json:"send_status" db:"send_status"`
	ProviderMessageID *string    `json:"provider_message_id,omitempty" db:"provider_message_id"`
	ErrorMessage      *string    `json:"error_message,omitempty" db:"error_message"`
	QueuedAt          *time.Time `json:"queued_at,omitempty" db:"queued_at"`
	SentAt            *time.Time `json:"sent_at,omitempty" db:"sent_at"`
	DeliveredAt       *time.Time `json:"delivered_at,omitempty" db:"delivered_at"`
	ReadAt            *time.Time `json:"read_at,omitempty" db:"read_at"`
	FailedAt          *time.Time `json:"failed_at,omitempty" db:"failed_at"`
	CreatedAt         time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at" db:"updated_at"`
}

// MessageTemplate represents a reusable message template
type MessageTemplate struct {
	ID           string     `json:"id" db:"id"`
	UserID       string     `json:"user_id" db:"user_id"`
	Name         string     `json:"name" db:"name"`
	Category     string     `json:"category" db:"category"`
	TemplateText string     `json:"template_text" db:"template_text"`
	Variables    []string   `json:"variables" db:"variables"`
	UsageCount   int        `json:"usage_count" db:"usage_count"`
	LastUsedAt   *time.Time `json:"last_used_at,omitempty" db:"last_used_at"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at" db:"updated_at"`
}

// MessageLog represents an audit log entry for sent messages
type MessageLog struct {
	ID                string     `json:"id" db:"id"`
	UserID            string     `json:"user_id" db:"user_id"`
	CampaignID        *string    `json:"campaign_id,omitempty" db:"campaign_id"`
	ClientID          *string    `json:"client_id,omitempty" db:"client_id"`
	MessageType       string     `json:"message_type" db:"message_type"`
	MessageText       string     `json:"message_text" db:"message_text"`
	RecipientPhone    string     `json:"recipient_phone" db:"recipient_phone"`
	Status            string     `json:"status" db:"status"`
	ProviderMessageID *string    `json:"provider_message_id,omitempty" db:"provider_message_id"`
	ErrorMessage      *string    `json:"error_message,omitempty" db:"error_message"`
	SentAt            time.Time  `json:"sent_at" db:"sent_at"`
}
