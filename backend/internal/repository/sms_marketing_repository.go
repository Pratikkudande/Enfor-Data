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
// DLT Template Methods
// ============================================================

func (r *SMSMarketingRepository) CreateDLTTemplate(template *models.SMSDLTTemplate) error {
	query := `
		INSERT INTO sms_dlt_templates (
			user_id, header, template_id, template_name, template_type, category,
			provider, template_content, sample_content, status, variable_count, updated_by
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id, created_at, updated_at
	`

	return r.db.QueryRow(
		query,
		template.UserID, template.Header, template.TemplateID, template.TemplateName,
		template.TemplateType, template.Category, template.Provider, template.TemplateContent,
		template.SampleContent, template.Status, template.VariableCount, template.UpdatedBy,
	).Scan(&template.ID, &template.CreatedAt, &template.UpdatedAt)
}

func (r *SMSMarketingRepository) GetDLTTemplatesByUserID(userID string) ([]models.SMSDLTTemplate, error) {
	query := `
		SELECT id, user_id, header, template_id, template_name, template_type, category,
			   provider, template_content, sample_content, status, variable_count,
			   updated_by, created_at, updated_at
		FROM sms_dlt_templates
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get DLT templates: %w", err)
	}
	defer rows.Close()

	var templates []models.SMSDLTTemplate
	for rows.Next() {
		var template models.SMSDLTTemplate
		err := rows.Scan(
			&template.ID, &template.UserID, &template.Header, &template.TemplateID,
			&template.TemplateName, &template.TemplateType, &template.Category, &template.Provider,
			&template.TemplateContent, &template.SampleContent, &template.Status,
			&template.VariableCount, &template.UpdatedBy, &template.CreatedAt, &template.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan DLT template: %w", err)
		}
		templates = append(templates, template)
	}

	return templates, nil
}

// GetAvailableTemplatesForBroker gets active/approved templates created by admin or the broker
func (r *SMSMarketingRepository) GetAvailableTemplatesForBroker(userID string) ([]models.SMSDLTTemplate, error) {
	query := `
		SELECT 
			t.id, t.user_id, t.header, t.template_id, t.template_name, t.template_type, t.category,
			t.provider, t.template_content, t.sample_content, t.status, t.variable_count,
			t.updated_by, t.created_at, t.updated_at
		FROM sms_dlt_templates t
		LEFT JOIN users u ON t.user_id = u.id
		WHERE (t.user_id = $1 OR u.role = 'admin')
		  AND (t.status = 'Active' OR t.status = 'Approved')
		ORDER BY t.created_at DESC
	`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get available DLT templates: %w", err)
	}
	defer rows.Close()

	var templates []models.SMSDLTTemplate
	for rows.Next() {
		var template models.SMSDLTTemplate
		err := rows.Scan(
			&template.ID, &template.UserID, &template.Header, &template.TemplateID,
			&template.TemplateName, &template.TemplateType, &template.Category, &template.Provider,
			&template.TemplateContent, &template.SampleContent, &template.Status,
			&template.VariableCount, &template.UpdatedBy, &template.CreatedAt, &template.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan DLT template: %w", err)
		}
		templates = append(templates, template)
	}

	return templates, nil
}

func (r *SMSMarketingRepository) GetDLTTemplateByID(templateID, userID string) (*models.SMSDLTTemplate, error) {
	template := &models.SMSDLTTemplate{}
	query := `
		SELECT id, user_id, header, template_id, template_name, template_type, category,
			   provider, template_content, sample_content, status, variable_count,
			   updated_by, created_at, updated_at
		FROM sms_dlt_templates
		WHERE id = $1 AND user_id = $2
	`

	err := r.db.QueryRow(query, templateID, userID).Scan(
		&template.ID, &template.UserID, &template.Header, &template.TemplateID,
		&template.TemplateName, &template.TemplateType, &template.Category, &template.Provider,
		&template.TemplateContent, &template.SampleContent, &template.Status,
		&template.VariableCount, &template.UpdatedBy, &template.CreatedAt, &template.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get DLT template: %w", err)
	}

	return template, nil
}

func (r *SMSMarketingRepository) UpdateDLTTemplate(template *models.SMSDLTTemplate) error {
	query := `
		UPDATE sms_dlt_templates SET
			header = $1, template_id = $2, template_name = $3, template_type = $4, category = $5,
			provider = $6, template_content = $7, sample_content = $8, status = $9,
			variable_count = $10, updated_by = $11, updated_at = NOW()
		WHERE id = $12 AND user_id = $13
	`

	_, err := r.db.Exec(
		query,
		template.Header, template.TemplateID, template.TemplateName, template.TemplateType, template.Category,
		template.Provider, template.TemplateContent, template.SampleContent, template.Status,
		template.VariableCount, template.UpdatedBy, template.ID, template.UserID,
	)

	return err
}

func (r *SMSMarketingRepository) DeleteDLTTemplate(templateID, userID string) error {
	query := `DELETE FROM sms_dlt_templates WHERE id = $1 AND user_id = $2`
	_, err := r.db.Exec(query, templateID, userID)
	return err
}

// Admin methods - Get all DLT templates across all users
func (r *SMSMarketingRepository) GetAllDLTTemplates() ([]models.SMSDLTTemplate, error) {
	query := `
		SELECT 
			t.id, t.user_id, 
			COALESCE(u.first_name || ' ' || u.last_name, u.email) as created_by_name,
			t.header, t.template_id, t.template_name, t.template_type, t.category,
			t.provider, t.template_content, t.sample_content, t.status, t.variable_count,
			t.updated_by, t.created_at, t.updated_at
		FROM sms_dlt_templates t
		LEFT JOIN users u ON t.user_id = u.id
		ORDER BY t.created_at DESC
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get all DLT templates: %w", err)
	}
	defer rows.Close()

	var templates []models.SMSDLTTemplate
	for rows.Next() {
		var template models.SMSDLTTemplate
		err := rows.Scan(
			&template.ID, &template.UserID, &template.CreatedByName,
			&template.Header, &template.TemplateID, &template.TemplateName,
			&template.TemplateType, &template.Category, &template.Provider, &template.TemplateContent,
			&template.SampleContent, &template.Status, &template.VariableCount,
			&template.UpdatedBy, &template.CreatedAt, &template.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan DLT template: %w", err)
		}
		templates = append(templates, template)
	}

	return templates, nil
}

// Admin method - Get DLT template by ID without user restriction
func (r *SMSMarketingRepository) GetDLTTemplateByIDAdmin(templateID string) (*models.SMSDLTTemplate, error) {
	template := &models.SMSDLTTemplate{}
	query := `
		SELECT 
			t.id, t.user_id,
			COALESCE(u.first_name || ' ' || u.last_name, u.email) as created_by_name,
			t.header, t.template_id, t.template_name, t.template_type, t.category,
			t.provider, t.template_content, t.sample_content, t.status, t.variable_count,
			t.updated_by, t.created_at, t.updated_at
		FROM sms_dlt_templates t
		LEFT JOIN users u ON t.user_id = u.id
		WHERE t.id = $1
	`

	err := r.db.QueryRow(query, templateID).Scan(
		&template.ID, &template.UserID, &template.CreatedByName,
		&template.Header, &template.TemplateID, &template.TemplateName,
		&template.TemplateType, &template.Category, &template.Provider, &template.TemplateContent,
		&template.SampleContent, &template.Status, &template.VariableCount,
		&template.UpdatedBy, &template.CreatedAt, &template.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get DLT template: %w", err)
	}

	return template, nil
}

// Admin method - Delete DLT template without user restriction
func (r *SMSMarketingRepository) DeleteDLTTemplateAdmin(templateID string) error {
	query := `DELETE FROM sms_dlt_templates WHERE id = $1`
	_, err := r.db.Exec(query, templateID)
	return err
}

// Admin method - Update DLT template without user restriction
func (r *SMSMarketingRepository) UpdateDLTTemplateAdmin(template *models.SMSDLTTemplate) error {
	query := `
		UPDATE sms_dlt_templates 
		SET header = $1, template_id = $2, template_name = $3, template_type = $4, category = $5,
		    provider = $6, template_content = $7, sample_content = $8, status = $9,
		    variable_count = $10, updated_by = $11, updated_at = NOW()
		WHERE id = $12
	`
	_, err := r.db.Exec(query,
		template.Header,
		template.TemplateID,
		template.TemplateName,
		template.TemplateType,
		template.Category,
		template.Provider,
		template.TemplateContent,
		template.SampleContent,
		template.Status,
		template.VariableCount,
		template.UpdatedBy,
		template.ID,
	)
	return err
}

// GetAvailableHeadersByType gets active/approved headers for a specific type
// For admin: returns all headers of that type with Active/Approved status
// For broker: returns headers created by admin or that broker with Active/Approved status
func (r *SMSMarketingRepository) GetAvailableHeadersByType(userID, userRole, headerType string) ([]models.SMSHeader, error) {
	var query string
	var args []interface{}

	if userRole == "admin" {
		// Admin sees all active/approved headers of the specified type
		query = `
			SELECT 
				h.id, h.user_id, h.header, h.provider, h.type, h.status,
				h.created_by, h.created_at, h.updated_by, h.updated_at,
				COALESCE(CONCAT(u.first_name, ' ', u.last_name), u.email) as created_by_name
			FROM sms_headers h
			LEFT JOIN users u ON h.created_by = u.id
			WHERE h.type = $1
			  AND (h.status = 'Active' OR h.status = 'Approved')
			ORDER BY h.created_at DESC
		`
		args = []interface{}{headerType}
	} else {
		// Broker sees headers created by admin or themselves with active/approved status
		query = `
			SELECT 
				h.id, h.user_id, h.header, h.provider, h.type, h.status,
				h.created_by, h.created_at, h.updated_by, h.updated_at,
				COALESCE(CONCAT(u.first_name, ' ', u.last_name), u.email) as created_by_name
			FROM sms_headers h
			LEFT JOIN users u ON h.created_by = u.id
			LEFT JOIN users creator ON h.created_by = creator.id
			WHERE h.type = $1
			  AND (h.status = 'Active' OR h.status = 'Approved')
			  AND (h.created_by = $2 OR creator.role = 'admin')
			ORDER BY h.created_at DESC
		`
		args = []interface{}{headerType, userID}
	}

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get available headers: %w", err)
	}
	defer rows.Close()

	var headers []models.SMSHeader
	for rows.Next() {
		var header models.SMSHeader
		err := rows.Scan(
			&header.ID, &header.UserID, &header.Header, &header.Provider, &header.Type, &header.Status,
			&header.CreatedBy, &header.CreatedAt, &header.UpdatedBy, &header.UpdatedAt,
			&header.CreatedByName,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan header: %w", err)
		}
		headers = append(headers, header)
	}

	return headers, nil
}

// ============================================================
// Message Log Methods
// ============================================================

func (r *SMSMarketingRepository) CreateMessageLog(log *models.SMSMessageLog) error {
	query := `
		INSERT INTO sms_message_logs (
			user_id, campaign_id, client_id, message_type, message_text,
			recipient_phone, status, provider_message_id, batch_id, category, error_message
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, sent_at
	`

	return r.db.QueryRow(
		query,
		log.UserID, log.CampaignID, log.ClientID, log.MessageType, log.MessageText,
		log.RecipientPhone, log.Status, log.ProviderMessageID, log.BatchID, log.Category, log.ErrorMessage,
	).Scan(&log.ID, &log.SentAt)
}

func (r *SMSMarketingRepository) GetMessageLogsByUserID(userID string, limit int) ([]models.SMSMessageLog, error) {
	query := `
		SELECT id, user_id, campaign_id, client_id, message_type, message_text,
			   recipient_phone, status, provider_message_id, batch_id, category,
			   status_description, error_message, COALESCE(sent_at, NOW()) AS sent_at, delivered_at
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
			&log.BatchID, &log.Category, &log.StatusDescription, &log.ErrorMessage,
			&log.SentAt, &log.DeliveredAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan message log: %w", err)
		}
		logs = append(logs, log)
	}

	return logs, nil
}

func (r *SMSMarketingRepository) GetMessageLogByID(userID, logID string) (*models.SMSMessageLog, error) {
	log := &models.SMSMessageLog{}
	err := r.db.QueryRow(`SELECT id, user_id, campaign_id, client_id, message_type, message_text,
        recipient_phone, status, provider_message_id, batch_id, category, status_description,
		error_message, COALESCE(sent_at, NOW()) AS sent_at, delivered_at FROM sms_message_logs WHERE id = $1 AND user_id = $2`, logID, userID).Scan(
		&log.ID, &log.UserID, &log.CampaignID, &log.ClientID, &log.MessageType, &log.MessageText,
		&log.RecipientPhone, &log.Status, &log.ProviderMessageID, &log.BatchID, &log.Category,
		&log.StatusDescription, &log.ErrorMessage, &log.SentAt, &log.DeliveredAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get message log: %w", err)
	}
	return log, nil
}

func (r *SMSMarketingRepository) UpdateMessageLogDelivery(logID, status, description string, deliveredAt *time.Time) error {
	_, err := r.db.Exec(`UPDATE sms_message_logs SET status = $1, status_description = $2, delivered_at = $3 WHERE id = $4`, status, description, deliveredAt, logID)
	return err
}

// ============================================================
// SMS Header Methods
// ============================================================

func (r *SMSMarketingRepository) CreateSMSHeader(header *models.SMSHeader) error {
	query := `
		INSERT INTO sms_headers (
			user_id, header, provider, type, status, created_by
		) VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at
	`

	return r.db.QueryRow(
		query,
		header.UserID, header.Header, header.Provider, header.Type, header.Status, header.CreatedBy,
	).Scan(&header.ID, &header.CreatedAt, &header.UpdatedAt)
}

func (r *SMSMarketingRepository) GetSMSHeadersByUserID(userID string) ([]models.SMSHeader, error) {
	query := `
		SELECT 
			h.id, h.user_id, h.header, h.provider, h.type, h.status,
			h.created_by, h.created_at, h.updated_by, h.updated_at,
			COALESCE(CONCAT(u.first_name, ' ', u.last_name), u.email) as created_by_name
		FROM sms_headers h
		LEFT JOIN users u ON h.created_by = u.id
		WHERE h.user_id = $1
		ORDER BY h.created_at DESC
	`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var headers []models.SMSHeader
	for rows.Next() {
		var header models.SMSHeader
		err := rows.Scan(
			&header.ID, &header.UserID, &header.Header, &header.Provider, &header.Type, &header.Status,
			&header.CreatedBy, &header.CreatedAt, &header.UpdatedBy, &header.UpdatedAt,
			&header.CreatedByName,
		)
		if err != nil {
			return nil, err
		}
		headers = append(headers, header)
	}

	return headers, nil
}

func (r *SMSMarketingRepository) GetSMSHeaderByID(headerID, userID string) (*models.SMSHeader, error) {
	query := `
		SELECT 
			h.id, h.user_id, h.header, h.provider, h.type, h.status,
			h.created_by, h.created_at, h.updated_by, h.updated_at,
			COALESCE(CONCAT(u.first_name, ' ', u.last_name), u.email) as created_by_name
		FROM sms_headers h
		LEFT JOIN users u ON h.created_by = u.id
		WHERE h.id = $1 AND h.user_id = $2
	`

	var header models.SMSHeader
	err := r.db.QueryRow(query, headerID, userID).Scan(
		&header.ID, &header.UserID, &header.Header, &header.Provider, &header.Type, &header.Status,
		&header.CreatedBy, &header.CreatedAt, &header.UpdatedBy, &header.UpdatedAt,
		&header.CreatedByName,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &header, nil
}

func (r *SMSMarketingRepository) UpdateSMSHeader(header *models.SMSHeader) error {
	query := `
		UPDATE sms_headers
		SET header = $1, provider = $2, type = $3, status = $4,
		    updated_by = $5, updated_at = $6
		WHERE id = $7 AND user_id = $8
	`

	header.UpdatedAt = time.Now()
	_, err := r.db.Exec(
		query,
		header.Header, header.Provider, header.Type, header.Status,
		header.UpdatedBy, header.UpdatedAt, header.ID, header.UserID,
	)

	return err
}

func (r *SMSMarketingRepository) DeleteSMSHeader(headerID, userID string) error {
	query := `DELETE FROM sms_headers WHERE id = $1 AND user_id = $2`
	_, err := r.db.Exec(query, headerID, userID)
	return err
}

// Admin methods for SMS Headers
func (r *SMSMarketingRepository) GetAllSMSHeaders() ([]models.SMSHeader, error) {
	query := `
		SELECT 
			h.id, h.user_id, h.header, h.provider, h.type, h.status,
			h.created_by, h.created_at, h.updated_by, h.updated_at,
			COALESCE(CONCAT(u.first_name, ' ', u.last_name), u.email) as created_by_name
		FROM sms_headers h
		LEFT JOIN users u ON h.created_by = u.id
		ORDER BY h.created_at DESC
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var headers []models.SMSHeader
	for rows.Next() {
		var header models.SMSHeader
		err := rows.Scan(
			&header.ID, &header.UserID, &header.Header, &header.Provider, &header.Type, &header.Status,
			&header.CreatedBy, &header.CreatedAt, &header.UpdatedBy, &header.UpdatedAt,
			&header.CreatedByName,
		)
		if err != nil {
			return nil, err
		}
		headers = append(headers, header)
	}

	return headers, nil
}

func (r *SMSMarketingRepository) GetSMSHeaderByIDAdmin(headerID string) (*models.SMSHeader, error) {
	query := `
		SELECT 
			h.id, h.user_id, h.header, h.provider, h.type, h.status,
			h.created_by, h.created_at, h.updated_by, h.updated_at,
			COALESCE(CONCAT(u.first_name, ' ', u.last_name), u.email) as created_by_name
		FROM sms_headers h
		LEFT JOIN users u ON h.created_by = u.id
		WHERE h.id = $1
	`

	var header models.SMSHeader
	err := r.db.QueryRow(query, headerID).Scan(
		&header.ID, &header.UserID, &header.Header, &header.Provider, &header.Type, &header.Status,
		&header.CreatedBy, &header.CreatedAt, &header.UpdatedBy, &header.UpdatedAt,
		&header.CreatedByName,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &header, nil
}
