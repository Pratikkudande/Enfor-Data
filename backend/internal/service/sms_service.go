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

// MSG91Response represents MSG91 API response
type MSG91Response struct {
	Type    string `json:"type"`
	Message string `json:"message"`
	Code    string `json:"code"`
}

// SendSMS sends an SMS using MSG91
func (s *SMSService) SendSMS(to, message string) error {
	// Check if MSG91 is enabled
	if !s.config.MSG91.Enabled {
		fmt.Printf("\n=== SMS (DISABLED) ===\n")
		fmt.Printf("To: %s\n", to)
		fmt.Printf("Message: %s\n", message)
		fmt.Printf("Note: MSG91 is disabled. Enable it in config.env\n")
		fmt.Printf("=====================\n\n")
		return nil
	}

	// Validate configuration
	if s.config.MSG91.AuthKey == "" || s.config.MSG91.SenderID == "" {
		return fmt.Errorf("MSG91 configuration incomplete. Please set MSG91_AUTH_KEY and MSG91_SENDER_ID in config.env")
	}

	// Clean phone number (remove any non-digit characters except +)
	to = strings.TrimSpace(to)
	if strings.HasPrefix(to, "+") {
		to = to[1:] // Remove + prefix as MSG91 expects numbers without +
	}

	// MSG91 SMS API endpoint
	apiURL := "https://api.msg91.com/api/sendhttp.php"

	// Prepare form data
	data := url.Values{}
	data.Set("authkey", s.config.MSG91.AuthKey)
	data.Set("mobiles", to)
	data.Set("message", message)
	data.Set("sender", s.config.MSG91.SenderID)
	data.Set("route", s.config.MSG91.Route)
	data.Set("response", "json")

	// DLT_TE_ID is mandatory in India (TRAI regulation since 2021).
	// Without this, MSG91 accepts the message but telecom operators silently block delivery.
	if s.config.MSG91.TemplateID != "" {
		data.Set("DLT_TE_ID", s.config.MSG91.TemplateID)
	}

	// Create request
	req, err := http.NewRequest("POST", apiURL, strings.NewReader(data.Encode()))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

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
	fmt.Printf("\n=== MSG91 SMS ===\n")
	fmt.Printf("From: %s\n", s.config.MSG91.SenderID)
	fmt.Printf("To: %s\n", to)
	fmt.Printf("Message: %s\n", message)
	fmt.Printf("Route: %s\n", s.config.MSG91.Route)
	fmt.Printf("DLT_TE_ID: %s\n", s.config.MSG91.TemplateID)
	fmt.Printf("Time: %s\n", time.Now().Format("2006-01-02 15:04:05"))

	// Parse response
	var msg91Resp MSG91Response
	if err := json.Unmarshal(body, &msg91Resp); err != nil {
		// If JSON parsing fails, check if it's a simple success response
		bodyStr := string(body)
		fmt.Printf("Raw Response: %s\n", bodyStr)
		if resp.StatusCode == 200 && (strings.Contains(bodyStr, "success") || strings.Contains(bodyStr, "sent")) {
			fmt.Printf("Status: SUCCESS ✓\n")
			fmt.Printf("Response: %s\n", bodyStr)
			fmt.Printf("=================\n\n")
			return nil
		}

		fmt.Printf("Status: FAILED ✗\n")
		fmt.Printf("Error: Failed to parse response\n")
		fmt.Printf("Raw Response: %s\n", bodyStr)
		fmt.Printf("=================\n\n")
		return fmt.Errorf("failed to decode response: %w", err)
	}

	// Check response status
	if resp.StatusCode != 200 || msg91Resp.Type == "error" {
		errorMsg := msg91Resp.Message
		if errorMsg == "" {
			errorMsg = fmt.Sprintf("HTTP %d: %s", resp.StatusCode, string(body))
		}

		fmt.Printf("Status: FAILED ✗\n")
		fmt.Printf("Error: %s\n", errorMsg)
		fmt.Printf("Error Code: %s\n", msg91Resp.Code)
		fmt.Printf("=================\n\n")

		return fmt.Errorf("SMS delivery failed: %s", errorMsg)
	}

	fmt.Printf("Status: SUCCESS ✓\n")
	fmt.Printf("Message: %s\n", msg91Resp.Message)
	fmt.Printf("Code: %s\n", msg91Resp.Code)
	fmt.Printf("=================\n\n")

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
