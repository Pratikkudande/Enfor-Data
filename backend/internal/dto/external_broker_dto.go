package dto

// CreateExternalBrokerRequest — only mobile_number is required (duplicate guard).
type CreateExternalBrokerRequest struct {
	Name         string  `json:"name"          validate:"required,min=2,max=200"`
	MobileNumber string  `json:"mobile_number" validate:"required,min=10,max=20"`
	Area         *string `json:"area,omitempty"`
	Location     *string `json:"location,omitempty"`
	Notes        *string `json:"notes,omitempty"`
}

// UpdateExternalBrokerRequest — all fields optional.
type UpdateExternalBrokerRequest struct {
	Name         *string `json:"name,omitempty"          validate:"omitempty,min=2,max=200"`
	MobileNumber *string `json:"mobile_number,omitempty" validate:"omitempty,min=10,max=20"`
	Area         *string `json:"area,omitempty"`
	Location     *string `json:"location,omitempty"`
	Notes        *string `json:"notes,omitempty"`
}
