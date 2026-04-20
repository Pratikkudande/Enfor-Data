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

// CreateClientRequest represents the data required for creating a new client
type CreateClientRequest struct {
	// Personal Information
	FirstName string `json:"first_name" validate:"required,min=2,max=100"`
	LastName  string `json:"last_name" validate:"required,min=2,max=100"`
	Email     string `json:"email" validate:"required,email"`
	Phone     string `json:"phone" validate:"required,min=10,max=20"`

	// Client Classification
	Type string `json:"type" validate:"required,oneof=buyer seller tenant owner"`

	// Location & Requirements
	PreferredLocation string `json:"preferred_location" validate:"required,min=2,max=255"`
	Address           string `json:"address" validate:"required,min=10"`
	City              string `json:"city" validate:"required,min=2,max=100"`
	State             string `json:"state" validate:"required,min=2,max=100"`
	PostalCode        string `json:"postal_code" validate:"required,min=4,max=20"`

	// Requirements/Enquiry
	Requirements string `json:"requirements" validate:"required,min=3"`

	// Optional Fields
	BudgetMin *float64 `json:"budget_min,omitempty" validate:"omitempty,gt=0"`
	BudgetMax *float64 `json:"budget_max,omitempty" validate:"omitempty,gt=0"`
	Notes     *string  `json:"notes,omitempty"`
}

// UpdateClientRequest represents the data that can be updated
type UpdateClientRequest struct {
	// Personal Information
	FirstName *string `json:"first_name,omitempty" validate:"omitempty,min=2,max=100"`
	LastName  *string `json:"last_name,omitempty" validate:"omitempty,min=2,max=100"`
	Email     *string `json:"email,omitempty" validate:"omitempty,email"`
	Phone     *string `json:"phone,omitempty" validate:"omitempty,min=10,max=20"`

	// Client Classification
	Type   *string `json:"type,omitempty" validate:"omitempty,oneof=buyer seller tenant owner"`
	Status *string `json:"status,omitempty" validate:"omitempty,oneof=active converted inactive"`

	// Location & Requirements
	PreferredLocation *string `json:"preferred_location,omitempty" validate:"omitempty,min=2,max=255"`
	Address           *string `json:"address,omitempty" validate:"omitempty,min=10"`
	City              *string `json:"city,omitempty" validate:"omitempty,min=2,max=100"`
	State             *string `json:"state,omitempty" validate:"omitempty,min=2,max=100"`
	PostalCode        *string `json:"postal_code,omitempty" validate:"omitempty,min=4,max=20"`

	// Requirements/Enquiry
	Requirements *string `json:"requirements,omitempty" validate:"omitempty,min=3"`

	// Optional Fields
	BudgetMin *float64 `json:"budget_min,omitempty" validate:"omitempty,gt=0"`
	BudgetMax *float64 `json:"budget_max,omitempty" validate:"omitempty,gt=0"`
	Notes     *string  `json:"notes,omitempty"`
}
