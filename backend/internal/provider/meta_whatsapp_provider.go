package provider

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// MetaWhatsAppProvider implements WhatsApp Cloud API from Meta
type MetaWhatsAppProvider struct {
	phoneNumberID string // WhatsApp Phone Number ID
	accessToken   string // User's access token
	apiVersion    string // API version (e.g., "v18.0")
	client        *http.Client
}

// NewMetaWhatsAppProvider creates a new Meta WhatsApp provider
func NewMetaWhatsAppProvider(phoneNumberID, accessToken string) *MetaWhatsAppProvider {
	return &MetaWhatsAppProvider{
		phoneNumberID: phoneNumberID,
		accessToken:   accessToken,
		apiVersion:    "v18.0", // Latest stable version
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// MetaMessageRequest represents the request body for sending a message
type MetaMessageRequest struct {
	MessagingProduct string `json:"messaging_product"`
	RecipientType    string `json:"recipient_type"`
	To               string `json:"to"`
	Type             string `json:"type"`
	Text             struct {
		PreviewURL bool   `json:"preview_url"`
		Body       string `json:"body"`
	} `json:"text"`
}

// MetaMessageResponse represents Meta API response
type MetaMessageResponse struct {
	MessagingProduct string `json:"messaging_product"`
	Contacts         []struct {
		Input string `json:"input"`
		WaID  string `json:"wa_id"`
	} `json:"contacts"`
	Messages []struct {
		ID string `json:"id"`
	} `json:"messages"`
}

// MetaErrorResponse represents Meta API error response
type MetaErrorResponse struct {
	Error struct {
		Message      string `json:"message"`
		Type         string `json:"type"`
		Code         int    `json:"code"`
		ErrorSubcode int    `json:"error_subcode"`
		FBTraceID    string `json:"fbtrace_id"`
	} `json:"error"`
}

func (p *MetaWhatsAppProvider) SendMessage(to string, message string) (*MessageResult, error) {
	// Remove any "whatsapp:" prefix if present
	to = cleanPhoneNumber(to)

	// Construct API URL
	apiURL := fmt.Sprintf("https://graph.facebook.com/%s/%s/messages", p.apiVersion, p.phoneNumberID)

	// Prepare request body
	reqBody := MetaMessageRequest{
		MessagingProduct: "whatsapp",
		RecipientType:    "individual",
		To:               to,
		Type:             "text",
	}
	reqBody.Text.PreviewURL = false
	reqBody.Text.Body = message

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Create HTTP request
	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", p.accessToken))

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

	// Log the message details
	fmt.Printf("\n=== META WHATSAPP MESSAGE ===\n")
	fmt.Printf("Phone Number ID: %s\n", p.phoneNumberID)
	fmt.Printf("To: %s\n", to)
	fmt.Printf("Message: %s\n", message)
	fmt.Printf("Time: %s\n", time.Now().Format("2006-01-02 15:04:05"))

	// Check for errors
	if resp.StatusCode != 200 && resp.StatusCode != 201 {
		var errorResp MetaErrorResponse
		if err := json.Unmarshal(body, &errorResp); err == nil && errorResp.Error.Message != "" {
			fmt.Printf("Status: FAILED ✗\n")
			fmt.Printf("Error: %s (Code: %d)\n", errorResp.Error.Message, errorResp.Error.Code)
			fmt.Printf("Trace ID: %s\n", errorResp.Error.FBTraceID)
			fmt.Printf("============================\n\n")

			return &MessageResult{
				Status: "failed",
				Error:  fmt.Sprintf("%s (Code: %d)", errorResp.Error.Message, errorResp.Error.Code),
			}, nil
		}

		fmt.Printf("Status: FAILED ✗\n")
		fmt.Printf("HTTP Error: %d - %s\n", resp.StatusCode, string(body))
		fmt.Printf("============================\n\n")

		return &MessageResult{
			Status: "failed",
			Error:  fmt.Sprintf("HTTP %d: %s", resp.StatusCode, string(body)),
		}, nil
	}

	// Parse success response
	var metaResp MetaMessageResponse
	if err := json.Unmarshal(body, &metaResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if len(metaResp.Messages) == 0 {
		fmt.Printf("Status: FAILED ✗\n")
		fmt.Printf("Error: No message ID returned\n")
		fmt.Printf("============================\n\n")

		return &MessageResult{
			Status: "failed",
			Error:  "No message ID returned from Meta API",
		}, nil
	}

	messageID := metaResp.Messages[0].ID

	fmt.Printf("Status: SUCCESS ✓\n")
	fmt.Printf("Message ID: %s\n", messageID)
	fmt.Printf("============================\n\n")

	return &MessageResult{
		MessageID: messageID,
		Status:    "sent",
	}, nil
}

func (p *MetaWhatsAppProvider) SendBulkMessages(recipients []Recipient, message string) ([]*MessageResult, error) {
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

		// Rate limiting: Meta recommends 80 messages per second for Cloud API
		// We'll be conservative with 1 message per second
		if i < len(recipients)-1 {
			time.Sleep(1 * time.Second)
		}
	}

	return results, nil
}

func (p *MetaWhatsAppProvider) GetAccountStatus() (*AccountStatus, error) {
	// Query Meta API for phone number details
	apiURL := fmt.Sprintf("https://graph.facebook.com/%s/%s", p.apiVersion, p.phoneNumberID)

	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", p.accessToken))

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("API error: %s", string(body))
	}

	var phoneInfo struct {
		VerifiedName    string `json:"verified_name"`
		DisplayPhoneNumber string `json:"display_phone_number"`
		QualityRating   string `json:"quality_rating"`
	}

	if err := json.Unmarshal(body, &phoneInfo); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &AccountStatus{
		Connected:    true,
		PhoneNumber:  phoneInfo.DisplayPhoneNumber,
		MessageLimit: 1000, // Meta Cloud API free tier: 1000 messages/month
		MessagesUsed: 0,    // Would need to track separately
		DisplayName:  phoneInfo.VerifiedName,
	}, nil
}

func (p *MetaWhatsAppProvider) VerifyWebhook(token string) bool {
	// Implement webhook verification for Meta
	// This is used when Meta sends webhook events
	return true
}

func (p *MetaWhatsAppProvider) HandleWebhook(payload []byte) error {
	// Handle incoming webhook events from Meta
	// This would update message delivery status, read receipts, etc.
	return nil
}

// Helper function to clean phone numbers
func cleanPhoneNumber(phone string) string {
	// Remove "whatsapp:" prefix if present
	if len(phone) > 9 && phone[:9] == "whatsapp:" {
		phone = phone[9:]
	}
	// Remove any spaces, dashes, or parentheses
	cleaned := ""
	for _, char := range phone {
		if char >= '0' && char <= '9' || char == '+' {
			cleaned += string(char)
		}
	}
	return cleaned
}
