package dto

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
