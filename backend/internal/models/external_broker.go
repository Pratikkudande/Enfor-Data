package models

import "time"

// ExternalBroker represents a real-estate broker who is NOT yet registered on EnforData.
// Stored by EnforData brokers for lead generation / future conversion.
// When the external broker signs up on EnforData the row is auto-deleted by a DB trigger.
type ExternalBroker struct {
	ID           string  `json:"id"`
	Name         string  `json:"name"`
	MobileNumber string  `json:"mobile_number"`
	Area         *string `json:"area,omitempty"`
	Location     *string `json:"location,omitempty"`
	Notes        *string `json:"notes,omitempty"`

	AddedBy        string  `json:"added_by"`
	AddedByName    *string `json:"added_by_name,omitempty"`
	AddedByCity    *string `json:"added_by_city,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
