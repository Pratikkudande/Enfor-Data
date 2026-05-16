package dto

// CreateAgreementRequest is the payload for POST /api/agreements
type CreateAgreementRequest struct {
	PropertyID string  `json:"property_id" validate:"required,uuid"`
	ClientID   *string `json:"client_id,omitempty" validate:"omitempty,uuid"`
	StartDate  string  `json:"start_date"  validate:"required"`
	EndDate    string  `json:"end_date"    validate:"required"`
}

// UpdateAgreementRequest is the payload for PUT /api/agreements/:id
// Only status can be updated (e.g. terminate an agreement)
type UpdateAgreementRequest struct {
	Status string `json:"status" validate:"required,oneof=active expired terminated"`
}
