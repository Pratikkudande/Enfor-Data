package provider

// MessagingProvider defines the interface for sending messages through various providers
type MessagingProvider interface {
	SendMessage(to string, message string) (*MessageResult, error)
	SendBulkMessages(recipients []Recipient, message string) ([]*MessageResult, error)
	GetAccountStatus() (*AccountStatus, error)
	VerifyWebhook(token string) bool
	HandleWebhook(payload []byte) error
}

// MessageResult represents the result of sending a message
type MessageResult struct {
	MessageID string
	Status    string // "sent", "failed", "queued"
	Error     string
}

// Recipient represents a message recipient
type Recipient struct {
	Phone string
	Name  string
}

// AccountStatus represents the status of the messaging account
type AccountStatus struct {
	Connected     bool
	PhoneNumber   string
	MessageLimit  int
	MessagesUsed  int
	DisplayName   string
}
