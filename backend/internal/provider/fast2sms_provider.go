package provider

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type Fast2SMSProvider struct {
	authKey    string
	senderID   string
	route      string
	templateID string // DLT template ID required by TRAI for India
	client     *http.Client
}

func NewFast2SMSProvider(authKey, senderID, route string) *Fast2SMSProvider {
	return &Fast2SMSProvider{
		authKey:  authKey,
		senderID: senderID,
		route:    route,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func NewFast2SMSProviderWithTemplate(authKey, senderID, route, templateID string) *Fast2SMSProvider {
	return &Fast2SMSProvider{
		authKey:    authKey,
		senderID:   senderID,
		route:      route,
		templateID: templateID,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Fast2SMSResponse represents Fast2SMS API response
type Fast2SMSResponse struct {
	Return    bool     `json:"return"`
	RequestID string   `json:"request_id"`
	Message   []string `json:"message"`
}

func (p *Fast2SMSProvider) SendMessage(to string, message string) (*MessageResult, error) {
	// Clean phone number (remove any non-digit characters except +)
	to = strings.TrimSpace(to)
	if strings.HasPrefix(to, "+91") {
		to = to[3:] // Remove +91 prefix
	} else if strings.HasPrefix(to, "+") {
		to = to[1:] // Remove + prefix
	}

	// Fast2SMS DLT SMS (Single) is a JSON POST to /dev/bulkV2.
	// Its response contains the request_id used later by /dev/dlr/{request_id}.
	payload := map[string]string{
		"route": p.route, "sender_id": p.senderID, "numbers": to,
	}
	if p.route == "dlt" && p.templateID != "" {
		payload["message"] = p.templateID
		payload["variables_values"] = p.extractVariables(message)
	} else {
		payload["message"] = message
	}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to encode Fast2SMS request: %w", err)
	}
	req, err := http.NewRequest(http.MethodPost, "https://www.fast2sms.com/dev/bulkV2", bytes.NewReader(payloadBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set authorization header
	req.Header.Set("Authorization", p.authKey)
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/json")

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
	fmt.Printf("\n=== Fast2SMS ===\n")
	fmt.Printf("From: %s\n", p.senderID)
	fmt.Printf("To: %s\n", to)
	fmt.Printf("Message: %s\n", message)
	fmt.Printf("Route: %s\n", p.route)
	if p.templateID != "" {
		fmt.Printf("Template ID: %s\n", p.templateID)
	}
	fmt.Printf("Time: %s\n", time.Now().Format("2006-01-02 15:04:05"))

	// Parse response
	var fast2smsResp Fast2SMSResponse
	if err := json.Unmarshal(body, &fast2smsResp); err != nil {
		bodyStr := string(body)
		fmt.Printf("Status: FAILED ✗\n")
		fmt.Printf("Error: Fast2SMS did not return a valid JSON request_id\n")
		fmt.Printf("Raw Response: %s\n", bodyStr)
		fmt.Printf("================\n\n")
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	// Check response status
	if resp.StatusCode != 200 || !fast2smsResp.Return {
		errorMsg := "Failed to send SMS"
		if len(fast2smsResp.Message) > 0 {
			errorMsg = strings.Join(fast2smsResp.Message, ", ")
		}

		fmt.Printf("Status: FAILED ✗\n")
		fmt.Printf("Error: %s\n", errorMsg)
		fmt.Printf("================\n\n")

		return &MessageResult{
			Status: "failed",
			Error:  errorMsg,
		}, nil
	}
	if strings.TrimSpace(fast2smsResp.RequestID) == "" {
		return nil, fmt.Errorf("Fast2SMS accepted the request but returned no request_id")
	}

	fmt.Printf("Status: SUCCESS ✓\n")
	if len(fast2smsResp.Message) > 0 {
		fmt.Printf("Message: %s\n", strings.Join(fast2smsResp.Message, ", "))
	}
	fmt.Printf("================\n\n")

	return &MessageResult{
		// Fast2SMS returns this value specifically for DLR lookups.  Never
		// replace it with a locally generated value.
		MessageID: fast2smsResp.RequestID,
		Status:    "sent",
	}, nil
}

// DeliveryStatus is the per-recipient status returned by Fast2SMS DLR.
type DeliveryStatus struct {
	// Fast2SMS returns this as a JSON number in some DLR responses and a string
	// in others. RawMessage lets us support both without dropping the report.
	Mobile            json.RawMessage `json:"mobile"`
	Status            string          `json:"status"`
	StatusDescription string          `json:"status_description"`
	DeliveryTime      string          `json:"delivery_time"`
}

// GetDeliveryReport retrieves the delivery report for an actual Fast2SMS request_id.
func (p *Fast2SMSProvider) GetDeliveryReport(requestID string) ([]DeliveryStatus, error) {
	if strings.TrimSpace(requestID) == "" {
		return nil, fmt.Errorf("Fast2SMS request_id is missing")
	}
	req, err := http.NewRequest(http.MethodGet, "https://www.fast2sms.com/dev/dlr/"+url.PathEscape(requestID), nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create DLR request: %w", err)
	}
	req.Header.Set("Authorization", p.authKey)
	resp, err := p.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve Fast2SMS delivery report: %w", err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read delivery report: %w", err)
	}
	var payload struct {
		Success bool   `json:"success"`
		Message string `json:"message"`
		Data    []struct {
			DeliveryStatus []DeliveryStatus `json:"delivery_status"`
		} `json:"data"`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		return nil, fmt.Errorf("failed to decode Fast2SMS delivery report: %w", err)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 || !payload.Success {
		return nil, fmt.Errorf("Fast2SMS delivery report failed: %s", payload.Message)
	}
	var statuses []DeliveryStatus
	for _, item := range payload.Data {
		statuses = append(statuses, item.DeliveryStatus...)
	}
	return statuses, nil
}

// extractVariables extracts variable values from the filled template message
// Fast2SMS expects pipe-separated values for template variables
// Example: "Value1|Value2|Value3"
func (p *Fast2SMSProvider) extractVariables(message string) string {
	// Split message by newlines to extract variable values
	// The message should already have variables replaced by the service layer

	// For DLT templates, we need to extract the actual values from the message
	// Since the message already has variables replaced, we need to parse them out

	// Common patterns in Indian DLT templates:
	// Line 1: "Property for Sale: {value1}"
	// Line 2: "Details: ₹{value2}"
	// Line 3: "Contact: {value3}"

	lines := strings.Split(message, "\n")
	var variables []string

	for _, line := range lines {
		line = strings.TrimSpace(line)

		// Skip empty lines and lines with just "ENFOR DATA" or signature
		if line == "" || line == "ENFOR DATA" || strings.HasPrefix(line, "-") {
			continue
		}

		// Extract value after colon
		parts := strings.SplitN(line, ":", 2)
		if len(parts) == 2 {
			value := strings.TrimSpace(parts[1])
			// Remove common prefixes like ₹, emojis, etc.
			value = strings.TrimPrefix(value, "₹")
			value = strings.TrimSpace(value)

			// Remove emojis (they're before the colon, not in the value)
			// Only add non-empty values
			if value != "" {
				variables = append(variables, value)
			}
		}
	}

	// Join with pipe separator as required by Fast2SMS
	result := strings.Join(variables, "|")

	// If no variables found, return empty pipes based on template variable count
	if result == "" {
		return "|||" // Default for 3 variables
	}

	return result
}

func (p *Fast2SMSProvider) SendBulkMessages(recipients []Recipient, message string) ([]*MessageResult, error) {
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

		// Rate limiting: avoid hitting API limits
		if i < len(recipients)-1 {
			time.Sleep(100 * time.Millisecond)
		}
	}

	return results, nil
}

func (p *Fast2SMSProvider) GetAccountStatus() (*AccountStatus, error) {
	// Fast2SMS doesn't have a direct balance check API in the basic plan
	// You might need to implement this based on your Fast2SMS plan
	return &AccountStatus{
		Connected:    true,
		PhoneNumber:  p.senderID,
		MessageLimit: 10000,
		MessagesUsed: 0,
		DisplayName:  fmt.Sprintf("Fast2SMS (%s)", p.senderID),
		Balance:      "N/A",
	}, nil
}

func (p *Fast2SMSProvider) VerifyWebhook(token string) bool {
	// Implement Fast2SMS webhook verification if needed
	return true
}

func (p *Fast2SMSProvider) HandleWebhook(payload []byte) error {
	// Implement Fast2SMS webhook handling for delivery status updates
	return nil
}
