package provider

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type TwilioProvider struct {
	accountSID string
	authToken  string
	fromNumber string // Your Twilio WhatsApp number (e.g., "whatsapp:+14155238886")
	client     *http.Client
}

func NewTwilioProvider(accountSID, authToken, fromNumber string) *TwilioProvider {
	// Ensure fromNumber has whatsapp: prefix
	if !strings.HasPrefix(fromNumber, "whatsapp:") {
		fromNumber = "whatsapp:" + fromNumber
	}

	return &TwilioProvider{
		accountSID: accountSID,
		authToken:  authToken,
		fromNumber: fromNumber,
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
	Message      string `json:"message"`
}

func (p *TwilioProvider) SendMessage(to string, message string) (*MessageResult, error) {
	// Ensure phone number has whatsapp: prefix
	if !strings.HasPrefix(to, "whatsapp:") {
		to = "whatsapp:" + to
	}

	// Twilio API endpoint
	apiURL := fmt.Sprintf("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", p.accountSID)

	// Prepare form data
	data := url.Values{}
	data.Set("From", p.fromNumber)
	data.Set("To", to)
	data.Set("Body", message)

	// Create request
	req, err := http.NewRequest("POST", apiURL, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.SetBasicAuth(p.accountSID, p.authToken)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	// Send request
	resp, err := p.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	// Parse response
	var twilioResp TwilioResponse
	if err := json.Unmarshal(body, &twilioResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	// Log the message details
	fmt.Printf("\n=== TWILIO WHATSAPP MESSAGE ===\n")
	fmt.Printf("From: %s\n", p.fromNumber)
	fmt.Printf("To: %s\n", to)
	fmt.Printf("Message: %s\n", message)
	fmt.Printf("Time: %s\n", time.Now().Format("2006-01-02 15:04:05"))

	// Check response status
	if resp.StatusCode != 201 && resp.StatusCode != 200 {
		errorMsg := twilioResp.ErrorMessage
		if errorMsg == "" {
			errorMsg = twilioResp.Message
		}
		if errorMsg == "" {
			errorMsg = fmt.Sprintf("HTTP %d: %s", resp.StatusCode, string(body))
		}

		fmt.Printf("Status: FAILED ✗\n")
		fmt.Printf("Error: %s\n", errorMsg)
		fmt.Printf("==============================\n\n")

		return &MessageResult{
			Status: "failed",
			Error:  errorMsg,
		}, nil
	}

	fmt.Printf("Status: SUCCESS ✓\n")
	fmt.Printf("Message SID: %s\n", twilioResp.SID)
	fmt.Printf("Twilio Status: %s\n", twilioResp.Status)
	fmt.Printf("==============================\n\n")

	return &MessageResult{
		MessageID: twilioResp.SID,
		Status:    "sent",
	}, nil
}

func (p *TwilioProvider) SendBulkMessages(recipients []Recipient, message string) ([]*MessageResult, error) {
	results := make([]*MessageResult, len(recipients))

	for i, recipient := range recipients {
		result, err := p.SendMessage(recipient.Phone, message)
		if err != nil {
			results[i] = &MessageResult{
				Status: "failed",
				Error:  err.Error(),
			}
		} else {
			results[i] = result
		}

		// Rate limiting: Twilio recommends 1 message per second
		if i < len(recipients)-1 {
			time.Sleep(1 * time.Second)
		}
	}

	return results, nil
}

func (p *TwilioProvider) GetAccountStatus() (*AccountStatus, error) {
	// For now, return a basic status
	// You can implement a real Twilio account status check if needed
	return &AccountStatus{
		Connected:    true,
		PhoneNumber:  strings.TrimPrefix(p.fromNumber, "whatsapp:"),
		MessageLimit: 10000, // Adjust based on your Twilio plan
		MessagesUsed: 0,     // Would need to query Twilio API for actual usage
		DisplayName:  "Twilio WhatsApp",
	}, nil
}

func (p *TwilioProvider) VerifyWebhook(token string) bool {
	// Implement Twilio webhook verification if needed
	// For now, return true
	return true
}

func (p *TwilioProvider) HandleWebhook(payload []byte) error {
	// Implement Twilio webhook handling for delivery status updates
	// This would update message status in your database
	return nil
}
