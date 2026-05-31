package dto

// CreateBuildingContactRequest is the payload for creating a building contact.
// Only mobile_number is operationally required (for duplicate detection).
type CreateBuildingContactRequest struct {
	OwnerName    *string `json:"owner_name,omitempty"`
	MobileNumber string  `json:"mobile_number" validate:"required,min=10,max=20"`
	BuildingName *string `json:"building_name,omitempty"`
	Area         *string `json:"area,omitempty"`
	Notes        *string `json:"notes,omitempty"`
}

// UpdateBuildingContactRequest allows partial updates to a building contact.
type UpdateBuildingContactRequest struct {
	OwnerName    *string `json:"owner_name,omitempty"`
	MobileNumber *string `json:"mobile_number,omitempty" validate:"omitempty,min=10,max=20"`
	BuildingName *string `json:"building_name,omitempty"`
	Area         *string `json:"area,omitempty"`
	Notes        *string `json:"notes,omitempty"`
}
