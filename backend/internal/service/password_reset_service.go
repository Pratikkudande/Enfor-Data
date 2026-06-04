package service

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"sync"
	"time"

	"enfor-data-backend/internal/repository"
)

type otpEntry struct {
	otp       string
	expiresAt time.Time
}

type PasswordResetService struct {
	mu           sync.Mutex
	otps         map[string]otpEntry // key = email
	userRepo     *repository.UserRepository
	emailService *EmailService
}

func NewPasswordResetService(userRepo *repository.UserRepository, emailService *EmailService) *PasswordResetService {
	s := &PasswordResetService{
		otps:         make(map[string]otpEntry),
		userRepo:     userRepo,
		emailService: emailService,
	}
	go s.cleanupLoop()
	return s
}

// SendOTP generates a 6-digit OTP and emails it to the user
func (s *PasswordResetService) SendOTP(email string) error {
	// Verify user exists — silently succeed if not to prevent enumeration
	_, err := s.userRepo.GetUserByEmail(email)
	if err != nil {
		return nil
	}

	otp, err := generateNumericOTP()
	if err != nil {
		return fmt.Errorf("failed to generate OTP")
	}

	s.mu.Lock()
	s.otps[email] = otpEntry{otp: otp, expiresAt: time.Now().Add(10 * time.Minute)}
	s.mu.Unlock()

	// Print to console as fallback when Resend not configured
	fmt.Printf("[EMAIL OTP] %s → %s\n", email, otp)

	return s.emailService.SendOTPEmail(email, otp)
}

// VerifyOTP checks the OTP for a given email (does NOT consume it — reset call will)
func (s *PasswordResetService) VerifyOTP(email, otp string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	entry, ok := s.otps[email]
	if !ok {
		return fmt.Errorf("invalid or expired OTP")
	}
	if time.Now().After(entry.expiresAt) {
		delete(s.otps, email)
		return fmt.Errorf("OTP has expired")
	}
	if entry.otp != otp {
		return fmt.Errorf("incorrect OTP")
	}
	return nil
}

// ConsumeOTP verifies and removes the OTP (used during password reset)
func (s *PasswordResetService) ConsumeOTP(email, otp string) error {
	if err := s.VerifyOTP(email, otp); err != nil {
		return err
	}
	s.mu.Lock()
	delete(s.otps, email)
	s.mu.Unlock()
	return nil
}

func generateNumericOTP() (string, error) {
	max := big.NewInt(1000000)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

func (s *PasswordResetService) cleanupLoop() {
	for range time.Tick(5 * time.Minute) {
		s.mu.Lock()
		for email, entry := range s.otps {
			if time.Now().After(entry.expiresAt) {
				delete(s.otps, email)
			}
		}
		s.mu.Unlock()
	}
}
