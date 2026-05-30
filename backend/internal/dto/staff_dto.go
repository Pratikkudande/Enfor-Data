package dto

// CreateStaffRequest is the payload for creating a staff listing.
type CreateStaffRequest struct {
	Type            string  `json:"type" validate:"required,oneof=available required"`
	FirstName       string  `json:"first_name" validate:"required,min=2,max=100"`
	LastName        string  `json:"last_name" validate:"omitempty,max=100"`
	Phone           string  `json:"phone" validate:"omitempty,max=20"`
	Email           string  `json:"email" validate:"omitempty,email"`
	Role            string  `json:"role" validate:"required,min=2,max=100"`
	ExperienceYears int     `json:"experience_years" validate:"omitempty,min=0,max=50"`
	Status          string  `json:"status" validate:"omitempty,oneof=available employed inactive"`
	Location        string  `json:"location" validate:"required,min=2,max=255"`
	Address         string  `json:"address" validate:"omitempty"`
	Description     string  `json:"description" validate:"omitempty"`
	ResumeURL       *string `json:"resume_url,omitempty"`
	PhotoURL        *string `json:"photo_url,omitempty"`
}

// UpdateStaffRequest allows partial updates.
type UpdateStaffRequest struct {
	FirstName       *string `json:"first_name,omitempty" validate:"omitempty,min=2,max=100"`
	LastName        *string `json:"last_name,omitempty" validate:"omitempty,max=100"`
	Phone           *string `json:"phone,omitempty" validate:"omitempty,max=20"`
	Email           *string `json:"email,omitempty" validate:"omitempty,email"`
	Role            *string `json:"role,omitempty" validate:"omitempty,min=2,max=100"`
	ExperienceYears *int    `json:"experience_years,omitempty" validate:"omitempty,min=0,max=50"`
	Status          *string `json:"status,omitempty" validate:"omitempty,oneof=available employed inactive"`
	Location        *string `json:"location,omitempty" validate:"omitempty,min=2,max=255"`
	Address         *string `json:"address,omitempty"`
	Description     *string `json:"description,omitempty"`
	ResumeURL       *string `json:"resume_url,omitempty"`
	PhotoURL        *string `json:"photo_url,omitempty"`
}
