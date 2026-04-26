package models

import "time"

// ConnectionRequest is a pending/accepted/rejected broker connection request.
type ConnectionRequest struct {
	ID         string    `json:"id"`
	SenderID   string    `json:"sender_id"`
	ReceiverID string    `json:"receiver_id"`
	Status     string    `json:"status"` // pending | accepted | rejected
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`

	// Joined fields (populated by repository queries)
	SenderName   string  `json:"sender_name,omitempty"`
	SenderCity   string  `json:"sender_city,omitempty"`
	SenderFirm   string  `json:"sender_firm,omitempty"`
	SenderImage  *string `json:"sender_image,omitempty"`
	ReceiverName string  `json:"receiver_name,omitempty"`
	ReceiverCity string  `json:"receiver_city,omitempty"`
	ReceiverFirm string  `json:"receiver_firm,omitempty"`
}

// Connection is a materialised accepted connection between two brokers.
type Connection struct {
	ID        string    `json:"id"`
	BrokerA   string    `json:"broker_a"`
	BrokerB   string    `json:"broker_b"`
	CreatedAt time.Time `json:"created_at"`

	// Joined: the "other" broker's info (populated relative to the requesting user)
	PeerID    string  `json:"peer_id"`
	PeerName  string  `json:"peer_name"`
	PeerCity  string  `json:"peer_city"`
	PeerFirm  string  `json:"peer_firm"`
	PeerImage *string `json:"peer_image,omitempty"`
}

// Conversation is a 1-to-1 chat channel between two connected brokers.
type Conversation struct {
	ID            string    `json:"id"`
	BrokerA       string    `json:"broker_a"`
	BrokerB       string    `json:"broker_b"`
	LastMessageAt time.Time `json:"last_message_at"`
	CreatedAt     time.Time `json:"created_at"`

	// Joined: peer info + last message preview
	PeerID          string  `json:"peer_id"`
	PeerName        string  `json:"peer_name"`
	PeerImage       *string `json:"peer_image,omitempty"`
	LastMessageBody *string `json:"last_message_body,omitempty"`
	UnreadCount     int     `json:"unread_count"`
}

// Message is a single chat message inside a conversation.
type Message struct {
	ID             string    `json:"id"`
	ConversationID string    `json:"conversation_id"`
	SenderID       string    `json:"sender_id"`
	Body           string    `json:"body"`
	IsRead         bool      `json:"is_read"`
	CreatedAt      time.Time `json:"created_at"`

	// Joined
	SenderName  string  `json:"sender_name,omitempty"`
	SenderImage *string `json:"sender_image,omitempty"`
}
