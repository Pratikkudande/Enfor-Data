package service

import (
	"enfor-data-backend/internal/models"
	"enfor-data-backend/internal/provider"
	"enfor-data-backend/internal/repository"
	"fmt"
	"time"
)

type WhatsAppService struct {
	repo       *repository.WhatsAppRepository
	clientRepo *repository.ClientRepository
}

func NewWhatsAppService(
	repo *repository.WhatsAppRepository,
	clientRepo *repository.ClientRepository,
) *WhatsAppService {
	return &WhatsAppService{
		repo:       repo,
		clientRepo: clientRepo,
	}
}

// getProviderForUser creates a Meta WhatsApp provider for the specific user
func (s *WhatsAppService) getProviderForUser(userID string) (provider.MessagingProvider, error) {
	account, err := s.repo.GetAccountByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get account: %w", err)
	}

	if account == nil || account.Status != "connected" {
		return nil, fmt.Errorf("WhatsApp account not connected")
	}

	if account.PhoneNumberID == nil || account.AccessTokenEncrypted == nil {
		return nil, fmt.Errorf("WhatsApp API credentials not configured")
	}

	// Create Meta WhatsApp provider with user's credentials
	return provider.NewMetaWhatsAppProvider(*account.PhoneNumberID, *account.AccessTokenEncrypted), nil
}

// ============================================================
// Account Management
// ============================================================

func (s *WhatsAppService) GetAccountStatus(userID string) (*models.WhatsAppAccount, error) {
	account, err := s.repo.GetAccountByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get account: %w", err)
	}

	// If no account exists, return nil (not an error)
	if account == nil {
		return nil, nil
	}

	return account, nil
}

func (s *WhatsAppService) ConnectAccount(userID, phoneNumber, displayName string) error {
	// Check if account already exists
	existing, err := s.repo.GetAccountByUserID(userID)
	if err != nil {
		return fmt.Errorf("failed to check existing account: %w", err)
	}

	now := time.Now()
	
	if existing != nil {
		// Update existing account
		existing.PhoneNumber = phoneNumber
		existing.DisplayName = &displayName
		existing.Status = "connected"
		existing.ConnectedAt = &now
		existing.ConnectionError = nil
		
		return s.repo.UpdateAccount(existing)
	}

	// Create new account
	account := &models.WhatsAppAccount{
		UserID:            userID,
		PhoneNumber:       phoneNumber,
		DisplayName:       &displayName,
		Status:            "connected",
		MessageLimit:      1000,
		MessagesSentToday: 0,
		ConnectedAt:       &now,
	}

	return s.repo.CreateAccount(account)
}

func (s *WhatsAppService) DisconnectAccount(userID string) error {
	return s.repo.UpdateAccountStatus(userID, "not_connected")
}

// ============================================================
// Message Sending
// ============================================================

func (s *WhatsAppService) SendIndividualMessage(userID, clientID, message string) error {
	// Get user's Meta WhatsApp provider
	msgProvider, err := s.getProviderForUser(userID)
	if err != nil {
		return fmt.Errorf("failed to get messaging provider: %w", err)
	}

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

	// Send message via provider
	result, err := msgProvider.SendMessage(client.Phone, message)
	if err != nil {
		return fmt.Errorf("failed to send message: %w", err)
	}

	// Log the message
	log := &models.MessageLog{
		UserID:            userID,
		ClientID:          &clientID,
		MessageType:       "individual",
		MessageText:       message,
		RecipientPhone:    client.Phone,
		Status:            result.Status,
		ProviderMessageID: &result.MessageID,
	}
	if result.Error != "" {
		log.ErrorMessage = &result.Error
	}

	if err := s.repo.CreateMessageLog(log); err != nil {
		// Log error but don't fail the request
		fmt.Printf("Failed to create message log: %v\n", err)
	}

	if result.Status == "failed" {
		return fmt.Errorf("message delivery failed: %s", result.Error)
	}

	return nil
}

func (s *WhatsAppService) CreateCampaign(userID, name, message string, clientIDs []string) (*models.Campaign, error) {
	// Get WhatsApp account
	account, err := s.repo.GetAccountByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get account: %w", err)
	}
	if account == nil || account.Status != "connected" {
		return nil, fmt.Errorf("WhatsApp account not connected")
	}

	// Create campaign
	campaign := &models.Campaign{
		UserID:            userID,
		WhatsAppAccountID: &account.ID,
		Name:              name,
		MessageText:       message,
		TotalRecipients:   len(clientIDs),
		SuccessfulSends:   0,
		FailedSends:       0,
		PendingSends:      len(clientIDs),
		Status:            "draft",
	}

	if err := s.repo.CreateCampaign(campaign); err != nil {
		return nil, fmt.Errorf("failed to create campaign: %w", err)
	}

	// Add recipients
	var recipients []models.CampaignRecipient
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
		recipients = append(recipients, models.CampaignRecipient{
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

func (s *WhatsAppService) SendCampaign(campaignID, userID string) error {
	// Get user's Meta WhatsApp provider
	msgProvider, err := s.getProviderForUser(userID)
	if err != nil {
		return fmt.Errorf("failed to get messaging provider: %w", err)
	}

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

		result, err := msgProvider.SendMessage(recipient.RecipientPhone, campaign.MessageText)
		if err != nil || result.Status == "failed" {
			failed++
			s.repo.UpdateRecipientStatus(recipient.ID, "failed", "")
		} else {
			successful++
			s.repo.UpdateRecipientStatus(recipient.ID, "sent", result.MessageID)
		}

		// Log the message
		log := &models.MessageLog{
			UserID:            userID,
			CampaignID:        &campaign.ID,
			ClientID:          &recipient.ClientID,
			MessageType:       "campaign",
			MessageText:       campaign.MessageText,
			RecipientPhone:    recipient.RecipientPhone,
			Status:            result.Status,
			ProviderMessageID: &result.MessageID,
		}
		if result.Error != "" {
			log.ErrorMessage = &result.Error
		}
		s.repo.CreateMessageLog(log)
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

// ============================================================
// Campaign Management
// ============================================================

func (s *WhatsAppService) GetCampaigns(userID string) ([]models.Campaign, error) {
	return s.repo.GetCampaignsByUserID(userID)
}

func (s *WhatsAppService) GetCampaignDetails(campaignID, userID string) (*models.Campaign, []models.CampaignRecipient, error) {
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

func (s *WhatsAppService) CreateTemplate(userID, name, category, text string, variables []string) error {
	template := &models.MessageTemplate{
		UserID:       userID,
		Name:         name,
		Category:     category,
		TemplateText: text,
		Variables:    variables,
		UsageCount:   0,
	}

	return s.repo.CreateTemplate(template)
}

func (s *WhatsAppService) GetTemplates(userID string) ([]models.MessageTemplate, error) {
	return s.repo.GetTemplatesByUserID(userID)
}

func (s *WhatsAppService) DeleteTemplate(templateID, userID string) error {
	return s.repo.DeleteTemplate(templateID, userID)
}

// ============================================================
// Analytics
// ============================================================

func (s *WhatsAppService) GetMessageLogs(userID string, limit int) ([]models.MessageLog, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	return s.repo.GetMessageLogsByUserID(userID, limit)
}
