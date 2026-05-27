package repository

import (
	"database/sql"
	"fmt"
	"time"

	"enfor-data-backend/internal/database"
	"enfor-data-backend/internal/models"
)

type SMSMarketingRepository struct {
	db *database.DB
}

func NewSMSMarketingRepository(db *database.DB) *SMSMarketingRepository {
	return &SMSMarketingRepository{db: db}
}

// ============================================================
// SMS Account Methods
// ============================================================

func (r *SMSMarketingRepository) CreateAccount(account *models.SMSAccount) error {
	query := `
		INSERT INTO sms_accounts (
			user_id, msg91_auth_key, msg91_auth_key_encrypted, msg91_sender_id,
			status, message_limit, messages_sent_today
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at, updated_at
	`

	return r.db.QueryRow(
		query,
		account.UserID, account.MSG91AuthKey, account.MSG91AuthKeyEncrypted,
		account.MSG91SenderID, account.Status, account.MessageLimit, account.MessagesSentToday,
	).Scan(&account.ID, &account.CreatedAt, &account.UpdatedAt)
}

func (r *SMSMarketingRepository) GetAccountByUserID(userID string) (*models.SMSAccount, error) {
	account := &models.SMSAccount{}
	query := `
		SELECT id, user_id, msg91_auth_key, msg91_auth_key_encrypted, msg91_sender_id,
			   status, connection_error, message_limit, messages_sent_today, last_reset_date,
			   connected_at, last_used_at, created_at, updated_at
		FROM sms_accounts
		WHERE user_id = $1
	`

	err := r.db.QueryRow(query, userID).Scan(
		&account.ID, &account.UserID, &account.MSG91AuthKey, &account.MSG91AuthKeyEncrypted,
		&account.MSG91SenderID, &account.Status, &account.ConnectionError, &account.MessageLimit,
		&account.MessagesSentToday, &account.LastResetDate, &account.ConnectedAt, &account.LastUsedAt,
		&account.CreatedAt, &account.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get SMS account: %w", err)
	}

	return account, nil
}

func (r *SMSMarketingRepository) UpdateAccount(account *models.SMSAccount) error {
	query := `
		UPDATE sms_accounts SET
			msg91_auth_key = $1, msg91_auth_key_encrypted = $2, msg91_sender_id = $3,
			status = $4, connection_error = $5, message_limit = $6, messages_sent_today = $7,
			last_reset_date = $8, connected_at = $9, last_used_at = $10, updated_at = NOW()
		WHERE id = $11
	`

	_, err := r.db.Exec(
		query,
		account.MSG91AuthKey, account.MSG91AuthKeyEncrypted, account.MSG91SenderID,
		account.Status, account.ConnectionError, account.MessageLimit, account.MessagesSentToday,
		account.LastResetDate, account.ConnectedAt, account.LastUsedAt, account.ID,
	)

	return err
}

func (r *SMSMarketingRepository) UpdateAccountStatus(userID, status string) error {
	query := `UPDATE sms_accounts SET status = $1, updated_at = NOW() WHERE user_id = $2`
	_, err := r.db.Exec(query, status, userID)
	return err
}

// ============================================================
// Campaign Methods
// ============================================================

func (r *SMSMarketingRepository) CreateCampaign(campaign *models.SMSCampaign) error {
	query := `
		INSERT INTO sms_campaigns (
			user_id, sms_account_id, name, message_text, total_recipients,
			successful_sends, failed_sends, pending_sends, status
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, created_at, updated_at
	`

	return r.db.QueryRow(
		query,
		campaign.UserID, campaign.SMSAccountID, campaign.Name, campaign.MessageText,
		campaign.TotalRecipients, campaign.SuccessfulSends, campaign.FailedSends,
		campaign.PendingSends, campaign.Status,
	).Scan(&campaign.ID, &campaign.CreatedAt, &campaign.UpdatedAt)
}

func (r *SMSMarketingRepository) GetCampaignsByUserID(userID string) ([]models.SMSCampaign, error) {
	query := `
		SELECT id, user_id, sms_account_id, name, message_text, total_recipients,
			   successful_sends, failed_sends, pending_sends, status, scheduled_at,
			   started_at, completed_at, error_message, created_at, updated_at
		FROM sms_campaigns
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get campaigns: %w", err)
	}
	defer rows.Close()

	var campaigns []models.SMSCampaign
	for rows.Next() {
		var campaign models.SMSCampaign
		err := rows.Scan(
			&campaign.ID, &campaign.UserID, &campaign.SMSAccountID, &campaign.Name,
			&campaign.MessageText, &campaign.TotalRecipients, &campaign.SuccessfulSends,
			&campaign.FailedSends, &campaign.PendingSends, &campaign.Status,
			&campaign.ScheduledAt, &campaign.StartedAt, &campaign.CompletedAt,
			&campaign.ErrorMessage, &campaign.CreatedAt, &campaign.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan campaign: %w", err)
		}
		campaigns = append(campaigns, campaign)
	}

	return campaigns, nil
}

func (r *SMSMarketingRepository) GetCampaignByID(campaignID string) (*models.SMSCampaign, error) {
	campaign := &models.SMSCampaign{}
	query := `
		SELECT id, user_id, sms_account_id, name, message_text, total_recipients,
			   successful_sends, failed_sends, pending_sends, status, scheduled_at,
			   started_at, completed_at, error_message, created_at, updated_at
		FROM sms_campaigns
		WHERE id = $1
	`

	err := r.db.QueryRow(query, campaignID).Scan(
		&campaign.ID, &campaign.UserID, &campaign.SMSAccountID, &campaign.Name,
		&campaign.MessageText, &campaign.TotalRecipients, &campaign.SuccessfulSends,
		&campaign.FailedSends, &campaign.PendingSends, &campaign.Status,
		&campaign.ScheduledAt, &campaign.StartedAt, &campaign.CompletedAt,
		&campaign.ErrorMessage, &campaign.CreatedAt, &campaign.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get campaign: %w", err)
	}

	return campaign, nil
}

func (r *SMSMarketingRepository) UpdateCampaignStatus(campaignID, status string) error {
	query := `UPDATE sms_campaigns SET status = $1, updated_at = NOW() WHERE id = $2`
	_, err := r.db.Exec(query, status, campaignID)
	return err
}

func (r *SMSMarketingRepository) UpdateCampaignStats(campaignID string, successful, failed, pending int) error {
	query := `
		UPDATE sms_campaigns SET
			successful_sends = $1, failed_sends = $2, pending_sends = $3, updated_at = NOW()
		WHERE id = $4
	`
	_, err := r.db.Exec(query, successful, failed, pending, campaignID)
	return err
}

// ============================================================
// Campaign Recipients Methods
// ============================================================

func (r *SMSMarketingRepository) AddCampaignRecipients(recipients []models.SMSCampaignRecipient) error {
	query := `
		INSERT INTO sms_campaign_recipients (
			campaign_id, client_id, recipient_name, recipient_phone, send_status
		) VALUES ($1, $2, $3, $4, $5)
	`

	for _, recipient := range recipients {
		_, err := r.db.Exec(
			query,
			recipient.CampaignID, recipient.ClientID, recipient.RecipientName,
			recipient.RecipientPhone, recipient.SendStatus,
		)
		if err != nil {
			return fmt.Errorf("failed to add recipient: %w", err)
		}
	}

	return nil
}

func (r *SMSMarketingRepository) GetCampaignRecipients(campaignID string) ([]models.SMSCampaignRecipient, error) {
	query := `
		SELECT id, campaign_id, client_id, recipient_name, recipient_phone, send_status,
			   provider_message_id, error_message, queued_at, sent_at, delivered_at,
			   failed_at, created_at, updated_at
		FROM sms_campaign_recipients
		WHERE campaign_id = $1
		ORDER BY created_at ASC
	`

	rows, err := r.db.Query(query, campaignID)
	if err != nil {
		return nil, fmt.Errorf("failed to get recipients: %w", err)
	}
	defer rows.Close()

	var recipients []models.SMSCampaignRecipient
	for rows.Next() {
		var recipient models.SMSCampaignRecipient
		err := rows.Scan(
			&recipient.ID, &recipient.CampaignID, &recipient.ClientID, &recipient.RecipientName,
			&recipient.RecipientPhone, &recipient.SendStatus, &recipient.ProviderMessageID,
			&recipient.ErrorMessage, &recipient.QueuedAt, &recipient.SentAt, &recipient.DeliveredAt,
			&recipient.FailedAt, &recipient.CreatedAt, &recipient.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan recipient: %w", err)
		}
		recipients = append(recipients, recipient)
	}

	return recipients, nil
}

func (r *SMSMarketingRepository) UpdateRecipientStatus(recipientID, status, messageID string) error {
	now := time.Now()
	query := `
		UPDATE sms_campaign_recipients SET
			send_status = $1, provider_message_id = $2, sent_at = $3, updated_at = NOW()
		WHERE id = $4
	`
	_, err := r.db.Exec(query, status, messageID, now, recipientID)
	return err
}

// ============================================================
// Template Methods
// ============================================================

func (r *SMSMarketingRepository) CreateTemplate(template *models.SMSMessageTemplate) error {
	query := `
		INSERT INTO sms_message_templates (
			user_id, name, category, template_text, variables, usage_count
		) VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at
	`

	return r.db.QueryRow(
		query,
		template.UserID, template.Name, template.Category, template.TemplateText,
		template.Variables, template.UsageCount,
	).Scan(&template.ID, &template.CreatedAt, &template.UpdatedAt)
}

func (r *SMSMarketingRepository) GetTemplatesByUserID(userID string) ([]models.SMSMessageTemplate, error) {
	query := `
		SELECT id, user_id, name, category, template_text, variables, usage_count,
			   last_used_at, created_at, updated_at
		FROM sms_message_templates
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get templates: %w", err)
	}
	defer rows.Close()

	var templates []models.SMSMessageTemplate
	for rows.Next() {
		var template models.SMSMessageTemplate
		err := rows.Scan(
			&template.ID, &template.UserID, &template.Name, &template.Category,
			&template.TemplateText, &template.Variables, &template.UsageCount,
			&template.LastUsedAt, &template.CreatedAt, &template.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan template: %w", err)
		}
		templates = append(templates, template)
	}

	return templates, nil
}

func (r *SMSMarketingRepository) DeleteTemplate(templateID, userID string) error {
	query := `DELETE FROM sms_message_templates WHERE id = $1 AND user_id = $2`
	_, err := r.db.Exec(query, templateID, userID)
	return err
}

// ============================================================
// Message Log Methods
// ============================================================

func (r *SMSMarketingRepository) CreateMessageLog(log *models.SMSMessageLog) error {
	query := `
		INSERT INTO sms_message_logs (
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

func (r *SMSMarketingRepository) GetMessageLogsByUserID(userID string, limit int) ([]models.SMSMessageLog, error) {
	query := `
		SELECT id, user_id, campaign_id, client_id, message_type, message_text,
			   recipient_phone, status, provider_message_id, error_message, sent_at
		FROM sms_message_logs
		WHERE user_id = $1
		ORDER BY sent_at DESC
		LIMIT $2
	`

	rows, err := r.db.Query(query, userID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get message logs: %w", err)
	}
	defer rows.Close()

	var logs []models.SMSMessageLog
	for rows.Next() {
		var log models.SMSMessageLog
		err := rows.Scan(
			&log.ID, &log.UserID, &log.CampaignID, &log.ClientID, &log.MessageType,
			&log.MessageText, &log.RecipientPhone, &log.Status, &log.ProviderMessageID,
			&log.ErrorMessage, &log.SentAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan message log: %w", err)
		}
		logs = append(logs, log)
	}

	return logs, nil
}
