package models

import (
	"time"
)

// Property represents a real estate property listing in the system
type Property struct {
	ID string `json:"id" db:"id"`

	// Basic Property Information
	Title       string `json:"title" db:"title"`
	Type        string `json:"type" db:"type"`                 // apartment, house, commercial, plot
	ListingType string `json:"listing_type" db:"listing_type"` // sale, rent

	// Pricing and Size
	Price float64 `json:"price" db:"price"`
	Area  float64 `json:"area" db:"area"`

	// Property Details (optional for commercial/plot)
	Bedrooms  *int `json:"bedrooms,omitempty" db:"bedrooms"`
	Bathrooms *int `json:"bathrooms,omitempty" db:"bathrooms"`

	// Location Information
	Location string `json:"location" db:"location"`
	Address  string `json:"address" db:"address"`
	City     string `json:"city" db:"city"`
	State    string `json:"state" db:"state"`

	// Description and Features
	Description string   `json:"description" db:"description"`
	Amenities   []string `json:"amenities" db:"amenities"`

	// Status and Ownership
	Status   string  `json:"status" db:"status"` // available, sold, rented, under_negotiation
	BrokerID string  `json:"broker_id" db:"broker_id"`
	ClientID *string `json:"client_id,omitempty" db:"client_id"`

	// Denormalized broker and client info for admin queries
	BrokerName *string `json:"broker_name,omitempty" db:"broker_name"`
	BrokerCity *string `json:"broker_city,omitempty" db:"broker_city"`
	ClientName *string `json:"client_name,omitempty" db:"client_name"`

	// Timestamps
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt *time.Time `json:"-" db:"deleted_at"`
}

