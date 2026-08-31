package models

import (
	"time"
)

// ClientRequirement represents a client's property requirement
type ClientRequirement struct {
	ID               string     `json:"id" db:"id"`
	ClientID         string     `json:"client_id" db:"client_id"`
	RequirementType  string     `json:"requirement_type" db:"requirement_type"` // "buy" or "rent"
	BuildupArea      *int       `json:"buildup_area,omitempty" db:"buildup_area"`
	CarpetArea       *int       `json:"carpet_area,omitempty" db:"carpet_area"`
	MeasurementUnit  *string    `json:"measurement_unit,omitempty" db:"measurement_unit"` // "sq_foot", "sq_meter", "acre", "guntha"
	MinBudget        *float64   `json:"min_budget,omitempty" db:"min_budget"`
	MaxBudget        *float64   `json:"max_budget,omitempty" db:"max_budget"`
	DepositBudget    *float64   `json:"deposit_budget,omitempty" db:"deposit_budget"`
	PreferredLocation *string   `json:"preferred_location,omitempty" db:"preferred_location"`
	City             *string    `json:"city,omitempty" db:"city"`
	State            *string    `json:"state,omitempty" db:"state"`
	PostalCode       *string    `json:"postal_code,omitempty" db:"postal_code"`
	Enquiry          *string    `json:"enquiry,omitempty" db:"enquiry"` // "1 BHK", "2 BHK", etc.
	Notes            *string    `json:"notes,omitempty" db:"notes"`
	Status           string     `json:"status" db:"status"` // "active", "fulfilled", "cancelled"
	CreatedBy        *string    `json:"created_by,omitempty" db:"created_by"`
	CreatedAt        time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at" db:"updated_at"`
	
	// Joined fields (not in DB)
	ClientName       string     `json:"client_name,omitempty" db:"client_name"`
	ClientPhone      string     `json:"client_phone,omitempty" db:"client_phone"`
}
