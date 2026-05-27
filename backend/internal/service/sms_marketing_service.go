package service

import (
	"fmt"
	"time"

	"enfor-data-backend/internal/models"
	"enfor-data-backend/internal/repository"
)

type SMSMarketingService struct {
	repo       *repository.SMSMarketingRepository
	clientRepo *repository.ClientRepository
	smsService *SMSService
}

func NewSMSMarketingService(
	repo *repository.SMSMarketingRepository,
	clientRepo *repository.ClientRepository,
	smsService *SMSService,
) *SMSMarketingService {
	return &SMSMarketingService{
		repo:       repo,
		clientRepo: clientRepo,
		smsService: smsService,
	}
}

// ============================================================
// Account Management
// ============================================================

func (s *SMSMarketingService) GetAccountStatus(userID string) (*models.SMSAccount, error) {
	account, err := s.repo.GetAccountByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get account: %w", err)
	}

	return account, nil
}

func (s *SMSMarketingService) ConnectAccount(userID, authKey, senderID string) error {
	// Check if account already exists
	existing, err := s.repo.GetAccountByUserID(userID)
	if err != nil {
		return fmt.Errorf("failed to check existing account: %w", err)
	}

	now := time.Now()

	if existing != nil {
		// Update existing account
		existing.MSG91AuthKey = &authKey
		existing.MSG91AuthKeyEncrypted = &authKey // TODO: Encrypt in production
		existing.MSG91SenderID = senderID
		existing.Status = "connected"
		existing.ConnectedAt = &now

		return s.repo.UpdateAccount(existing)
	}

	// Create new account
	account := &models.SMSAccount{
		UserID:                userID,
		MSG91AuthKey:          &authKey,
		MSG91AuthKeyEncrypted: &authKey, // TODO: Encrypt in production
		MSG91SenderID:         senderID,
		Status:                "connected",
		MessageLimit:          1000,
		MessagesSentToday:     0,
		ConnectedAt:           &now,
	}

	return s.repo.CreateAccount(account)
}

func (s *SMSMarketingService) DisconnectAccount(userID string) error {
	return s.repo.UpdateAccountStatus(userID, "not_connected")
}

// ============================================================
// Message Sending
// ============================================================

func (s *SMSMarketingService) SendIndividualMessage(userID, clientID, message string) error {
	// Get client details
	client, err := s.clientRepo.GetByID(clientID)
	if err != nil {
		return fmt.Errorf("failed to get client: %w", err)
	}
	if client == nil {
		return fmt.Errorf("client not found")
	}

	// Verify ownership
	if client.BrokerID != userID {
		return fmt.Errorf("unauthorized: client does not belong to user")
	}

	// Send SMS
	err = s.smsService.SendSMS(client.Phone, message)
	if err != nil {
		// Log failed message
		errMsg := err.Error()
		log := &models.SMSMessageLog{
			UserID:         userID,
			ClientID:       &clientID,
			MessageType:    "individual",
			MessageText:    message,
			RecipientPhone: client.Phone,
			Status:         "failed",
			ErrorMessage:   &errMsg,
		}
		s.repo.CreateMessageLog(log)

		return fmt.Errorf("failed to send SMS: %w", err)
	}

	// Log successful message
	log := &models.SMSMessageLog{
		UserID:         userID,
		ClientID:       &clientID,
		MessageType:    "individual",
		MessageText:    message,
		RecipientPhone: client.Phone,
		Status:         "sent",
	}

	if err := s.repo.CreateMessageLog(log); err != nil {
		fmt.Printf("Failed to create message log: %v\n", err)
	}

	return nil
}

func (s *SMSMarketingService) SendBulkMessage(userID string, clientIDs []string, message string) (int, int, error) {
	successful := 0
	failed := 0

	for _, clientID := range clientIDs {
		err := s.SendIndividualMessage(userID, clientID, message)
		if err != nil {
			failed++
		} else {
			successful++
		}

		// Rate limiting: 1 message per second to avoid MSG91 rate limits
		time.Sleep(1 * time.Second)
	}

	return successful, failed, nil
}

// ============================================================
// Campaign Management
// ============================================================

func (s *SMSMarketingService) CreateCampaign(userID, name, message string, clientIDs []string) (*models.SMSCampaign, error) {
	// Get SMS account
	account, err := s.repo.GetAccountByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get account: %w", err)
	}
	if account == nil || account.Status != "connected" {
		return nil, fmt.Errorf("SMS account not connected")
	}

	// Create campaign
	campaign := &models.SMSCampaign{
		UserID:          userID,
		SMSAccountID:    &account.ID,
		Name:            name,
		MessageText:     message,
		TotalRecipients: len(clientIDs),
		SuccessfulSends: 0,
		FailedSends:     0,
		PendingSends:    len(clientIDs),
		Status:          "draft",
	}

	if err := s.repo.CreateCampaign(campaign); err != nil {
		return nil, fmt.Errorf("failed to create campaign: %w", err)
	}

	// Add recipients
	var recipients []models.SMSCampaignRecipient
	for _, clientID := range clientIDs {
		client, err := s.clientRepo.GetByID(clientID)
		if err != nil || client == nil {
			continue
		}

		// Verify ownership
		if client.BrokerID != userID {
			continue
		}

		name := client.FirstName + " " + client.LastName
		recipients = append(recipients, models.SMSCampaignRecipient{
			CampaignID:     campaign.ID,
			ClientID:       clientID,
			RecipientName:  &name,
			RecipientPhone: client.Phone,
			SendStatus:     "pending",
		})
	}

	if err := s.repo.AddCampaignRecipients(recipients); err != nil {
		return nil, fmt.Errorf("failed to add recipients: %w", err)
	}

	return campaign, nil
}

func (s *SMSMarketingService) SendCampaign(campaignID, userID string) error {
	// Get campaign
	campaign, err := s.repo.GetCampaignByID(campaignID)
	if err != nil {
		return fmt.Errorf("failed to get campaign: %w", err)
	}
	if campaign == nil {
		return fmt.Errorf("campaign not found")
	}
	if campaign.UserID != userID {
		return fmt.Errorf("unauthorized")
	}

	// Update campaign status
	now := time.Now()
	campaign.Status = "sending"
	campaign.StartedAt = &now
	if err := s.repo.UpdateCampaignStatus(campaign.ID, "sending"); err != nil {
		return fmt.Errorf("failed to update campaign status: %w", err)
	}

	// Get recipients
	recipients, err := s.repo.GetCampaignRecipients(campaign.ID)
	if err != nil {
		return fmt.Errorf("failed to get recipients: %w", err)
	}

	// Send messages
	successful := 0
	failed := 0

	for _, recipient := range recipients {
		if recipient.SendStatus != "pending" {
			continue
		}

		err := s.smsService.SendSMS(recipient.RecipientPhone, campaign.MessageText)
		if err != nil {
			failed++
			s.repo.UpdateRecipientStatus(recipient.ID, "failed", "")
		} else {
			successful++
			s.repo.UpdateRecipientStatus(recipient.ID, "sent", "")
		}

		// Log the message
		log := &models.SMSMessageLog{
			UserID:         userID,
			CampaignID:     &campaign.ID,
			ClientID:       &recipient.ClientID,
			MessageType:    "campaign",
			MessageText:    campaign.MessageText,
			RecipientPhone: recipient.RecipientPhone,
			Status:         "sent",
		}
		if err != nil {
			log.Status = "failed"
			errMsg := err.Error()
			log.ErrorMessage = &errMsg
		}
		s.repo.CreateMessageLog(log)

		// Rate limiting: 1 message per second
		time.Sleep(1 * time.Second)
	}

	// Update campaign stats
	pending := campaign.TotalRecipients - successful - failed
	if err := s.repo.UpdateCampaignStats(campaign.ID, successful, failed, pending); err != nil {
		return fmt.Errorf("failed to update campaign stats: %w", err)
	}

	// Mark campaign as completed
	if err := s.repo.UpdateCampaignStatus(campaign.ID, "completed"); err != nil {
		return fmt.Errorf("failed to complete campaign: %w", err)
	}

	return nil
}

func (s *SMSMarketingService) GetCampaigns(userID string) ([]models.SMSCampaign, error) {
	return s.repo.GetCampaignsByUserID(userID)
}

func (s *SMSMarketingService) GetCampaignDetails(campaignID, userID string) (*models.SMSCampaign, []models.SMSCampaignRecipient, error) {
	campaign, err := s.repo.GetCampaignByID(campaignID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get campaign: %w", err)
	}
	if campaign == nil {
		return nil, nil, fmt.Errorf("campaign not found")
	}
	if campaign.UserID != userID {
		return nil, nil, fmt.Errorf("unauthorized")
	}

	recipients, err := s.repo.GetCampaignRecipients(campaignID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get recipients: %w", err)
	}

	return campaign, recipients, nil
}

// ============================================================
// Templates
// ============================================================

func (s *SMSMarketingService) CreateTemplate(userID, name, category, text string, variables []string) error {
	template := &models.SMSMessageTemplate{
		UserID:       userID,
		Name:         name,
		Category:     category,
		TemplateText: text,
		Variables:    variables,
		UsageCount:   0,
	}

	return s.repo.CreateTemplate(template)
}

func (s *SMSMarketingService) GetTemplates(userID string) ([]models.SMSMessageTemplate, error) {
	return s.repo.GetTemplatesByUserID(userID)
}

func (s *SMSMarketingService) DeleteTemplate(templateID, userID string) error {
	return s.repo.DeleteTemplate(templateID, userID)
}

// ============================================================
// Analytics
// ============================================================

func (s *SMSMarketingService) GetMessageLogs(userID string, limit int) ([]models.SMSMessageLog, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	return s.repo.GetMessageLogsByUserID(userID, limit)
}

func (s *SMSMarketingService) GetStats(userID string) (map[string]interface{}, error) {
	// Get account
	account, err := s.repo.GetAccountByUserID(userID)
	if err != nil {
		return nil, err
	}

	// Get recent logs
	logs, err := s.repo.GetMessageLogsByUserID(userID, 1000)
	if err != nil {
		return nil, err
	}

	// Calculate stats
	totalSent := len(logs)
	successful := 0
	failed := 0

	for _, log := range logs {
		if log.Status == "sent" || log.Status == "delivered" {
			successful++
		} else {
			failed++
		}
	}

	successRate := 0.0
	if totalSent > 0 {
		successRate = float64(successful) / float64(totalSent) * 100
	}

	stats := map[string]interface{}{
		"total_sent":          totalSent,
		"successful":          successful,
		"failed":              failed,
		"success_rate":        successRate,
		"messages_sent_today": 0,
		"message_limit":       1000,
	}

	if account != nil {
		stats["messages_sent_today"] = account.MessagesSentToday
		stats["message_limit"] = account.MessageLimit
	}

	return stats, nil
}
