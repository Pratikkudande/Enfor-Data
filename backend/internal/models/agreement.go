package models

import "time"

// Agreement represents a property agreement in the system
type Agreement struct {
	ID         string    `json:"id" db:"id"`
	PropertyID string    `json:"property_id" db:"property_id"`
	ClientID   *string   `json:"client_id,omitempty" db:"client_id"`
	BrokerID   string    `json:"broker_id" db:"broker_id"`
	StartDate  time.Time `json:"start_date" db:"start_date"`
	EndDate    time.Time `json:"end_date" db:"end_date"`
	Status     string    `json:"status" db:"status"`

	// Denormalized fields
	PropertyTitle   *string `json:"property_title,omitempty" db:"property_title"`
	PropertyAddress *string `json:"property_address,omitempty" db:"property_address"`
	ClientName      *string `json:"client_name,omitempty" db:"client_name"`
	BrokerName      *string `json:"broker_name,omitempty" db:"broker_name"`

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}
