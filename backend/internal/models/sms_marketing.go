package models

import (
	"time"
)

// SMSAccount represents a MSG91 SMS account for a user
type SMSAccount struct {
	ID                    string     `json:"id" db:"id"`
	UserID                string     `json:"user_id" db:"user_id"`
	MSG91AuthKey          *string    `json:"msg91_auth_key,omitempty" db:"msg91_auth_key"`
	MSG91AuthKeyEncrypted *string    `json:"-" db:"msg91_auth_key_encrypted"` // Never expose in JSON
	MSG91SenderID         string     `json:"msg91_sender_id" db:"msg91_sender_id"`
	Status                string     `json:"status" db:"status"` // "connected", "not_connected", "suspended"
	ConnectionError       *string    `json:"connection_error,omitempty" db:"connection_error"`
	MessageLimit          int        `json:"message_limit" db:"message_limit"`
	MessagesSentToday     int        `json:"messages_sent_today" db:"messages_sent_today"`
	LastResetDate         *time.Time `json:"last_reset_date,omitempty" db:"last_reset_date"`
	ConnectedAt           *time.Time `json:"connected_at,omitempty" db:"connected_at"`
	LastUsedAt            *time.Time `json:"last_used_at,omitempty" db:"last_used_at"`
	CreatedAt             time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at" db:"updated_at"`
}

// SMSCampaign represents an SMS marketing campaign
type SMSCampaign struct {
	ID              string     `json:"id" db:"id"`
	UserID          string     `json:"user_id" db:"user_id"`
	SMSAccountID    *string    `json:"sms_account_id,omitempty" db:"sms_account_id"`
	Name            string     `json:"name" db:"name"`
	MessageText     string     `json:"message_text" db:"message_text"`
	TotalRecipients int        `json:"total_recipients" db:"total_recipients"`
	SuccessfulSends int        `json:"successful_sends" db:"successful_sends"`
	FailedSends     int        `json:"failed_sends" db:"failed_sends"`
	PendingSends    int        `json:"pending_sends" db:"pending_sends"`
	Status          string     `json:"status" db:"status"` // "draft", "scheduled", "sending", "completed", "failed", "cancelled"
	ScheduledAt     *time.Time `json:"scheduled_at,omitempty" db:"scheduled_at"`
	StartedAt       *time.Time `json:"started_at,omitempty" db:"started_at"`
	CompletedAt     *time.Time `json:"completed_at,omitempty" db:"completed_at"`
	ErrorMessage    *string    `json:"error_message,omitempty" db:"error_message"`
	CreatedAt       time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at" db:"updated_at"`
}

// SMSCampaignRecipient represents a recipient in an SMS campaign
type SMSCampaignRecipient struct {
	ID                string     `json:"id" db:"id"`
	CampaignID        string     `json:"campaign_id" db:"campaign_id"`
	ClientID          string     `json:"client_id" db:"client_id"`
	RecipientName     *string    `json:"recipient_name,omitempty" db:"recipient_name"`
	RecipientPhone    string     `json:"recipient_phone" db:"recipient_phone"`
	SendStatus        string     `json:"send_status" db:"send_status"` // "pending", "sent", "delivered", "failed"
	ProviderMessageID *string    `json:"provider_message_id,omitempty" db:"provider_message_id"`
	ErrorMessage      *string    `json:"error_message,omitempty" db:"error_message"`
	QueuedAt          *time.Time `json:"queued_at,omitempty" db:"queued_at"`
	SentAt            *time.Time `json:"sent_at,omitempty" db:"sent_at"`
	DeliveredAt       *time.Time `json:"delivered_at,omitempty" db:"delivered_at"`
	FailedAt          *time.Time `json:"failed_at,omitempty" db:"failed_at"`
	CreatedAt         time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at" db:"updated_at"`
}

// SMSDLTTemplate represents a DLT (Distributed Ledger Technology) approved SMS template
type SMSDLTTemplate struct {
	ID              string    `json:"id" db:"id"`
	UserID          string    `json:"user_id" db:"user_id"`
	CreatedByName   string    `json:"created_by_name,omitempty" db:"created_by_name"` // User's full name (not stored in DB, fetched via JOIN)
	Header          string    `json:"header" db:"header"`
	TemplateID      *string   `json:"template_id,omitempty" db:"template_id"` // Provider's template ID
	TemplateName    string    `json:"template_name" db:"template_name"`
	TemplateType    string    `json:"template_type" db:"template_type"`       // "Promotional" or "Service"
	Category        string    `json:"category" db:"category"`                 // "FOR_SALE", "FOR_RENT", "FOR_BUY", "LIST_FOR_RENT", "SERVICES"
	Provider        *string   `json:"provider,omitempty" db:"provider"`       // "MSG91", "Fast2SMS", "JIO", etc.
	TemplateContent string    `json:"template_content" db:"template_content"` // Template with {#var#} placeholders
	SampleContent   *string   `json:"sample_content,omitempty" db:"sample_content"`
	Status          string    `json:"status" db:"status"` // "Registered", "Approved", "Active", "Inactive", "Rejected"
	VariableCount   int       `json:"variable_count" db:"variable_count"`
	UpdatedBy       *string   `json:"updated_by,omitempty" db:"updated_by"` // User ID who last updated
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time `json:"updated_at" db:"updated_at"`
}

// SMSMessageLog represents an audit log entry for sent SMS messages
type SMSMessageLog struct {
	ID                string     `json:"id" db:"id"`
	UserID            string     `json:"user_id" db:"user_id"`
	CampaignID        *string    `json:"campaign_id,omitempty" db:"campaign_id"`
	ClientID          *string    `json:"client_id,omitempty" db:"client_id"`
	MessageType       string     `json:"message_type" db:"message_type"` // "individual", "campaign", "appointment"
	MessageText       string     `json:"message_text" db:"message_text"`
	RecipientPhone    string     `json:"recipient_phone" db:"recipient_phone"`
	Status            string     `json:"status" db:"status"` // "sent", "delivered", "failed"
	ProviderMessageID *string    `json:"provider_message_id,omitempty" db:"provider_message_id"`
	BatchID           *string    `json:"batch_id,omitempty" db:"batch_id"`
	Category          *string    `json:"category,omitempty" db:"category"`
	StatusDescription *string    `json:"status_description,omitempty" db:"status_description"`
	DeliveredAt       *time.Time `json:"delivered_at,omitempty" db:"delivered_at"`
	ErrorMessage      *string    `json:"error_message,omitempty" db:"error_message"`
	SentAt            time.Time  `json:"sent_at" db:"sent_at"`
}

// SMSHeader represents a sender ID/header for SMS messages
type SMSHeader struct {
	ID            string    `json:"id" db:"id"`
	UserID        string    `json:"user_id" db:"user_id"`
	CreatedByName string    `json:"created_by_name,omitempty" db:"created_by_name"` // User's full name (not stored in DB, fetched via JOIN)
	Header        string    `json:"header" db:"header"`
	Provider      *string   `json:"provider,omitempty" db:"provider"`
	Type          string    `json:"type" db:"type"`     // "Promotional", "Service", "Implicit"
	Status        string    `json:"status" db:"status"` // "Created", "Approved", "Active", "Inactive", "Rejected"
	CreatedBy     string    `json:"created_by" db:"created_by"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
	UpdatedBy     *string   `json:"updated_by,omitempty" db:"updated_by"`
	UpdatedAt     time.Time `json:"updated_at" db:"updated_at"`
}
