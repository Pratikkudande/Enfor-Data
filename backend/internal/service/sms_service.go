package service

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"enfor-data-backend/internal/config"
)

type SMSService struct {
	config *config.Config
	client *http.Client
}

func NewSMSService(cfg *config.Config) *SMSService {
	return &SMSService{
		config: cfg,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// TwilioResponse represents Twilio API response
type TwilioResponse struct {
	SID          string `json:"sid"`
	Status       string `json:"status"`
	ErrorCode    int    `json:"error_code"`
	ErrorMessage string `json:"error_message"`
}

// SendSMS sends an SMS using Twilio
func (s *SMSService) SendSMS(to, message string) error {
	// Check if Twilio is enabled
	if !s.config.Twilio.Enabled {
		fmt.Printf("\n=== SMS (DISABLED) ===\n")
		fmt.Printf("To: %s\n", to)
		fmt.Printf("Message: %s\n", message)
		fmt.Printf("Note: Twilio is disabled. Enable it in config.env\n")
		fmt.Printf("=====================\n\n")
		return nil
	}

	// Validate configuration
	if s.config.Twilio.AccountSID == "" || s.config.Twilio.AuthToken == "" || s.config.Twilio.FromNumber == "" {
		return fmt.Errorf("Twilio configuration incomplete. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER in config.env")
	}

	// Twilio API endpoint
	apiURL := fmt.Sprintf("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", s.config.Twilio.AccountSID)

	// Prepare form data
	data := url.Values{}
	data.Set("From", s.config.Twilio.FromNumber)
	data.Set("To", to)
	data.Set("Body", message)

	// Create request
	req, err := http.NewRequest("POST", apiURL, strings.NewReader(data.Encode()))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.SetBasicAuth(s.config.Twilio.AccountSID, s.config.Twilio.AuthToken)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	// Send request
	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response: %w", err)
	}

	// Log the SMS details
	fmt.Printf("\n=== TWILIO SMS ===\n")
	fmt.Printf("From: %s\n", s.config.Twilio.FromNumber)
	fmt.Printf("To: %s\n", to)
	fmt.Printf("Message: %s\n", message)
	fmt.Printf("Time: %s\n", time.Now().Format("2006-01-02 15:04:05"))

	// Parse response
	var twilioResp TwilioResponse
	if err := json.Unmarshal(body, &twilioResp); err != nil {
		fmt.Printf("Status: FAILED ✗\n")
		fmt.Printf("Error: Failed to parse response\n")
		fmt.Printf("==================\n\n")
		return fmt.Errorf("failed to decode response: %w", err)
	}

	// Check response status
	if resp.StatusCode != 201 && resp.StatusCode != 200 {
		errorMsg := twilioResp.ErrorMessage
		if errorMsg == "" {
			errorMsg = fmt.Sprintf("HTTP %d: %s", resp.StatusCode, string(body))
		}

		fmt.Printf("Status: FAILED ✗\n")
		fmt.Printf("Error: %s\n", errorMsg)
		fmt.Printf("==================\n\n")

		return fmt.Errorf("SMS delivery failed: %s", errorMsg)
	}

	fmt.Printf("Status: SUCCESS ✓\n")
	fmt.Printf("Message SID: %s\n", twilioResp.SID)
	fmt.Printf("Twilio Status: %s\n", twilioResp.Status)
	fmt.Printf("==================\n\n")

	return nil
}

// SendAppointmentConfirmation sends appointment confirmation SMS
func (s *SMSService) SendAppointmentConfirmation(clientPhone, clientName, appointmentTitle, appointmentDate, appointmentTime, brokerName string) error {
	message := fmt.Sprintf(
		"Hi %s! Your appointment '%s' has been scheduled for %s at %s with %s. We look forward to seeing you!",
		clientName,
		appointmentTitle,
		appointmentDate,
		appointmentTime,
		brokerName,
	)

	return s.SendSMS(clientPhone, message)
}

// SendAppointmentReminder sends appointment reminder SMS (1 hour before)
func (s *SMSService) SendAppointmentReminder(clientPhone, clientName, appointmentTitle, appointmentTime, brokerName string) error {
	message := fmt.Sprintf(
		"Reminder: Hi %s! Your appointment '%s' is scheduled in 1 hour at %s with %s. See you soon!",
		clientName,
		appointmentTitle,
		appointmentTime,
		brokerName,
	)

	return s.SendSMS(clientPhone, message)
}

// SendAppointmentCancellation sends appointment cancellation SMS
func (s *SMSService) SendAppointmentCancellation(clientPhone, clientName, appointmentTitle string) error {
	message := fmt.Sprintf(
		"Hi %s, your appointment '%s' has been cancelled. Please contact us if you have any questions.",
		clientName,
		appointmentTitle,
	)

	return s.SendSMS(clientPhone, message)
}

// SendAppointmentUpdate sends appointment update SMS
func (s *SMSService) SendAppointmentUpdate(clientPhone, clientName, appointmentTitle, newDate, newTime string) error {
	message := fmt.Sprintf(
		"Hi %s, your appointment '%s' has been rescheduled to %s at %s. Thank you!",
		clientName,
		appointmentTitle,
		newDate,
		newTime,
	)

	return s.SendSMS(clientPhone, message)
}
