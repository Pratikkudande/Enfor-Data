package models

import (
	"time"
)

type User struct {
	ID string `json:"id" db:"id"`

	// Basic Information
	FirstName    string     `json:"first_name" db:"first_name"`
	LastName     string     `json:"last_name" db:"last_name"`
	Email        string     `json:"email" db:"email"`
	PasswordHash string     `json:"-" db:"password_hash"` // Never return password in JSON
	DateOfBirth  *time.Time `json:"date_of_birth" db:"date_of_birth"`

	// Business Information
	FirmName string `json:"firm_name" db:"firm_name"`
	Role     string `json:"role" db:"role"`

	// Contact Information
	WhatsappNumber    string  `json:"whatsapp_number" db:"whatsapp_number"`
	AlternativeNumber *string `json:"alternative_number" db:"alternative_number"`
	ForeignNumber     *string `json:"foreign_number" db:"foreign_number"`

	// Address Information
	Address    string `json:"address" db:"address"`
	Location   string `json:"location" db:"location"`
	City       string `json:"city" db:"city"`
	State      string `json:"state" db:"state"`
	PostalCode string `json:"postal_code" db:"postal_code"`

	// Profile
	ProfileImage *string `json:"profile_image" db:"profile_image"`

	// Status and Verification
	IsVerified bool `json:"is_verified" db:"is_verified"`
	IsActive   bool `json:"is_active" db:"is_active"`

	// Timestamps
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

