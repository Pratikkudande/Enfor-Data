package models

import (
	"time"
)

// Appointment represents a scheduled appointment in the system
type Appointment struct {
	ID          string  `json:"id" db:"id"`
	Title       string  `json:"title" db:"title"`
	Description *string `json:"description,omitempty" db:"description"`
	Date        string  `json:"date" db:"date"`
	Time        string  `json:"time" db:"time"`

	// Relationships
	ClientID   string  `json:"client_id" db:"client_id"`
	PropertyID *string `json:"property_id,omitempty" db:"property_id"`
	BrokerID   string  `json:"broker_id" db:"broker_id"`

	// Classification
	Type   string `json:"type" db:"type"`
	Status string `json:"status" db:"status"`

	// Denormalized fields for performance
	ClientName      *string `json:"client_name,omitempty" db:"client_name"`
	ClientPhone     *string `json:"client_phone,omitempty" db:"client_phone"`
	PropertyAddress *string `json:"property_address,omitempty" db:"property_address"`
	BrokerName      *string `json:"broker_name,omitempty" db:"broker_name"`
	BrokerCity      *string `json:"broker_city,omitempty" db:"broker_city"`

	// Timestamps
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

