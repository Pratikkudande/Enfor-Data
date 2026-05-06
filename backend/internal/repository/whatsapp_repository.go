package repository

import (
	"database/sql"
	"enfor-data-backend/internal/database"
	"enfor-data-backend/internal/models"
	"fmt"

	"github.com/lib/pq"
)

type WhatsAppRepository struct {
	db *database.DB
}

func NewWhatsAppRepository(db *database.DB) *WhatsAppRepository {
	return &WhatsAppRepository{db: db}
}

// ============================================================
// WhatsApp Account Management
// ============================================================

func (r *WhatsAppRepository) GetAccountByUserID(userID string) (*models.WhatsAppAccount, error) {
	query := `
		SELECT id, user_id, business_account_id, phone_number_id, phone_number, 
		       display_name, access_token_encrypted, webhook_verify_token, status, 
		       connection_error, message_limit, messages_sent_today, last_reset_date,
		       connected_at, last_used_at, created_at, updated_at
		FROM whatsapp_accounts
		WHERE user_id = $1
	`

	var account models.WhatsAppAccount
	err := r.db.QueryRow(query, userID).Scan(
		&account.ID, &account.UserID, &account.BusinessAccountID, &account.PhoneNumberID,
		&account.PhoneNumber, &account.DisplayName, &account.AccessTokenEncrypted,
		&account.WebhookVerifyToken, &account.Status, &account.ConnectionError,
		&account.MessageLimit, &account.MessagesSentToday, &account.LastResetDate,
		&account.ConnectedAt, &account.LastUsedAt, &account.CreatedAt, &account.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get WhatsApp account: %w", err)
	}

	return &account, nil
}

func (r *WhatsAppRepository) CreateAccount(account *models.WhatsAppAccount) error {
	query := `
		INSERT INTO whatsapp_accounts (
			user_id, business_account_id, phone_number_id, phone_number, display_name,
			access_token_encrypted, webhook_verify_token, status, message_limit
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, created_at, updated_at
	`

	return r.db.QueryRow(
		query,
		account.UserID, account.BusinessAccountID, account.PhoneNumberID, account.PhoneNumber,
		account.DisplayName, account.AccessTokenEncrypted, account.WebhookVerifyToken,
		account.Status, account.MessageLimit,
	).Scan(&account.ID, &account.CreatedAt, &account.UpdatedAt)
}

func (r *WhatsAppRepository) UpdateAccount(account *models.WhatsAppAccount) error {
	query := `
		UPDATE whatsapp_accounts
		SET business_account_id = $1, phone_number_id = $2, phone_number = $3,
		    display_name = $4, access_token_encrypted = $5, webhook_verify_token = $6,
		    status = $7, connection_error = $8, message_limit = $9,
		    messages_sent_today = $10, last_reset_date = $11, connected_at = $12,
		    last_used_at = $13
		WHERE id = $14
	`

	_, err := r.db.Exec(
		query,
		account.BusinessAccountID, account.PhoneNumberID, account.PhoneNumber,
		account.DisplayName, account.AccessTokenEncrypted, account.WebhookVerifyToken,
		account.Status, account.ConnectionError, account.MessageLimit,
		account.MessagesSentToday, account.LastResetDate, account.ConnectedAt,
		account.LastUsedAt, account.ID,
	)

	return err
}

func (r *WhatsAppRepository) UpdateAccountStatus(userID, status string) error {
	query := `UPDATE whatsapp_accounts SET status = $1 WHERE user_id = $2`
	_, err := r.db.Exec(query, status, userID)
	return err
}

// ============================================================
// Campaign Management
// ============================================================

func (r *WhatsAppRepository) CreateCampaign(campaign *models.Campaign) error {
	query := `
		INSERT INTO campaigns (
			user_id, whatsapp_account_id, name, message_text, total_recipients,
			successful_sends, failed_sends, pending_sends, status
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, created_at, updated_at
	`

	return r.db.QueryRow(
		query,
		campaign.UserID, campaign.WhatsAppAccountID, campaign.Name, campaign.MessageText,
		campaign.TotalRecipients, campaign.SuccessfulSends, campaign.FailedSends,
		campaign.PendingSends, campaign.Status,
	).Scan(&campaign.ID, &campaign.CreatedAt, &campaign.UpdatedAt)
}

func (r *WhatsAppRepository) GetCampaignsByUserID(userID string) ([]models.Campaign, error) {
	query := `
		SELECT id, user_id, whatsapp_account_id, name, message_text, total_recipients,
		       successful_sends, failed_sends, pending_sends, status, scheduled_at,
		       started_at, completed_at, error_message, created_at, updated_at
		FROM campaigns
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get campaigns: %w", err)
	}
	defer rows.Close()

	var campaigns []models.Campaign
	for rows.Next() {
		var c models.Campaign
		err := rows.Scan(
			&c.ID, &c.UserID, &c.WhatsAppAccountID, &c.Name, &c.MessageText,
			&c.TotalRecipients, &c.SuccessfulSends, &c.FailedSends, &c.PendingSends,
			&c.Status, &c.ScheduledAt, &c.StartedAt, &c.CompletedAt, &c.ErrorMessage,
			&c.CreatedAt, &c.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan campaign: %w", err)
		}
		campaigns = append(campaigns, c)
	}

	return campaigns, nil
}

func (r *WhatsAppRepository) GetCampaignByID(id string) (*models.Campaign, error) {
	query := `
		SELECT id, user_id, whatsapp_account_id, name, message_text, total_recipients,
		       successful_sends, failed_sends, pending_sends, status, scheduled_at,
		       started_at, completed_at, error_message, created_at, updated_at
		FROM campaigns
		WHERE id = $1
	`

	var c models.Campaign
	err := r.db.QueryRow(query, id).Scan(
		&c.ID, &c.UserID, &c.WhatsAppAccountID, &c.Name, &c.MessageText,
		&c.TotalRecipients, &c.SuccessfulSends, &c.FailedSends, &c.PendingSends,
		&c.Status, &c.ScheduledAt, &c.StartedAt, &c.CompletedAt, &c.ErrorMessage,
		&c.CreatedAt, &c.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get campaign: %w", err)
	}

	return &c, nil
}

func (r *WhatsAppRepository) UpdateCampaignStatus(id, status string) error {
	query := `UPDATE campaigns SET status = $1 WHERE id = $2`
	_, err := r.db.Exec(query, status, id)
	return err
}

func (r *WhatsAppRepository) UpdateCampaignStats(id string, successful, failed, pending int) error {
	query := `
		UPDATE campaigns
		SET successful_sends = $1, failed_sends = $2, pending_sends = $3
		WHERE id = $4
	`
	_, err := r.db.Exec(query, successful, failed, pending, id)
	return err
}

// ============================================================
// Campaign Recipients
// ============================================================

func (r *WhatsAppRepository) AddCampaignRecipients(recipients []models.CampaignRecipient) error {
	query := `
		INSERT INTO campaign_recipients (
			campaign_id, client_id, recipient_name, recipient_phone, send_status
		) VALUES ($1, $2, $3, $4, $5)
	`

	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	for _, recipient := range recipients {
		_, err := tx.Exec(
			query,
			recipient.CampaignID, recipient.ClientID, recipient.RecipientName,
			recipient.RecipientPhone, recipient.SendStatus,
		)
		if err != nil {
			return fmt.Errorf("failed to add recipient: %w", err)
		}
	}

	return tx.Commit()
}

func (r *WhatsAppRepository) GetCampaignRecipients(campaignID string) ([]models.CampaignRecipient, error) {
	query := `
		SELECT id, campaign_id, client_id, recipient_name, recipient_phone, send_status,
		       provider_message_id, error_message, queued_at, sent_at, delivered_at,
		       read_at, failed_at, created_at, updated_at
		FROM campaign_recipients
		WHERE campaign_id = $1
		ORDER BY created_at ASC
	`

	rows, err := r.db.Query(query, campaignID)
	if err != nil {
		return nil, fmt.Errorf("failed to get campaign recipients: %w", err)
	}
	defer rows.Close()

	var recipients []models.CampaignRecipient
	for rows.Next() {
		var r models.CampaignRecipient
		err := rows.Scan(
			&r.ID, &r.CampaignID, &r.ClientID, &r.RecipientName, &r.RecipientPhone,
			&r.SendStatus, &r.ProviderMessageID, &r.ErrorMessage, &r.QueuedAt,
			&r.SentAt, &r.DeliveredAt, &r.ReadAt, &r.FailedAt, &r.CreatedAt, &r.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan recipient: %w", err)
		}
		recipients = append(recipients, r)
	}

	return recipients, nil
}

func (r *WhatsAppRepository) UpdateRecipientStatus(id, status, messageID string) error {
	query := `
		UPDATE campaign_recipients
		SET send_status = $1, provider_message_id = $2, sent_at = NOW()
		WHERE id = $3
	`
	_, err := r.db.Exec(query, status, messageID, id)
	return err
}

// ============================================================
// Templates
// ============================================================

func (r *WhatsAppRepository) CreateTemplate(template *models.MessageTemplate) error {
	query := `
		INSERT INTO message_templates (
			user_id, name, category, template_text, variables
		) VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at
	`

	return r.db.QueryRow(
		query,
		template.UserID, template.Name, template.Category, template.TemplateText,
		pq.Array(template.Variables),
	).Scan(&template.ID, &template.CreatedAt, &template.UpdatedAt)
}

func (r *WhatsAppRepository) GetTemplatesByUserID(userID string) ([]models.MessageTemplate, error) {
	query := `
		SELECT id, user_id, name, category, template_text, variables, usage_count,
		       last_used_at, created_at, updated_at
		FROM message_templates
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get templates: %w", err)
	}
	defer rows.Close()

	var templates []models.MessageTemplate
	for rows.Next() {
		var t models.MessageTemplate
		err := rows.Scan(
			&t.ID, &t.UserID, &t.Name, &t.Category, &t.TemplateText,
			pq.Array(&t.Variables), &t.UsageCount, &t.LastUsedAt,
			&t.CreatedAt, &t.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan template: %w", err)
		}
		templates = append(templates, t)
	}

	return templates, nil
}

func (r *WhatsAppRepository) DeleteTemplate(id, userID string) error {
	query := `DELETE FROM message_templates WHERE id = $1 AND user_id = $2`
	_, err := r.db.Exec(query, id, userID)
	return err
}

// ============================================================
// Message Logs
// ============================================================

func (r *WhatsAppRepository) CreateMessageLog(log *models.MessageLog) error {
	query := `
		INSERT INTO message_logs (
			user_id, campaign_id, client_id, message_type, message_text,
			recipient_phone, status, provider_message_id, error_message
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, sent_at
	`

	return r.db.QueryRow(
		query,
		log.UserID, log.CampaignID, log.ClientID, log.MessageType, log.MessageText,
		log.RecipientPhone, log.Status, log.ProviderMessageID, log.ErrorMessage,
	).Scan(&log.ID, &log.SentAt)
}

func (r *WhatsAppRepository) GetMessageLogsByUserID(userID string, limit int) ([]models.MessageLog, error) {
	query := `
		SELECT id, user_id, campaign_id, client_id, message_type, message_text,
		       recipient_phone, status, provider_message_id, error_message, sent_at
		FROM message_logs
		WHERE user_id = $1
		ORDER BY sent_at DESC
		LIMIT $2
	`

	rows, err := r.db.Query(query, userID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get message logs: %w", err)
	}
	defer rows.Close()

	var logs []models.MessageLog
	for rows.Next() {
		var l models.MessageLog
		err := rows.Scan(
			&l.ID, &l.UserID, &l.CampaignID, &l.ClientID, &l.MessageType,
			&l.MessageText, &l.RecipientPhone, &l.Status, &l.ProviderMessageID,
			&l.ErrorMessage, &l.SentAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan message log: %w", err)
		}
		logs = append(logs, l)
	}

	return logs, nil
}
