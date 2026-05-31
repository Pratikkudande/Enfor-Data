package service

import (
	"fmt"

	"enfor-data-backend/internal/models"
	"enfor-data-backend/internal/repository"
)

// NetworkService handles all broker-network business logic.
type NetworkService struct {
	repo     *repository.NetworkRepository
	userRepo *repository.UserRepository
}

func NewNetworkService(repo *repository.NetworkRepository, userRepo *repository.UserRepository) *NetworkService {
	return &NetworkService{repo: repo, userRepo: userRepo}
}

// ── Connections ───────────────────────────────────────────────────────────────

// SendConnectionRequest validates and creates a connection request.
func (s *NetworkService) SendConnectionRequest(senderID, receiverID string) (*models.ConnectionRequest, error) {
	if senderID == receiverID {
		return nil, fmt.Errorf("cannot connect with yourself")
	}

	// Verify both users are brokers
	sender, err := s.userRepo.GetUserByID(senderID)
	if err != nil || sender.Role != "broker" {
		return nil, fmt.Errorf("sender must be a broker")
	}
	receiver, err := s.userRepo.GetUserByID(receiverID)
	if err != nil || receiver.Role != "broker" {
		return nil, fmt.Errorf("receiver must be a broker")
	}

	// Check for duplicate
	exists, err := s.repo.RequestExists(senderID, receiverID)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing request: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("connection request already exists")
	}

	return s.repo.CreateRequest(senderID, receiverID)
}

// RespondToRequest accepts or rejects a connection request.
// On accept: materialises a Connection and creates a Conversation.
func (s *NetworkService) RespondToRequest(requestID, responderID, action string) error {
	if action != "accept" && action != "reject" {
		return fmt.Errorf("action must be 'accept' or 'reject'")
	}

	req, err := s.repo.GetRequestByID(requestID)
	if err != nil {
		return err
	}
	if req.ReceiverID != responderID {
		return fmt.Errorf("not authorised to respond to this request")
	}
	if req.Status != "pending" {
		return fmt.Errorf("request is already %s", req.Status)
	}

	status := "rejected"
	if action == "accept" {
		status = "accepted"
	}

	if err := s.repo.UpdateRequestStatus(requestID, status); err != nil {
		return err
	}

	if action == "accept" {
		if _, err := s.repo.CreateConnection(req.SenderID, req.ReceiverID); err != nil {
			return fmt.Errorf("failed to create connection: %w", err)
		}
		// Auto-create conversation
		if _, err := s.repo.GetOrCreateConversation(req.SenderID, req.ReceiverID); err != nil {
			return fmt.Errorf("failed to create conversation: %w", err)
		}
	}
	return nil
}

// GetConnections returns all accepted connections for a broker.
func (s *NetworkService) GetConnections(userID string) ([]models.Connection, error) {
	return s.repo.GetConnections(userID)
}

// GetPendingRequests returns incoming pending requests.
func (s *NetworkService) GetPendingRequests(userID string) ([]models.ConnectionRequest, error) {
	return s.repo.GetPendingRequestsForUser(userID)
}

// GetSentRequests returns outgoing requests.
func (s *NetworkService) GetSentRequests(userID string) ([]models.ConnectionRequest, error) {
	return s.repo.GetSentRequestsForUser(userID)
}

// GetAllBrokers returns all brokers with connection status relative to the caller.
func (s *NetworkService) GetAllBrokers(userID string) ([]map[string]interface{}, error) {
	return s.repo.GetAllBrokers(userID)
}

// ── Messaging ─────────────────────────────────────────────────────────────────

// EnsureConversation gets or creates a conversation with a peer (must be connected).
func (s *NetworkService) EnsureConversation(userID, peerID string) (*models.Conversation, error) {
	connected, err := s.repo.AreConnected(userID, peerID)
	if err != nil {
		return nil, fmt.Errorf("failed to verify connection: %w", err)
	}
	if !connected {
		return nil, fmt.Errorf("you must be connected to start a conversation")
	}
	return s.repo.EnsureConversationWithPeer(userID, peerID)
}

// GetConversations returns all conversations for a user.
func (s *NetworkService) GetConversations(userID string) ([]models.Conversation, error) {
	return s.repo.GetUserConversations(userID)
}

// GetMessages returns paginated messages for a conversation.
// Validates that the requesting user is a participant.
func (s *NetworkService) GetMessages(convID, userID string, limit, offset int) ([]models.Message, error) {
	conv, err := s.repo.GetConversationByID(convID)
	if err != nil {
		return nil, err
	}
	if conv.BrokerA != userID && conv.BrokerB != userID {
		return nil, fmt.Errorf("access denied")
	}
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	return s.repo.GetMessages(convID, limit, offset)
}

// SendMessage validates connection, persists the message, and returns it.
func (s *NetworkService) SendMessage(convID, senderID, body string) (*models.Message, error) {
	if body == "" {
		return nil, fmt.Errorf("message body cannot be empty")
	}

	conv, err := s.repo.GetConversationByID(convID)
	if err != nil {
		return nil, err
	}

	// Determine the other participant
	var otherID string
	if conv.BrokerA == senderID {
		otherID = conv.BrokerB
	} else if conv.BrokerB == senderID {
		otherID = conv.BrokerA
	} else {
		return nil, fmt.Errorf("access denied")
	}

	// Verify they are still connected
	connected, err := s.repo.AreConnected(senderID, otherID)
	if err != nil {
		return nil, fmt.Errorf("failed to verify connection: %w", err)
	}
	if !connected {
		return nil, fmt.Errorf("you must be connected to send messages")
	}

	return s.repo.CreateMessage(convID, senderID, body)
}

// MarkRead marks messages in a conversation as read.
func (s *NetworkService) MarkRead(convID, readerID string) error {
	conv, err := s.repo.GetConversationByID(convID)
	if err != nil {
		return err
	}
	if conv.BrokerA != readerID && conv.BrokerB != readerID {
		return fmt.Errorf("access denied")
	}
	return s.repo.MarkMessagesRead(convID, readerID)
}
