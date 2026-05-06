package models

import (
	"time"
)

// OTPVerification represents an OTP verification record
type OTPVerification struct {
	ID           string  `json:"id" db:"id"`
	UserID       *string `json:"user_id" db:"user_id"`
	MobileNumber string  `json:"mobile_number" db:"mobile_number"`
	
	// OTP Details
	OTPCode    string `json:"-" db:"otp_code"` // Never expose in JSON
	OTPHash    string `json:"-" db:"otp_hash"` // Never expose in JSON
	Purpose    string `json:"purpose" db:"purpose"` // registration, login, password_reset
	
	// Status
	IsVerified    bool `json:"is_verified" db:"is_verified"`
	AttemptsCount int  `json:"attempts_count" db:"attempts_count"`
	MaxAttempts   int  `json:"max_attempts" db:"max_attempts"`
	
	// Expiry
	ExpiresAt  time.Time  `json:"expires_at" db:"expires_at"`
	VerifiedAt *time.Time `json:"verified_at" db:"verified_at"`
	
	// Rate Limiting & Security
	IPAddress *string `json:"-" db:"ip_address"` // Don't expose in JSON
	UserAgent *string `json:"-" db:"user_agent"` // Don't expose in JSON
	
	// Timestamps
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// IsExpired checks if OTP is expired
func (o *OTPVerification) IsExpired() bool {
	return time.Now().After(o.ExpiresAt)
}

// CanResend checks if OTP can be resent (60 seconds cooldown)
func (o *OTPVerification) CanResend() bool {
	return time.Since(o.CreatedAt) >= 60*time.Second
}

// HasAttemptsRemaining checks if there are attempts remaining
func (o *OTPVerification) HasAttemptsRemaining() bool {
	return o.AttemptsCount < o.MaxAttempts
}

// IncrementAttempts increments the attempts count
func (o *OTPVerification) IncrementAttempts() {
	o.AttemptsCount++
}

// OTP purpose constants
const (
	OTPPurposeRegistration  = "registration"
	OTPPurposeLogin         = "login"
	OTPPurposePasswordReset = "password_reset"
)

// OTP configuration constants
const (
	OTPLength         = 6
	OTPExpiryMinutes  = 10
	OTPMaxAttempts    = 5
	OTPResendCooldown = 60 // seconds
	OTPRateLimit      = 3  // max OTPs per 15 minutes
)

// SendOTPRequest represents request to send OTP
type SendOTPRequest struct {
	MobileNumber string `json:"mobile_number" binding:"required"`
	Purpose      string `json:"purpose" binding:"required,oneof=registration login password_reset"`
}

// VerifyOTPRequest represents request to verify OTP
type VerifyOTPRequest struct {
	OTPID        string `json:"otp_id" binding:"required"`
	MobileNumber string `json:"mobile_number" binding:"required"`
	OTPCode      string `json:"otp_code" binding:"required,len=6"`
}

// ResendOTPRequest represents request to resend OTP
type ResendOTPRequest struct {
	OTPID        string `json:"otp_id" binding:"required"`
	MobileNumber string `json:"mobile_number" binding:"required"`
}

// OTPResponse represents OTP send response
type OTPResponse struct {
	OTPID        string    `json:"otp_id"`
	MobileNumber string    `json:"mobile_number"`
	ExpiresAt    time.Time `json:"expires_at"`
	CanResendAt  time.Time `json:"can_resend_at"`
}

// OTPVerificationResponse represents OTP verification response
type OTPVerificationResponse struct {
	Verified       bool       `json:"verified"`
	UserID         string     `json:"user_id"`
	TrialActivated bool       `json:"trial_activated"`
	TrialEndsAt    *time.Time `json:"trial_ends_at,omitempty"`
}
