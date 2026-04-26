package repository

import (
	"database/sql"
	"fmt"
	"strings"

	"enfor-data-backend/internal/database"
	"enfor-data-backend/internal/models"
)

type NetworkRepository struct {
	db *database.DB
}

func NewNetworkRepository(db *database.DB) *NetworkRepository {
	return &NetworkRepository{db: db}
}

// ── helpers ──────────────────────────────────────────────────────────────────

// orderedPair returns (a, b) where a < b (lexicographic) so storage is canonical.
func orderedPair(x, y string) (string, string) {
	if x < y {
		return x, y
	}
	return y, x
}

// ── Connection Requests ───────────────────────────────────────────────────────

// RequestExists returns true if any request (in either direction) already exists
// between the two brokers with status pending or accepted.
func (r *NetworkRepository) RequestExists(a, b string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM connection_requests
			WHERE ((sender_id=$1 AND receiver_id=$2) OR (sender_id=$2 AND receiver_id=$1))
			  AND status IN ('pending','accepted')
		)`, a, b).Scan(&exists)
	return exists, err
}

// CreateRequest inserts a new pending connection request.
func (r *NetworkRepository) CreateRequest(senderID, receiverID string) (*models.ConnectionRequest, error) {
	req := &models.ConnectionRequest{}
	err := r.db.QueryRow(`
		INSERT INTO connection_requests (sender_id, receiver_id)
		VALUES ($1, $2)
		RETURNING id, sender_id, receiver_id, status, created_at, updated_at`,
		senderID, receiverID,
	).Scan(&req.ID, &req.SenderID, &req.ReceiverID, &req.Status, &req.CreatedAt, &req.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	return req, nil
}

// GetRequestByID fetches a single request.
func (r *NetworkRepository) GetRequestByID(id string) (*models.ConnectionRequest, error) {
	req := &models.ConnectionRequest{}
	err := r.db.QueryRow(`
		SELECT id, sender_id, receiver_id, status, created_at, updated_at
		FROM connection_requests WHERE id=$1`, id,
	).Scan(&req.ID, &req.SenderID, &req.ReceiverID, &req.Status, &req.CreatedAt, &req.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("request not found")
	}
	return req, err
}

// UpdateRequestStatus sets status to accepted or rejected.
func (r *NetworkRepository) UpdateRequestStatus(id, status string) error {
	res, err := r.db.Exec(`UPDATE connection_requests SET status=$1 WHERE id=$2`, status, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return fmt.Errorf("request not found")
	}
	return nil
}

// GetPendingRequestsForUser returns all pending requests where the user is the receiver.
func (r *NetworkRepository) GetPendingRequestsForUser(userID string) ([]models.ConnectionRequest, error) {
	rows, err := r.db.Query(`
		SELECT cr.id, cr.sender_id, cr.receiver_id, cr.status, cr.created_at, cr.updated_at,
		       u.first_name||' '||u.last_name, u.city, u.firm_name, u.profile_image
		FROM connection_requests cr
		JOIN users u ON u.id = cr.sender_id
		WHERE cr.receiver_id=$1 AND cr.status='pending'
		ORDER BY cr.created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.ConnectionRequest
	for rows.Next() {
		var req models.ConnectionRequest
		if err := rows.Scan(
			&req.ID, &req.SenderID, &req.ReceiverID, &req.Status, &req.CreatedAt, &req.UpdatedAt,
			&req.SenderName, &req.SenderCity, &req.SenderFirm, &req.SenderImage,
		); err != nil {
			return nil, err
		}
		list = append(list, req)
	}
	if list == nil {
		list = []models.ConnectionRequest{}
	}
	return list, rows.Err()
}

// GetSentRequestsForUser returns all requests sent by the user.
func (r *NetworkRepository) GetSentRequestsForUser(userID string) ([]models.ConnectionRequest, error) {
	rows, err := r.db.Query(`
		SELECT cr.id, cr.sender_id, cr.receiver_id, cr.status, cr.created_at, cr.updated_at,
		       u.first_name||' '||u.last_name, u.city, u.firm_name, u.profile_image
		FROM connection_requests cr
		JOIN users u ON u.id = cr.receiver_id
		WHERE cr.sender_id=$1
		ORDER BY cr.created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.ConnectionRequest
	for rows.Next() {
		var req models.ConnectionRequest
		if err := rows.Scan(
			&req.ID, &req.SenderID, &req.ReceiverID, &req.Status, &req.CreatedAt, &req.UpdatedAt,
			&req.ReceiverName, &req.ReceiverCity, &req.ReceiverFirm, &req.SenderImage,
		); err != nil {
			return nil, err
		}
		list = append(list, req)
	}
	if list == nil {
		list = []models.ConnectionRequest{}
	}
	return list, rows.Err()
}

// ── Connections ───────────────────────────────────────────────────────────────

// CreateConnection materialises an accepted connection and returns it.
func (r *NetworkRepository) CreateConnection(a, b string) (*models.Connection, error) {
	pa, pb := orderedPair(a, b)
	conn := &models.Connection{}
	err := r.db.QueryRow(`
		INSERT INTO connections (broker_a, broker_b)
		VALUES ($1, $2)
		ON CONFLICT (broker_a, broker_b) DO UPDATE SET broker_a=EXCLUDED.broker_a
		RETURNING id, broker_a, broker_b, created_at`, pa, pb,
	).Scan(&conn.ID, &conn.BrokerA, &conn.BrokerB, &conn.CreatedAt)
	return conn, err
}

// AreConnected returns true if the two brokers have an accepted connection.
func (r *NetworkRepository) AreConnected(a, b string) (bool, error) {
	pa, pb := orderedPair(a, b)
	var exists bool
	err := r.db.QueryRow(`
		SELECT EXISTS(SELECT 1 FROM connections WHERE broker_a=$1 AND broker_b=$2)`,
		pa, pb).Scan(&exists)
	return exists, err
}

// GetConnections returns all connections for a broker with peer info.
func (r *NetworkRepository) GetConnections(userID string) ([]models.Connection, error) {
	rows, err := r.db.Query(`
		SELECT c.id, c.broker_a, c.broker_b, c.created_at,
		       u.id, u.first_name||' '||u.last_name, u.city, u.firm_name, u.profile_image
		FROM connections c
		JOIN users u ON u.id = CASE WHEN c.broker_a=$1 THEN c.broker_b ELSE c.broker_a END
		WHERE c.broker_a=$1 OR c.broker_b=$1
		ORDER BY c.created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.Connection
	for rows.Next() {
		var conn models.Connection
		if err := rows.Scan(
			&conn.ID, &conn.BrokerA, &conn.BrokerB, &conn.CreatedAt,
			&conn.PeerID, &conn.PeerName, &conn.PeerCity, &conn.PeerFirm, &conn.PeerImage,
		); err != nil {
			return nil, err
		}
		list = append(list, conn)
	}
	if list == nil {
		list = []models.Connection{}
	}
	return list, rows.Err()
}

// GetAllBrokers returns all brokers except the requesting user, with connection status.
func (r *NetworkRepository) GetAllBrokers(userID string) ([]map[string]interface{}, error) {
	rows, err := r.db.Query(`
		SELECT u.id, u.first_name||' '||u.last_name AS name, u.city, u.state,
		       u.firm_name, u.profile_image,
		       COALESCE(u.years_experience, 0) AS years_experience,
		       COALESCE(u.deals_completed, 0) AS deals_completed,
		       COALESCE(array_to_string(u.specializations, ','), '') AS specializations,
		       COALESCE((SELECT COUNT(*) FROM properties WHERE broker_id=u.id AND status='available'), 0) AS properties_count,
		       COALESCE(cr.status, 
		           CASE WHEN conn.id IS NOT NULL THEN 'connected' ELSE 'none' END
		       ) AS connection_status,
		       cr.id AS request_id,
		       cr.sender_id
		FROM users u
		LEFT JOIN connection_requests cr ON (
		    (cr.sender_id=$1 AND cr.receiver_id=u.id) OR
		    (cr.receiver_id=$1 AND cr.sender_id=u.id)
		) AND cr.status='pending'
		LEFT JOIN connections conn ON (
		    (conn.broker_a=$1 AND conn.broker_b=u.id) OR
		    (conn.broker_a=u.id AND conn.broker_b=$1)
		)
		WHERE u.id <> $1 AND u.role='broker' AND u.is_active=true
		ORDER BY u.first_name, u.last_name`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []map[string]interface{}
	for rows.Next() {
		var (
			id, name, city, state, firm string
			image                       *string
			yearsExp, dealsCompleted, propertiesCount int
			specializationsStr          string
			status, requestID, senderID *string
		)
		if err := rows.Scan(&id, &name, &city, &state, &firm, &image, 
			&yearsExp, &dealsCompleted, &specializationsStr, &propertiesCount,
			&status, &requestID, &senderID); err != nil {
			return nil, err
		}
		
		// Parse specializations from comma-separated string
		var specializations []string
		if specializationsStr != "" {
			for _, s := range strings.Split(specializationsStr, ",") {
				trimmed := strings.TrimSpace(s)
				if trimmed != "" {
					specializations = append(specializations, trimmed)
				}
			}
		}
		if specializations == nil {
			specializations = []string{}
		}
		
		m := map[string]interface{}{
			"id": id, "name": name, "city": city, "state": state,
			"firm_name": firm, "profile_image": image,
			"years_experience": yearsExp, "deals_completed": dealsCompleted,
			"specializations": specializations, "properties_count": propertiesCount,
			"connection_status": status, "request_id": requestID, "sender_id": senderID,
		}
		list = append(list, m)
	}
	if list == nil {
		list = []map[string]interface{}{}
	}
	return list, rows.Err()
}

// ── Conversations ─────────────────────────────────────────────────────────────

// GetOrCreateConversation returns existing conversation or creates one.
func (r *NetworkRepository) GetOrCreateConversation(a, b string) (*models.Conversation, error) {
	pa, pb := orderedPair(a, b)
	conv := &models.Conversation{}
	err := r.db.QueryRow(`
		INSERT INTO conversations (broker_a, broker_b)
		VALUES ($1, $2)
		ON CONFLICT (broker_a, broker_b) DO UPDATE SET broker_a=EXCLUDED.broker_a
		RETURNING id, broker_a, broker_b, last_message_at, created_at`, pa, pb,
	).Scan(&conv.ID, &conv.BrokerA, &conv.BrokerB, &conv.LastMessageAt, &conv.CreatedAt)
	return conv, err
}

// GetConversationByID fetches a conversation by ID.
func (r *NetworkRepository) GetConversationByID(id string) (*models.Conversation, error) {
	conv := &models.Conversation{}
	err := r.db.QueryRow(`
		SELECT id, broker_a, broker_b, last_message_at, created_at
		FROM conversations WHERE id=$1`, id,
	).Scan(&conv.ID, &conv.BrokerA, &conv.BrokerB, &conv.LastMessageAt, &conv.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("conversation not found")
	}
	return conv, err
}

// GetUserConversations returns all conversations for a user with peer info + last message.
func (r *NetworkRepository) GetUserConversations(userID string) ([]models.Conversation, error) {
	rows, err := r.db.Query(`
		SELECT c.id, c.broker_a, c.broker_b, c.last_message_at, c.created_at,
		       u.id, u.first_name||' '||u.last_name, u.profile_image,
		       (SELECT body FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1),
		       (SELECT COUNT(*) FROM messages WHERE conversation_id=c.id AND is_read=false AND sender_id<>$1)
		FROM conversations c
		JOIN users u ON u.id = CASE WHEN c.broker_a=$1 THEN c.broker_b ELSE c.broker_a END
		WHERE c.broker_a=$1 OR c.broker_b=$1
		ORDER BY c.last_message_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.Conversation
	for rows.Next() {
		var conv models.Conversation
		if err := rows.Scan(
			&conv.ID, &conv.BrokerA, &conv.BrokerB, &conv.LastMessageAt, &conv.CreatedAt,
			&conv.PeerID, &conv.PeerName, &conv.PeerImage,
			&conv.LastMessageBody, &conv.UnreadCount,
		); err != nil {
			return nil, err
		}
		list = append(list, conv)
	}
	if list == nil {
		list = []models.Conversation{}
	}
	return list, rows.Err()
}

// ── Messages ──────────────────────────────────────────────────────────────────

// CreateMessage inserts a message and bumps conversation.last_message_at.
func (r *NetworkRepository) CreateMessage(convID, senderID, body string) (*models.Message, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	msg := &models.Message{}
	err = tx.QueryRow(`
		INSERT INTO messages (conversation_id, sender_id, body)
		VALUES ($1, $2, $3)
		RETURNING id, conversation_id, sender_id, body, is_read, created_at`,
		convID, senderID, body,
	).Scan(&msg.ID, &msg.ConversationID, &msg.SenderID, &msg.Body, &msg.IsRead, &msg.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("insert message: %w", err)
	}

	if _, err = tx.Exec(`UPDATE conversations SET last_message_at=NOW() WHERE id=$1`, convID); err != nil {
		return nil, fmt.Errorf("update conversation: %w", err)
	}

	return msg, tx.Commit()
}

// GetMessages returns paginated messages for a conversation (latest first).
func (r *NetworkRepository) GetMessages(convID string, limit, offset int) ([]models.Message, error) {
	rows, err := r.db.Query(`
		SELECT m.id, m.conversation_id, m.sender_id, m.body, m.is_read, m.created_at,
		       u.first_name||' '||u.last_name, u.profile_image
		FROM messages m
		JOIN users u ON u.id = m.sender_id
		WHERE m.conversation_id=$1
		ORDER BY m.created_at DESC
		LIMIT $2 OFFSET $3`, convID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.Message
	for rows.Next() {
		var msg models.Message
		if err := rows.Scan(
			&msg.ID, &msg.ConversationID, &msg.SenderID, &msg.Body, &msg.IsRead, &msg.CreatedAt,
			&msg.SenderName, &msg.SenderImage,
		); err != nil {
			return nil, err
		}
		list = append(list, msg)
	}
	if list == nil {
		list = []models.Message{}
	}
	return list, rows.Err()
}

// MarkMessagesRead marks all unread messages in a conversation as read (except own).
func (r *NetworkRepository) MarkMessagesRead(convID, readerID string) error {
	_, err := r.db.Exec(`
		UPDATE messages SET is_read=true
		WHERE conversation_id=$1 AND sender_id<>$2 AND is_read=false`,
		convID, readerID)
	return err
}
