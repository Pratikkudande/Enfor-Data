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

type MSG91Provider struct {
	authKey  string
	senderID string
	route    string
	client   *http.Client
}

func NewMSG91Provider(authKey, senderID, route string) *MSG91Provider {
	return &MSG91Provider{
		authKey:  authKey,
		senderID: senderID,
		route:    route,
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

func (p *MSG91Provider) SendMessage(to string, message string) (*MessageResult, error) {
	// Clean phone number (remove any non-digit characters except +)
	to = strings.TrimSpace(to)
	if strings.HasPrefix(to, "+") {
		to = to[1:] // Remove + prefix as MSG91 expects numbers without +
	}

	// MSG91 SMS API endpoint
	apiURL := "https://api.msg91.com/api/sendhttp.php"

	// Prepare form data
	data := url.Values{}
	data.Set("authkey", p.authKey)
	data.Set("mobiles", to)
	data.Set("message", message)
	data.Set("sender", p.senderID)
	data.Set("route", p.route)
	data.Set("response", "json")

	// Create request
	req, err := http.NewRequest("POST", apiURL, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

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

	// Log the message details
	fmt.Printf("\n=== MSG91 SMS ===\n")
	fmt.Printf("From: %s\n", p.senderID)
	fmt.Printf("To: %s\n", to)
	fmt.Printf("Message: %s\n", message)
	fmt.Printf("Route: %s\n", p.route)
	fmt.Printf("Time: %s\n", time.Now().Format("2006-01-02 15:04:05"))

	// Parse response
	var msg91Resp MSG91Response
	if err := json.Unmarshal(body, &msg91Resp); err != nil {
		// If JSON parsing fails, check if it's a simple success response
		bodyStr := string(body)
		if resp.StatusCode == 200 && (strings.Contains(bodyStr, "success") || strings.Contains(bodyStr, "sent")) {
			fmt.Printf("Status: SUCCESS ✓\n")
			fmt.Printf("Response: %s\n", bodyStr)
			fmt.Printf("=================\n\n")

			return &MessageResult{
				MessageID: fmt.Sprintf("msg91_%d", time.Now().Unix()),
				Status:    "sent",
			}, nil
		}

		fmt.Printf("Status: FAILED ✗\n")
		fmt.Printf("Error: Failed to parse response\n")
		fmt.Printf("Raw Response: %s\n", bodyStr)
		fmt.Printf("=================\n\n")
		return nil, fmt.Errorf("failed to decode response: %w", err)
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

		return &MessageResult{
			Status: "failed",
			Error:  errorMsg,
		}, nil
	}

	fmt.Printf("Status: SUCCESS ✓\n")
	fmt.Printf("Message: %s\n", msg91Resp.Message)
	fmt.Printf("Code: %s\n", msg91Resp.Code)
	fmt.Printf("=================\n\n")

	return &MessageResult{
		MessageID: fmt.Sprintf("msg91_%d", time.Now().Unix()),
		Status:    "sent",
	}, nil
}

func (p *MSG91Provider) SendBulkMessages(recipients []Recipient, message string) ([]*MessageResult, error) {
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

		// Rate limiting: MSG91 recommends not more than 10 messages per second
		if i < len(recipients)-1 {
			time.Sleep(100 * time.Millisecond)
		}
	}

	return results, nil
}

func (p *MSG91Provider) GetAccountStatus() (*AccountStatus, error) {
	// MSG91 balance check endpoint
	apiURL := fmt.Sprintf("https://api.msg91.com/api/balance.php?authkey=%s&type=4", p.authKey)

	resp, err := p.client.Get(apiURL)
	if err != nil {
		return nil, fmt.Errorf("failed to get account status: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	// MSG91 returns balance as plain text
	balance := strings.TrimSpace(string(body))

	return &AccountStatus{
		Connected:    true,
		PhoneNumber:  p.senderID,
		MessageLimit: 10000, // This would need to be calculated based on balance
		MessagesUsed: 0,     // Would need to track usage separately
		DisplayName:  fmt.Sprintf("MSG91 (%s)", p.senderID),
		Balance:      balance,
	}, nil
}

func (p *MSG91Provider) VerifyWebhook(token string) bool {
	// Implement MSG91 webhook verification if needed
	// For now, return true
	return true
}

func (p *MSG91Provider) HandleWebhook(payload []byte) error {
	// Implement MSG91 webhook handling for delivery status updates
	// This would update message status in your database
	return nil
}