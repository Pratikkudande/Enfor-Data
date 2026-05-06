package service

import (
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"time"

	"enfor-data-backend/internal/models"
	"enfor-data-backend/internal/repository"
)

type MetaWhatsAppSetupService struct {
	repo   *repository.WhatsAppRepository
	client *http.Client
}

func NewMetaWhatsAppSetupService(repo *repository.WhatsAppRepository) *MetaWhatsAppSetupService {
	return &MetaWhatsAppSetupService{
		repo: repo,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Step 1: Initialize WhatsApp Business Setup
type BusinessSetupRequest struct {
	PhoneNumber         string `json:"phone_number"`
	BusinessName        string `json:"business_name"`
	BusinessDescription string `json:"business_description"`
	BusinessCategory    string `json:"business_category"`
	BusinessWebsite     string `json:"business_website"`
}

func (s *MetaWhatsAppSetupService) InitializeBusinessSetup(userID string, req *BusinessSetupRequest) (*models.WhatsAppAccount, error) {
	// Check if account already exists
	existing, err := s.repo.GetAccountByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing account: %w", err)
	}

	now := time.Now()
	verificationCode := generateVerificationCode()
	expiresAt := now.Add(10 * time.Minute) // Code expires in 10 minutes

	if existing != nil {
		// Update existing account
		existing.PhoneNumber = req.PhoneNumber
		existing.BusinessName = &req.BusinessName
		existing.BusinessDescription = &req.BusinessDescription
		existing.BusinessCategory = &req.BusinessCategory
		existing.BusinessWebsite = &req.BusinessWebsite
		existing.VerificationCode = &verificationCode
		existing.VerificationStatus = "pending"
		existing.VerificationExpiresAt = &expiresAt
		existing.Status = "not_connected"

		if err := s.repo.UpdateAccount(existing); err != nil {
			return nil, fmt.Errorf("failed to update account: %w", err)
		}

		return existing, nil
	}

	// Create new account
	account := &models.WhatsAppAccount{
		UserID:                userID,
		PhoneNumber:           req.PhoneNumber,
		BusinessName:          &req.BusinessName,
		BusinessDescription:   &req.BusinessDescription,
		BusinessCategory:      &req.BusinessCategory,
		BusinessWebsite:       &req.BusinessWebsite,
		VerificationCode:      &verificationCode,
		VerificationStatus:    "pending",
		VerificationExpiresAt: &expiresAt,
		Status:                "not_connected",
		MessageLimit:          1000,
		MessagesSentToday:     0,
	}

	if err := s.repo.CreateAccount(account); err != nil {
		return nil, fmt.Errorf("failed to create account: %w", err)
	}

	return account, nil
}

// Step 2: Request Phone Verification Code
func (s *MetaWhatsAppSetupService) RequestVerificationCode(userID string) (string, error) {
	account, err := s.repo.GetAccountByUserID(userID)
	if err != nil {
		return "", fmt.Errorf("failed to get account: %w", err)
	}

	if account == nil {
		return "", fmt.Errorf("account not found - please complete business setup first")
	}

	// Generate new verification code
	verificationCode := generateVerificationCode()
	expiresAt := time.Now().Add(10 * time.Minute)

	account.VerificationCode = &verificationCode
	account.VerificationExpiresAt = &expiresAt
	account.VerificationStatus = "pending"

	if err := s.repo.UpdateAccount(account); err != nil {
		return "", fmt.Errorf("failed to update account: %w", err)
	}

	// In production, this would send the code via SMS or WhatsApp
	// For now, we'll return it directly for testing
	fmt.Printf("\n=== VERIFICATION CODE ===\n")
	fmt.Printf("Phone: %s\n", account.PhoneNumber)
	fmt.Printf("Code: %s\n", verificationCode)
	fmt.Printf("Expires: %s\n", expiresAt.Format("2006-01-02 15:04:05"))
	fmt.Printf("========================\n\n")

	return verificationCode, nil
}

// Step 3: Verify Phone Number with Code
func (s *MetaWhatsAppSetupService) VerifyPhoneNumber(userID, code string) error {
	account, err := s.repo.GetAccountByUserID(userID)
	if err != nil {
		return fmt.Errorf("failed to get account: %w", err)
	}

	if account == nil {
		return fmt.Errorf("account not found")
	}

	if account.VerificationCode == nil || *account.VerificationCode != code {
		return fmt.Errorf("invalid verification code")
	}

	if account.VerificationExpiresAt != nil && time.Now().After(*account.VerificationExpiresAt) {
		return fmt.Errorf("verification code expired")
	}

	// Mark as verified
	account.VerificationStatus = "verified"
	account.VerificationCode = nil
	account.VerificationExpiresAt = nil

	if err := s.repo.UpdateAccount(account); err != nil {
		return fmt.Errorf("failed to update account: %w", err)
	}

	return nil
}

// Step 4: Connect to Meta WhatsApp API
type MetaAPICredentials struct {
	AccessToken       string `json:"access_token"`
	PhoneNumberID     string `json:"phone_number_id"`
	BusinessAccountID string `json:"business_account_id"`
	WABAID            string `json:"waba_id"`
}

func (s *MetaWhatsAppSetupService) ConnectMetaAPI(userID string, creds *MetaAPICredentials) error {
	account, err := s.repo.GetAccountByUserID(userID)
	if err != nil {
		return fmt.Errorf("failed to get account: %w", err)
	}

	if account == nil {
		return fmt.Errorf("account not found")
	}

	if account.VerificationStatus != "verified" {
		return fmt.Errorf("phone number not verified - please verify your phone number first")
	}

	// Validate the credentials by making a test API call
	if err := s.validateMetaCredentials(creds); err != nil {
		return fmt.Errorf("invalid Meta API credentials: %w", err)
	}

	// Store the credentials (in production, encrypt the access token)
	now := time.Now()
	account.AccessTokenEncrypted = &creds.AccessToken // TODO: Encrypt this
	account.PhoneNumberID = &creds.PhoneNumberID
	account.BusinessAccountID = &creds.BusinessAccountID
	account.MetaWABAID = &creds.WABAID
	account.Status = "connected"
	account.ConnectedAt = &now

	if err := s.repo.UpdateAccount(account); err != nil {
		return fmt.Errorf("failed to update account: %w", err)
	}

	return nil
}

// Validate Meta API credentials
func (s *MetaWhatsAppSetupService) validateMetaCredentials(creds *MetaAPICredentials) error {
	// Make a test API call to verify the credentials
	apiURL := fmt.Sprintf("https://graph.facebook.com/v18.0/%s", creds.PhoneNumberID)

	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", creds.AccessToken))

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("API validation failed: %s", string(body))
	}

	return nil
}

// Get Setup Status
func (s *MetaWhatsAppSetupService) GetSetupStatus(userID string) (map[string]interface{}, error) {
	account, err := s.repo.GetAccountByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get account: %w", err)
	}

	if account == nil {
		return map[string]interface{}{
			"step":      "business_setup",
			"completed": false,
			"message":   "Please complete business setup",
		}, nil
	}

	status := map[string]interface{}{
		"phone_number":    account.PhoneNumber,
		"business_name":   account.BusinessName,
		"status":          account.Status,
		"verification_status": account.VerificationStatus,
	}

	if account.VerificationStatus == "pending" {
		status["step"] = "phone_verification"
		status["completed"] = false
		status["message"] = "Please verify your phone number"
	} else if account.VerificationStatus == "verified" && account.Status != "connected" {
		status["step"] = "meta_api_connection"
		status["completed"] = false
		status["message"] = "Please connect your Meta WhatsApp API"
	} else if account.Status == "connected" {
		status["step"] = "completed"
		status["completed"] = true
		status["message"] = "Setup completed successfully"
	}

	return status, nil
}

// Helper: Generate 6-digit verification code
func generateVerificationCode() string {
	rand.Seed(time.Now().UnixNano())
	code := rand.Intn(900000) + 100000 // Generates 6-digit number
	return fmt.Sprintf("%06d", code)
}

// Resend Verification Code
func (s *MetaWhatsAppSetupService) ResendVerificationCode(userID string) (string, error) {
	return s.RequestVerificationCode(userID)
}
