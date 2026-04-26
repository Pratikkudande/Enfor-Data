package models

import (
	"time"
)

// Client represents a real estate client in the system
type Client struct {
	ID string `json:"id" db:"id"`

	// Personal Information
	FirstName string `json:"first_name" db:"first_name"`
	LastName  string `json:"last_name" db:"last_name"`
	Email     string `json:"email" db:"email"`
	Phone     string `json:"phone" db:"phone"`

	// Client Classification
	Type   string `json:"type" db:"type"`
	Status string `json:"status" db:"status"`

	// Budget Information (optional - mainly for buyers/tenants)
	BudgetMin *float64 `json:"budget_min,omitempty" db:"budget_min"`
	BudgetMax *float64 `json:"budget_max,omitempty" db:"budget_max"`

	// Expected Amount (for sellers and list_property_for_rent)
	ExpectedAmount *float64 `json:"expected_amount,omitempty" db:"expected_amount"`

	// Location & Requirements
	PreferredLocation string `json:"preferred_location" db:"preferred_location"`
	Address           string `json:"address" db:"address"`
	City              string `json:"city" db:"city"`
	State             string `json:"state" db:"state"`
	PostalCode        string `json:"postal_code" db:"postal_code"`

	// Requirements/Enquiry
	Requirements string  `json:"requirements" db:"requirements"`
	Notes        *string `json:"notes,omitempty" db:"notes"`

	// Ownership
	BrokerID string `json:"broker_id" db:"broker_id"`

	// Denormalized broker info (for performance)
	BrokerName *string `json:"broker_name,omitempty" db:"broker_name"`
	BrokerCity *string `json:"broker_city,omitempty" db:"broker_city"`

	// Timestamps
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

