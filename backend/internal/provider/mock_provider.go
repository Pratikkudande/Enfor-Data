package provider

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

// MockProvider is a mock implementation for testing and development
type MockProvider struct {
	phoneNumber  string
	displayName  string
	messageLimit int
	messagesUsed int
}

// NewMockProvider creates a new mock provider
func NewMockProvider(phoneNumber, displayName string) *MockProvider {
	return &MockProvider{
		phoneNumber:  phoneNumber,
		displayName:  displayName,
		messageLimit: 1000,
		messagesUsed: 0,
	}
}

// SendMessage sends a single message (mock implementation)
func (p *MockProvider) SendMessage(to string, message string) (*MessageResult, error) {
	// Simulate API delay
	time.Sleep(100 * time.Millisecond)

	// Log the message details (for development visibility)
	fmt.Printf("\n=== MOCK WHATSAPP MESSAGE ===\n")
	fmt.Printf("From: %s (%s)\n", p.phoneNumber, p.displayName)
	fmt.Printf("To: %s\n", to)
	fmt.Printf("Message: %s\n", message)
	fmt.Printf("Time: %s\n", time.Now().Format("2006-01-02 15:04:05"))

	// Check if we've hit the limit
	if p.messagesUsed >= p.messageLimit {
		fmt.Printf("Status: FAILED - Message limit exceeded\n")
		fmt.Printf("============================\n\n")
		return &MessageResult{
			Status: "failed",
			Error:  "Message limit exceeded",
		}, nil
	}

	// Simulate 95% success rate
	if time.Now().UnixNano()%100 < 95 {
		p.messagesUsed++
		messageID := fmt.Sprintf("mock_%s", uuid.New().String()[:8])
		fmt.Printf("Status: SUCCESS ✓\n")
		fmt.Printf("Message ID: %s\n", messageID)
		fmt.Printf("============================\n\n")
		return &MessageResult{
			MessageID: messageID,
			Status:    "sent",
		}, nil
	}

	fmt.Printf("Status: FAILED - Simulated delivery failure\n")
	fmt.Printf("============================\n\n")
	return &MessageResult{
		Status: "failed",
		Error:  "Simulated delivery failure",
	}, nil
}

// SendBulkMessages sends multiple messages (mock implementation)
func (p *MockProvider) SendBulkMessages(recipients []Recipient, message string) ([]*MessageResult, error) {
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

		// Simulate rate limiting (15ms between messages)
		time.Sleep(15 * time.Millisecond)
	}

	return results, nil
}

// GetAccountStatus returns the mock account status
func (p *MockProvider) GetAccountStatus() (*AccountStatus, error) {
	return &AccountStatus{
		Connected:     true,
		PhoneNumber:   p.phoneNumber,
		MessageLimit:  p.messageLimit,
		MessagesUsed:  p.messagesUsed,
		DisplayName:   p.displayName,
		Balance:       "Mock Balance: 1000 credits",
	}, nil
}

// VerifyWebhook verifies the webhook token (mock implementation)
func (p *MockProvider) VerifyWebhook(token string) bool {
	return token == "mock_verify_token"
}

// HandleWebhook handles incoming webhook events (mock implementation)
func (p *MockProvider) HandleWebhook(payload []byte) error {
	// Mock implementation - just log that we received it
	return nil
}
