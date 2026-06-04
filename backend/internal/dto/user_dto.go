package dto

import (
	"time"
	"enfor-data-backend/internal/models"
)

// SignupRequest represents the data required for user registration
type SignupRequest struct {
	// Basic Information
	FirstName   string `json:"first_name" validate:"required,min=2,max=100"`
	LastName    string `json:"last_name" validate:"required,min=2,max=100"`
	Email       string `json:"email" validate:"required,email"`
	Password    string `json:"password" validate:"required,min=6"`
	DateOfBirth string `json:"date_of_birth" validate:"required"` // Will be parsed to time.Time

	// Business Information
	FirmName string `json:"firm_name" validate:"required,min=2,max=255"`
	Role     string `json:"role" validate:"required,oneof=broker channel_partner"`

	// Contact Information
	WhatsappNumber    string `json:"whatsapp_number" validate:"required,min=10,max=20"`
	AlternativeNumber string `json:"alternative_number,omitempty"`
	ForeignNumber     string `json:"foreign_number,omitempty"`

	// Address Information
	Address    string `json:"address" validate:"required,min=10"`
	Location   string `json:"location" validate:"required,min=2,max=255"`
	City       string `json:"city" validate:"required,min=2,max=100"`
	State      string `json:"state" validate:"required,min=2,max=100"`
	PostalCode string `json:"postal_code" validate:"required,min=4,max=20"`
}

// LoginRequest represents the data required for user login
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// LoginResponse represents the response after successful login
type LoginResponse struct {
	Token        string      `json:"token"`
	RefreshToken string      `json:"refresh_token"`
	User         PublicUser `json:"user"`
}

// RefreshRequest represents the data required to refresh an access token
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// PublicUser represents user data that can be safely returned to the client
type PublicUser struct {
	ID                string    `json:"id"`
	FirstName         string    `json:"first_name"`
	LastName          string    `json:"last_name"`
	Name              string    `json:"name"` // Computed field: FirstName + LastName
	Email             string    `json:"email"`
	FirmName          string    `json:"firm_name"`
	CompanyName       string    `json:"company_name"` // Alias for FirmName
	Role              string    `json:"role"`
	WhatsappNumber    string    `json:"whatsapp_number"`
	Phone             string    `json:"phone"` // Alias for WhatsappNumber
	AlternativeNumber *string   `json:"alternative_number,omitempty"`
	ForeignNumber     *string   `json:"foreign_number,omitempty"`
	Address           string    `json:"address"`
	City              string    `json:"city"`
	State             string    `json:"state"`
	Bio               *string   `json:"bio,omitempty"`
	YearsExperience   *int      `json:"years_experience,omitempty"`
	Specializations   *string   `json:"specializations,omitempty"`
	IsVerified        bool      `json:"is_verified"`
	ProfileImage      *string   `json:"profile_image"`
	CreatedAt         time.Time `json:"created_at"`
}

// ToPublicUser converts a User to PublicUser (removes sensitive information)
func ToPublicUser(u *models.User) PublicUser {
	return PublicUser{
		ID:                u.ID,
		FirstName:         u.FirstName,
		LastName:          u.LastName,
		Name:              u.FirstName + " " + u.LastName,
		Email:             u.Email,
		FirmName:          u.FirmName,
		CompanyName:       u.FirmName, // Alias
		Role:              u.Role,
		WhatsappNumber:    u.WhatsappNumber,
		Phone:             u.WhatsappNumber, // Alias
		AlternativeNumber: u.AlternativeNumber,
		ForeignNumber:     u.ForeignNumber,
		Address:           u.Address,
		City:              u.City,
		State:             u.State,
		Bio:               u.Bio,
		YearsExperience:   u.YearsExperience,
		Specializations:   u.Specializations,
		IsVerified:        u.IsVerified,
		ProfileImage:      u.ProfileImage,
		CreatedAt:         u.CreatedAt,
	}
}
// UpdateProfileRequest represents the data for updating user profile
type UpdateProfileRequest struct {
	Name           *string `json:"name,omitempty"`
	Phone          *string `json:"phone,omitempty"`
	Address        *string `json:"address,omitempty"`
	Bio            *string `json:"bio,omitempty"`
	Company        *string `json:"company,omitempty"`
	Experience     *string `json:"experience,omitempty"`
	Specialization *string `json:"specialization,omitempty"`
}

// ChangePasswordRequest represents the data for changing user password
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=6"`
}