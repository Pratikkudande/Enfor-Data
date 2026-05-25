package dto

// CreateClientRequest represents the data required for creating a new client
type CreateClientRequest struct {
	// Personal Information
	FirstName string `json:"first_name" validate:"required,min=2,max=100"`
	LastName  string `json:"last_name" validate:"required,min=2,max=100"`
	Email     string `json:"email" validate:"required,email"`
	Phone     string `json:"phone" validate:"required,min=10,max=20"`

	// Client Classification
	Type string `json:"type" validate:"required,oneof=buyer seller tenant owner list_property_for_rent"`

	// Location & Requirements
	PreferredLocation string `json:"preferred_location" validate:"required,min=2,max=255"`
	// Address is optional — not mandatory for any client type
	Address    string `json:"address" validate:"omitempty"`
	City       string `json:"city" validate:"required,min=2,max=100"`
	State      string `json:"state" validate:"required,min=2,max=100"`
	PostalCode string `json:"postal_code" validate:"omitempty,min=4,max=20"`

	// Requirements/Enquiry
	Requirements string `json:"requirements" validate:"required,min=3"`

	// Budget (for buyers/tenants)
	BudgetMin *float64 `json:"budget_min,omitempty" validate:"omitempty,gt=0"`
	BudgetMax *float64 `json:"budget_max,omitempty" validate:"omitempty,gt=0"`

	// Expected Amount (for sellers and list_property_for_rent)
	ExpectedAmount *float64 `json:"expected_amount,omitempty" validate:"omitempty,gt=0"`

	// Sell Property: price range
	MinPrice *float64 `json:"min_price,omitempty" validate:"omitempty,gt=0"`
	MaxPrice *float64 `json:"max_price,omitempty" validate:"omitempty,gt=0"`

	// Sell Property: property address
	PropertyAddress string `json:"property_address,omitempty"`

	// Area fields (buyer, seller, list_property_for_rent)
	BuildupArea     *float64 `json:"buildup_area,omitempty" validate:"omitempty,gt=0"`
	CarpetArea      *float64 `json:"carpet_area,omitempty" validate:"omitempty,gt=0"`
	MeasurementUnit string   `json:"measurement_unit,omitempty" validate:"omitempty"`

	// Rent Client: deposit budget
	DepositBudget *float64 `json:"deposit_budget,omitempty" validate:"omitempty,gt=0"`

	Notes *string `json:"notes,omitempty"`
}

// UpdateClientRequest represents the data that can be updated
type UpdateClientRequest struct {
	// Personal Information
	FirstName *string `json:"first_name,omitempty" validate:"omitempty,min=2,max=100"`
	LastName  *string `json:"last_name,omitempty" validate:"omitempty,min=2,max=100"`
	Email     *string `json:"email,omitempty" validate:"omitempty,email"`
	Phone     *string `json:"phone,omitempty" validate:"omitempty,min=10,max=20"`

	// Client Classification
	Type   *string `json:"type,omitempty" validate:"omitempty,oneof=buyer seller tenant owner list_property_for_rent"`
	Status *string `json:"status,omitempty" validate:"omitempty,oneof=active converted inactive"`

	// Location & Requirements
	PreferredLocation *string `json:"preferred_location,omitempty" validate:"omitempty,min=2,max=255"`
	Address           *string `json:"address,omitempty" validate:"omitempty"`
	City              *string `json:"city,omitempty" validate:"omitempty,min=2,max=100"`
	State             *string `json:"state,omitempty" validate:"omitempty,min=2,max=100"`
	PostalCode        *string `json:"postal_code,omitempty" validate:"omitempty,min=4,max=20"`

	// Requirements/Enquiry
	Requirements *string `json:"requirements,omitempty" validate:"omitempty,min=3"`

	// Budget
	BudgetMin *float64 `json:"budget_min,omitempty" validate:"omitempty,gt=0"`
	BudgetMax *float64 `json:"budget_max,omitempty" validate:"omitempty,gt=0"`

	// Expected Amount
	ExpectedAmount *float64 `json:"expected_amount,omitempty" validate:"omitempty,gt=0"`

	// Sell Property
	MinPrice        *float64 `json:"min_price,omitempty" validate:"omitempty,gt=0"`
	MaxPrice        *float64 `json:"max_price,omitempty" validate:"omitempty,gt=0"`
	PropertyAddress *string  `json:"property_address,omitempty"`

	// Area fields
	BuildupArea     *float64 `json:"buildup_area,omitempty" validate:"omitempty,gt=0"`
	CarpetArea      *float64 `json:"carpet_area,omitempty" validate:"omitempty,gt=0"`
	MeasurementUnit *string  `json:"measurement_unit,omitempty"`

	// Rent Client
	DepositBudget *float64 `json:"deposit_budget,omitempty" validate:"omitempty,gt=0"`

	Notes *string `json:"notes,omitempty"`
}
