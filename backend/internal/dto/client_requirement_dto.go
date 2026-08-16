package dto

// CreateClientRequirementRequest represents the request to create a client requirement
type CreateClientRequirementRequest struct {
	ClientID          string   `json:"client_id" binding:"required"`
	RequirementType   string   `json:"requirement_type" binding:"required"`
	BuildupArea       *int     `json:"buildup_area"`
	CarpetArea        *int     `json:"carpet_area"`
	MeasurementUnit   *string  `json:"measurement_unit"`
	MinBudget         *float64 `json:"min_budget"`
	MaxBudget         *float64 `json:"max_budget"`
	DepositBudget     *float64 `json:"deposit_budget"`
	PreferredLocation *string  `json:"preferred_location"`
	City              *string  `json:"city"`
	State             *string  `json:"state"`
	PostalCode        *string  `json:"postal_code"`
	Enquiry           *string  `json:"enquiry"`
	Notes             *string  `json:"notes"`
	Status            string   `json:"status"`
}

// UpdateClientRequirementRequest represents the request to update a client requirement
type UpdateClientRequirementRequest struct {
	RequirementType   string   `json:"requirement_type"`
	BuildupArea       *int     `json:"buildup_area"`
	CarpetArea        *int     `json:"carpet_area"`
	MeasurementUnit   *string  `json:"measurement_unit"`
	MinBudget         *float64 `json:"min_budget"`
	MaxBudget         *float64 `json:"max_budget"`
	DepositBudget     *float64 `json:"deposit_budget"`
	PreferredLocation *string  `json:"preferred_location"`
	City              *string  `json:"city"`
	State             *string  `json:"state"`
	PostalCode        *string  `json:"postal_code"`
	Enquiry           *string  `json:"enquiry"`
	Notes             *string  `json:"notes"`
	Status            string   `json:"status"`
}
