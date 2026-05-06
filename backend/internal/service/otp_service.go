package service

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math/big"
	"time"

	"enfor-data-backend/internal/models"
	"enfor-data-backend/internal/repository"
)

type OTPService struct {
	otpRepo    *repository.OTPRepository
	userRepo   *repository.UserRepository
	smsService *SMSService
}

func NewOTPService(
	otpRepo *repository.OTPRepository,
	userRepo *repository.UserRepository,
	smsService *SMSService,
) *OTPService {
	return &OTPService{
		otpRepo:    otpRepo,
		userRepo:   userRepo,
		smsService: smsService,
	}
}

// SendOTP generates and sends an OTP to a mobile number
func (s *OTPService) SendOTP(mobileNumber, purpose, ipAddress, userAgent string) (*models.OTPResponse, error) {
	// Validate purpose
	if !isValidPurpose(purpose) {
		return nil, fmt.Errorf("invalid OTP purpose")
	}

	// Check rate limiting (max 3 OTPs per 15 minutes)
	count, err := s.otpRepo.CountRecentOTPs(mobileNumber, 15)
	if err != nil {
		return nil, fmt.Errorf("failed to check rate limit: %w", err)
	}
	if count >= models.OTPRateLimit {
		return nil, fmt.Errorf("too many OTP requests. Please try again after 15 minutes")
	}

	// Check if there's a recent OTP that can be resent
	latestOTP, err := s.otpRepo.GetLatestOTPByMobile(mobileNumber, purpose)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing OTP: %w", err)
	}

	// If there's a recent OTP that's not expired and was sent less than 60 seconds ago, don't send new one
	if latestOTP != nil && !latestOTP.IsExpired() && !latestOTP.CanResend() {
		secondsRemaining := 60 - int(time.Since(latestOTP.CreatedAt).Seconds())
		return nil, fmt.Errorf("please wait %d seconds before requesting a new OTP", secondsRemaining)
	}

	// Generate OTP code
	otpCode := generateOTP()

	// Hash OTP for storage
	otpHash := hashOTP(otpCode)

	// Get user ID if exists (for registration, user might not exist yet)
	var userID *string
	if purpose != models.OTPPurposeRegistration {
		user, err := s.userRepo.GetUserByMobile(mobileNumber)
		if err == nil && user != nil {
			userID = &user.ID
		}
	}

	// Create OTP record
	otp := &models.OTPVerification{
		UserID:        userID,
		MobileNumber:  mobileNumber,
		OTPCode:       otpCode,
		OTPHash:       otpHash,
		Purpose:       purpose,
		IsVerified:    false,
		AttemptsCount: 0,
		MaxAttempts:   models.OTPMaxAttempts,
		ExpiresAt:     time.Now().Add(time.Duration(models.OTPExpiryMinutes) * time.Minute),
		IPAddress:     &ipAddress,
		UserAgent:     &userAgent,
	}

	err = s.otpRepo.CreateOTP(otp)
	if err != nil {
		return nil, fmt.Errorf("failed to create OTP: %w", err)
	}

	// Send OTP via SMS
	message := fmt.Sprintf("Your OTP for %s is: %s. Valid for %d minutes. Do not share this code with anyone.", 
		purpose, otpCode, models.OTPExpiryMinutes)
	
	err = s.smsService.SendSMS(mobileNumber, message)
	if err != nil {
		return nil, fmt.Errorf("failed to send OTP SMS: %w", err)
	}

	// Return response
	response := &models.OTPResponse{
		OTPID:        otp.ID,
		MobileNumber: mobileNumber,
		ExpiresAt:    otp.ExpiresAt,
		CanResendAt:  otp.CreatedAt.Add(time.Duration(models.OTPResendCooldown) * time.Second),
	}

	return response, nil
}

// VerifyOTP verifies an OTP code
func (s *OTPService) VerifyOTP(otpID, mobileNumber, otpCode string) (*models.OTPVerificationResponse, error) {
	// Get OTP record
	otp, err := s.otpRepo.GetOTPByID(otpID)
	if err != nil {
		return nil, fmt.Errorf("invalid OTP ID")
	}

	// Verify mobile number matches
	if otp.MobileNumber != mobileNumber {
		return nil, fmt.Errorf("mobile number mismatch")
	}

	// Check if already verified
	if otp.IsVerified {
		return nil, fmt.Errorf("OTP already used")
	}

	// Check if expired
	if otp.IsExpired() {
		return nil, fmt.Errorf("OTP has expired")
	}

	// Check attempts
	if !otp.HasAttemptsRemaining() {
		return nil, fmt.Errorf("maximum verification attempts exceeded")
	}

	// Verify OTP code
	if !verifyOTP(otpCode, otp.OTPHash) {
		// Increment attempts
		s.otpRepo.IncrementAttempts(otpID)
		
		attemptsRemaining := otp.MaxAttempts - otp.AttemptsCount - 1
		if attemptsRemaining > 0 {
			return nil, fmt.Errorf("invalid OTP. %d attempts remaining", attemptsRemaining)
		}
		return nil, fmt.Errorf("invalid OTP. Maximum attempts exceeded")
	}

	// Mark OTP as verified
	err = s.otpRepo.MarkAsVerified(otpID)
	if err != nil {
		return nil, fmt.Errorf("failed to mark OTP as verified: %w", err)
	}

	// Handle post-verification actions based on purpose
	response := &models.OTPVerificationResponse{
		Verified: true,
	}

	switch otp.Purpose {
	case models.OTPPurposeRegistration:
		// Update user's mobile verification status
		if otp.UserID != nil {
			err = s.userRepo.UpdateMobileVerification(*otp.UserID, true)
			if err != nil {
				return nil, fmt.Errorf("failed to update mobile verification: %w", err)
			}
			response.UserID = *otp.UserID
			
			// TODO: Activate free trial subscription
			// This will be implemented in Phase 3
			response.TrialActivated = true
			trialEnd := time.Now().Add(15 * 24 * time.Hour)
			response.TrialEndsAt = &trialEnd
		}
	}

	return response, nil
}

// ResendOTP resends an OTP
func (s *OTPService) ResendOTP(otpID, mobileNumber string) (*models.OTPResponse, error) {
	// Get existing OTP
	otp, err := s.otpRepo.GetOTPByID(otpID)
	if err != nil {
		return nil, fmt.Errorf("invalid OTP ID")
	}

	// Verify mobile number matches
	if otp.MobileNumber != mobileNumber {
		return nil, fmt.Errorf("mobile number mismatch")
	}

	// Check if already verified
	if otp.IsVerified {
		return nil, fmt.Errorf("OTP already verified")
	}

	// Check if can resend (60 seconds cooldown)
	if !otp.CanResend() {
		secondsRemaining := 60 - int(time.Since(otp.CreatedAt).Seconds())
		return nil, fmt.Errorf("please wait %d seconds before resending OTP", secondsRemaining)
	}

	// Check rate limiting
	count, err := s.otpRepo.CountRecentOTPs(mobileNumber, 15)
	if err != nil {
		return nil, fmt.Errorf("failed to check rate limit: %w", err)
	}
	if count >= models.OTPRateLimit {
		return nil, fmt.Errorf("too many OTP requests. Please try again after 15 minutes")
	}

	// Generate new OTP code
	otpCode := generateOTP()
	otpHash := hashOTP(otpCode)

	// Create new OTP record
	newOTP := &models.OTPVerification{
		UserID:        otp.UserID,
		MobileNumber:  otp.MobileNumber,
		OTPCode:       otpCode,
		OTPHash:       otpHash,
		Purpose:       otp.Purpose,
		IsVerified:    false,
		AttemptsCount: 0,
		MaxAttempts:   models.OTPMaxAttempts,
		ExpiresAt:     time.Now().Add(time.Duration(models.OTPExpiryMinutes) * time.Minute),
		IPAddress:     otp.IPAddress,
		UserAgent:     otp.UserAgent,
	}

	err = s.otpRepo.CreateOTP(newOTP)
	if err != nil {
		return nil, fmt.Errorf("failed to create new OTP: %w", err)
	}

	// Send OTP via SMS
	message := fmt.Sprintf("Your OTP for %s is: %s. Valid for %d minutes. Do not share this code with anyone.", 
		otp.Purpose, otpCode, models.OTPExpiryMinutes)
	
	err = s.smsService.SendSMS(mobileNumber, message)
	if err != nil {
		return nil, fmt.Errorf("failed to send OTP SMS: %w", err)
	}

	// Return response
	response := &models.OTPResponse{
		OTPID:        newOTP.ID,
		MobileNumber: mobileNumber,
		ExpiresAt:    newOTP.ExpiresAt,
		CanResendAt:  newOTP.CreatedAt.Add(time.Duration(models.OTPResendCooldown) * time.Second),
	}

	return response, nil
}

// CleanupExpiredOTPs removes expired OTP records (should be run periodically)
func (s *OTPService) CleanupExpiredOTPs() error {
	return s.otpRepo.DeleteExpiredOTPs()
}

// Helper functions

// generateOTP generates a random 6-digit OTP
func generateOTP() string {
	max := big.NewInt(1000000)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		// Fallback to timestamp-based OTP if crypto/rand fails
		return fmt.Sprintf("%06d", time.Now().UnixNano()%1000000)
	}
	return fmt.Sprintf("%06d", n.Int64())
}

// hashOTP creates a SHA-256 hash of the OTP
func hashOTP(otp string) string {
	hash := sha256.Sum256([]byte(otp))
	return hex.EncodeToString(hash[:])
}

// verifyOTP verifies an OTP against its hash
func verifyOTP(otp, hash string) bool {
	return hashOTP(otp) == hash
}

// isValidPurpose checks if the OTP purpose is valid
func isValidPurpose(purpose string) bool {
	validPurposes := []string{
		models.OTPPurposeRegistration,
		models.OTPPurposeLogin,
		models.OTPPurposePasswordReset,
	}
	
	for _, valid := range validPurposes {
		if purpose == valid {
			return true
		}
	}
	return false
}
