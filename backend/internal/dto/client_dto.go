package dto

// CreateClientRequest represents the data required for creating a new client
type CreateClientRequest struct {
	// Personal Information — only name and phone are mandatory
	FirstName string `json:"first_name" validate:"required,min=2,max=100"`
	LastName  string `json:"last_name" validate:"required,min=2,max=100"`
	Email     string `json:"email" validate:"omitempty,email"`
	Phone     string `json:"phone" validate:"required,min=10,max=20"`

	// Client Classification - support both single type and multiple types
	Type  string   `json:"type" validate:"omitempty,oneof=buyer seller tenant owner list_property_for_rent"`
	Types []string `json:"types,omitempty" validate:"omitempty,dive,oneof=buyer seller tenant owner list_property_for_rent"`

	// Location — all optional
	PreferredLocation string `json:"preferred_location" validate:"omitempty,max=255"`
	City              string `json:"city" validate:"omitempty,max=100"`
	State             string `json:"state" validate:"omitempty,max=100"`
	PostalCode        string `json:"postal_code" validate:"omitempty,max=20"`

	// Budget (for buyers/tenants)
	BudgetMin *float64 `json:"budget_min,omitempty" validate:"omitempty,gt=0"`
	BudgetMax *float64 `json:"budget_max,omitempty" validate:"omitempty,gt=0"`
}

// UpdateClientRequest represents the data that can be updated
type UpdateClientRequest struct {
	// Personal Information
	FirstName *string `json:"first_name,omitempty" validate:"omitempty,min=2,max=100"`
	LastName  *string `json:"last_name,omitempty" validate:"omitempty,min=2,max=100"`
	Email     *string `json:"email,omitempty" validate:"omitempty,email"`
	Phone     *string `json:"phone,omitempty" validate:"omitempty,min=10,max=20"`

	// Client Classification - support both single type and multiple types
	Type   *string  `json:"type,omitempty" validate:"omitempty,oneof=buyer seller tenant owner list_property_for_rent"`
	Types  []string `json:"types,omitempty" validate:"omitempty,dive,oneof=buyer seller tenant owner list_property_for_rent"`
	Status *string  `json:"status,omitempty" validate:"omitempty,oneof=active converted inactive"`

	// Location
	PreferredLocation *string `json:"preferred_location,omitempty" validate:"omitempty,min=2,max=255"`
	City              *string `json:"city,omitempty" validate:"omitempty,min=2,max=100"`
	State             *string `json:"state,omitempty" validate:"omitempty,min=2,max=100"`
	PostalCode        *string `json:"postal_code,omitempty" validate:"omitempty,min=4,max=20"`

	// Budget
	BudgetMin *float64 `json:"budget_min,omitempty" validate:"omitempty,gt=0"`
	BudgetMax *float64 `json:"budget_max,omitempty" validate:"omitempty,gt=0"`
}
