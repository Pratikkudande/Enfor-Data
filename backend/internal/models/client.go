package models

import (
	"time"
)

// ClientOption is a lightweight client representation for dropdowns/selects.
// It carries only the fields the UI needs to render and link a client.
type ClientOption struct {
	ID                string   `json:"id" db:"id"`
	FirstName         string   `json:"first_name" db:"first_name"`
	LastName          string   `json:"last_name" db:"last_name"`
	Phone             string   `json:"phone" db:"phone"`
	Email             string   `json:"email" db:"email"`
	Type              string   `json:"type" db:"type"`
	Types             []string `json:"types,omitempty"`
	PreferredLocation string   `json:"preferred_location" db:"preferred_location"`
}

// Client represents a real estate client in the system
type Client struct {
	ID string `json:"id" db:"id"`

	// Personal Information
	FirstName string `json:"first_name" db:"first_name"`
	LastName  string `json:"last_name" db:"last_name"`
	Email     string `json:"email" db:"email"`
	Phone     string `json:"phone" db:"phone"`

	// Client Classification
	Type   string   `json:"type" db:"type"`         // Primary/latest type
	Types  []string `json:"types,omitempty"`        // All types this client has
	Status string   `json:"status" db:"status"`

	// Budget Information (buyers/tenants)
	BudgetMin *float64 `json:"budget_min,omitempty" db:"budget_min"`
	BudgetMax *float64 `json:"budget_max,omitempty" db:"budget_max"`

	// Location Information
	PreferredLocation string `json:"preferred_location" db:"preferred_location"`
	City              string `json:"city" db:"city"`
	State             string `json:"state" db:"state"`
	PostalCode        string `json:"postal_code" db:"postal_code"`

	// Ownership
	BrokerID string `json:"broker_id" db:"broker_id"`

	// Timestamps
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// ClientType represents a type assignment for a client
type ClientType struct {
	ID        string    `json:"id" db:"id"`
	ClientID  string    `json:"client_id" db:"client_id"`
	Type      string    `json:"type" db:"type"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}
