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
	Token string      `json:"token"`
	User  PublicUser `json:"user"`
}

// PublicUser represents user data that can be safely returned to the client
type PublicUser struct {
	ID           string    `json:"id"`
	FirstName    string    `json:"first_name"`
	LastName     string    `json:"last_name"`
	Email        string    `json:"email"`
	FirmName     string    `json:"firm_name"`
	Role         string    `json:"role"`
	City         string    `json:"city"`
	State        string    `json:"state"`
	IsVerified   bool      `json:"is_verified"`
	ProfileImage *string   `json:"profile_image"`
	CreatedAt    time.Time `json:"created_at"`
}

// ToPublicUser converts a User to PublicUser (removes sensitive information)
func ToPublicUser(u *models.User) PublicUser {
	return PublicUser{
		ID:           u.ID,
		FirstName:    u.FirstName,
		LastName:     u.LastName,
		Email:        u.Email,
		FirmName:     u.FirmName,
		Role:         u.Role,
		City:         u.City,
		State:        u.State,
		IsVerified:   u.IsVerified,
		ProfileImage: u.ProfileImage,
		CreatedAt:    u.CreatedAt,
	}
}
