package repository

import (
	"fmt"

	"enfor-data-backend/internal/database"
	"enfor-data-backend/internal/models"
)

type NotificationRepository struct {
	db *database.DB
}

func NewNotificationRepository(db *database.DB) *NotificationRepository {
	return &NotificationRepository{db: db}
}

// Create inserts a notification and fills its generated fields.
func (r *NotificationRepository) Create(n *models.Notification) error {
	query := `
		INSERT INTO notifications (user_id, type, title, message, action_url, metadata)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, is_read, created_at`
	return r.db.QueryRow(
		query, n.UserID, n.Type, n.Title, n.Message, n.ActionURL, n.Metadata,
	).Scan(&n.ID, &n.Read, &n.CreatedAt)
}

// ListByUser returns a user's notifications, newest first.
func (r *NotificationRepository) ListByUser(userID string, limit, offset int) ([]models.Notification, error) {
	rows, err := r.db.Query(`
		SELECT id, user_id, type, title, message, action_url, metadata, is_read, created_at
		FROM notifications
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to query notifications: %w", err)
	}
	defer rows.Close()

	list := []models.Notification{}
	for rows.Next() {
		var n models.Notification
		if err := rows.Scan(&n.ID, &n.UserID, &n.Type, &n.Title, &n.Message,
			&n.ActionURL, &n.Metadata, &n.Read, &n.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan notification: %w", err)
		}
		list = append(list, n)
	}
	return list, rows.Err()
}

func (r *NotificationRepository) CountByUser(userID string) (int, error) {
	var n int
	err := r.db.QueryRow(`SELECT COUNT(*) FROM notifications WHERE user_id=$1`, userID).Scan(&n)
	return n, err
}

func (r *NotificationRepository) CountUnread(userID string) (int, error) {
	var n int
	err := r.db.QueryRow(`SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND is_read=FALSE`, userID).Scan(&n)
	return n, err
}

// CountUnreadByType returns unread counts grouped by type.
func (r *NotificationRepository) CountByType(userID string) (map[string]int, error) {
	rows, err := r.db.Query(`SELECT type, COUNT(*) FROM notifications WHERE user_id=$1 GROUP BY type`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string]int{}
	for rows.Next() {
		var t string
		var c int
		if err := rows.Scan(&t, &c); err != nil {
			return nil, err
		}
		out[t] = c
	}
	return out, rows.Err()
}

func (r *NotificationRepository) MarkRead(userID, id string) error {
	_, err := r.db.Exec(`UPDATE notifications SET is_read=TRUE WHERE id=$1 AND user_id=$2`, id, userID)
	return err
}

func (r *NotificationRepository) MarkAllRead(userID string) error {
	_, err := r.db.Exec(`UPDATE notifications SET is_read=TRUE WHERE user_id=$1 AND is_read=FALSE`, userID)
	return err
}

func (r *NotificationRepository) Delete(userID, id string) error {
	_, err := r.db.Exec(`DELETE FROM notifications WHERE id=$1 AND user_id=$2`, id, userID)
	return err
}

// WantsNotification reports whether a user has the given notification preference
// enabled (defaults to true when the preference has never been saved).
func (r *NotificationRepository) WantsNotification(userID, prefKey string) bool {
	var enabled bool
	err := r.db.QueryRow(
		`SELECT COALESCE((settings->'notifications'->>$2)::boolean, true) FROM users WHERE id=$1`,
		userID, prefKey,
	).Scan(&enabled)
	if err != nil {
		return true // be permissive on error
	}
	return enabled
}
