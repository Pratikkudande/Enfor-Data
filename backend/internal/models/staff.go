package models

import "time"

// StaffMember represents an available staff member or a recruitment requirement.
type StaffMember struct {
	ID              string  `json:"id" db:"id"`
	UserID          string  `json:"user_id" db:"user_id"`
	Type            string  `json:"type" db:"type"`   // available | required
	FirstName       string  `json:"first_name" db:"first_name"`
	LastName        string  `json:"last_name" db:"last_name"`
	Phone           string  `json:"phone" db:"phone"`
	Email           string  `json:"email" db:"email"`
	Role            string  `json:"role" db:"role"`
	ExperienceYears int     `json:"experience_years" db:"experience_years"`
	Status          string  `json:"status" db:"status"` // available | employed | inactive
	Location        string  `json:"location" db:"location"`
	Address         string  `json:"address" db:"address"`
	Description     string  `json:"description" db:"description"`
	ResumeURL       *string `json:"resume_url,omitempty" db:"resume_url"`
	PhotoURL        *string `json:"photo_url,omitempty" db:"photo_url"`

	// Denormalized poster info
	PosterName *string `json:"poster_name,omitempty" db:"poster_name"`

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}
