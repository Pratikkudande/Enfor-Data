package models

import (
	"time"
)

// ClientOption is a lightweight client representation for dropdowns/selects.
// It carries only the fields the UI needs to render and link a client.
type ClientOption struct {
	ID                string `json:"id" db:"id"`
	FirstName         string `json:"first_name" db:"first_name"`
	LastName          string `json:"last_name" db:"last_name"`
	Phone             string `json:"phone" db:"phone"`
	Email             string `json:"email" db:"email"`
	Type              string `json:"type" db:"type"`
	PreferredLocation string `json:"preferred_location" db:"preferred_location"`
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
	Type   string `json:"type" db:"type"`
	Status string `json:"status" db:"status"`

	// Budget Information (buyers/tenants)
	BudgetMin *float64 `json:"budget_min,omitempty" db:"budget_min"`
	BudgetMax *float64 `json:"budget_max,omitempty" db:"budget_max"`

	// Expected Amount (sellers / list_property_for_rent)
	ExpectedAmount *float64 `json:"expected_amount,omitempty" db:"expected_amount"`

	// Sell Property: price range
	MinPrice *float64 `json:"min_price,omitempty" db:"min_price"`
	MaxPrice *float64 `json:"max_price,omitempty" db:"max_price"`

	// Sell Property: property address
	PropertyAddress *string `json:"property_address,omitempty" db:"property_address"`

	// Area fields (buyer, seller, list_property_for_rent)
	BuildupArea     *float64 `json:"buildup_area,omitempty" db:"buildup_area"`
	CarpetArea      *float64 `json:"carpet_area,omitempty" db:"carpet_area"`
	MeasurementUnit *string  `json:"measurement_unit,omitempty" db:"measurement_unit"`

	// Rent Client: deposit budget
	DepositBudget *float64 `json:"deposit_budget,omitempty" db:"deposit_budget"`

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

	// Denormalized broker info
	BrokerName *string `json:"broker_name,omitempty" db:"broker_name"`
	BrokerCity *string `json:"broker_city,omitempty" db:"broker_city"`

	// Timestamps
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}
