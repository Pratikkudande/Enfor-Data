package models

import "time"

// Notification is an in-app notification delivered to a user.
type Notification struct {
	ID        string    `json:"id" db:"id"`
	UserID    string    `json:"user_id" db:"user_id"`
	Type      string    `json:"type" db:"type"`     // property, project, client, appointment, payment, system, marketing
	Title     string    `json:"title" db:"title"`
	Message   string    `json:"message" db:"message"`
	ActionURL *string   `json:"action_url" db:"action_url"`
	Metadata  JSONB     `json:"metadata" db:"metadata"`
	Read      bool      `json:"read" db:"is_read"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// Notification type constants
const (
	NotificationTypeProperty    = "property"
	NotificationTypeProject     = "project"
	NotificationTypeAppointment = "appointment"
	NotificationTypeClient      = "client"
	NotificationTypePayment     = "payment"
	NotificationTypeSystem      = "system"
	NotificationTypeMarketing   = "marketing"
)
