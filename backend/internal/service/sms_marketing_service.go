package service

import (
	"fmt"
	"time"

	"enfor-data-backend/internal/config"
	"enfor-data-backend/internal/models"
	"enfor-data-backend/internal/repository"
)

type SMSMarketingService struct {
	repo       *repository.SMSMarketingRepository
	clientRepo *repository.ClientRepository
	smsService *SMSService
	config     *config.Config
}

func NewSMSMarketingService(
	repo *repository.SMSMarketingRepository,
	clientRepo *repository.ClientRepository,
	smsService *SMSService,
	config *config.Config,
) *SMSMarketingService {
	return &SMSMarketingService{
		repo:       repo,
		clientRepo: clientRepo,
		smsService: smsService,
		config:     config,
	}
}

// ============================================================
// Account Management
// ============================================================

func (s *SMSMarketingService) GetProviderInfo() map[string]interface{} {
	providerName := s.smsService.GetProviderName()
	enabled := s.smsService.IsInitialized()
	
	// Get additional provider details
	var senderID string
	var authKeySet bool
	
	switch s.config.SMS.Provider {
	case "fast2sms":
		senderID = s.config.Fast2SMS.SenderID
		authKeySet = s.config.Fast2SMS.AuthKey != ""
	case "msg91":
		senderID = s.config.MSG91.SenderID
		authKeySet = s.config.MSG91.AuthKey != ""
	default:
		senderID = s.config.MSG91.SenderID
		authKeySet = s.config.MSG91.AuthKey != ""
	}
	
	return map[string]interface{}{
		"provider":     providerName,
		"enabled":      enabled,
		"sender_id":    senderID,
		"auth_key_set": authKeySet,
		"initialized":  enabled,
	}
}

func (s *SMSMarketingService) GetAccountStatus(userID string) (*models.SMSAccount, error) {
	account, err := s.repo.GetAccountByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get account: %w", err)
	}

	return account, nil
}

func (s *SMSMarketingService) ConnectAccountWithServerConfig(userID string) error {
	// Check which provider is configured
	switch s.config.SMS.Provider {
	case "fast2sms":
		// Check if Fast2SMS is enabled and configured
		if !s.config.Fast2SMS.Enabled {
			return fmt.Errorf("Fast2SMS SMS service is not enabled")
		}
		if s.config.Fast2SMS.AuthKey == "" || s.config.Fast2SMS.SenderID == "" {
			return fmt.Errorf("Fast2SMS credentials not configured on server")
		}
		// Use server-configured Fast2SMS credentials
		return s.ConnectAccount(userID, s.config.Fast2SMS.AuthKey, s.config.Fast2SMS.SenderID)
		
	case "msg91":
		fallthrough
	default:
		// Check if MSG91 is enabled and configured
		if !s.config.MSG91.Enabled {
			return fmt.Errorf("MSG91 SMS service is not enabled")
		}
		if s.config.MSG91.AuthKey == "" || s.config.MSG91.SenderID == "" {
			return fmt.Errorf("MSG91 credentials not configured on server")
		}
		// Use server-configured MSG91 credentials
		return s.ConnectAccount(userID, s.config.MSG91.AuthKey, s.config.MSG91.SenderID)
	}
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
// DLT Templates
// ============================================================

func (s *SMSMarketingService) CreateDLTTemplate(userID string, template *models.SMSDLTTemplate) error {
	template.UserID = userID
	template.UpdatedBy = &userID // Set created by user
	return s.repo.CreateDLTTemplate(template)
}

func (s *SMSMarketingService) GetDLTTemplates(userID string) ([]models.SMSDLTTemplate, error) {
	return s.repo.GetDLTTemplatesByUserID(userID)
}

// GetAvailableTemplatesForSending gets active/approved templates created by admin or the broker for send message tab
func (s *SMSMarketingService) GetAvailableTemplatesForSending(userID string) ([]models.SMSDLTTemplate, error) {
	return s.repo.GetAvailableTemplatesForBroker(userID)
}

func (s *SMSMarketingService) GetDLTTemplateByID(templateID, userID string) (*models.SMSDLTTemplate, error) {
	return s.repo.GetDLTTemplateByID(templateID, userID)
}

func (s *SMSMarketingService) UpdateDLTTemplate(template *models.SMSDLTTemplate) error {
	return s.repo.UpdateDLTTemplate(template)
}

func (s *SMSMarketingService) DeleteDLTTemplate(templateID, userID string) error {
	return s.repo.DeleteDLTTemplate(templateID, userID)
}

// SendDLTMessage sends SMS using a DLT template with variable substitution
func (s *SMSMarketingService) SendDLTMessage(userID, templateID string, variableValues map[string]string, clientIDs []string) (int, int, error) {
	// Get DLT template
	template, err := s.repo.GetDLTTemplateByID(templateID, userID)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to get template: %w", err)
	}
	if template == nil {
		return 0, 0, fmt.Errorf("template not found")
	}

	// Check if template is active
	if template.Status != "Active" && template.Status != "Approved" {
		return 0, 0, fmt.Errorf("template is not active (status: %s)", template.Status)
	}

	successful := 0
	failed := 0

	for _, clientID := range clientIDs {
		// Get client details
		client, err := s.clientRepo.GetByID(clientID)
		if err != nil || client == nil {
			failed++
			continue
		}

		// Verify ownership
		if client.BrokerID != userID {
			failed++
			continue
		}

		// Build message from template by replacing variables
		message := s.buildMessageFromTemplate(template.TemplateContent, variableValues)

		// Send SMS
		err = s.smsService.SendSMS(client.Phone, message)
		if err != nil {
			failed++
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
		} else {
			successful++
			// Log successful message
			log := &models.SMSMessageLog{
				UserID:         userID,
				ClientID:       &clientID,
				MessageType:    "individual",
				MessageText:    message,
				RecipientPhone: client.Phone,
				Status:         "sent",
			}
			s.repo.CreateMessageLog(log)
		}

		// Rate limiting: 1 message per second
		time.Sleep(1 * time.Second)
	}

	return successful, failed, nil
}

// buildMessageFromTemplate replaces {#var#} or {#alp#} placeholders with actual values
func (s *SMSMarketingService) buildMessageFromTemplate(templateContent string, variableValues map[string]string) string {
	message := templateContent
	
	// Replace variables sequentially (var1, var2, var3, etc.)
	// This works for both {#var#} and {#alp#} patterns
	varIndex := 1
	for {
		varKey := fmt.Sprintf("var%d", varIndex)
		value, exists := variableValues[varKey]
		if !exists {
			break
		}
		
		// Try to replace {#alp#} first (most common in DLT templates)
		if indexOf(message, "{#alp#}") != -1 {
			message = replaceFirst(message, "{#alp#}", value)
		} else if indexOf(message, "{#var#}") != -1 {
			// Fallback to {#var#}
			message = replaceFirst(message, "{#var#}", value)
		} else {
			// No more placeholders found
			break
		}
		
		varIndex++
	}
	
	return message
}

// Helper function to replace all occurrences
func replaceAll(str, old, new string) string {
	result := ""
	remaining := str
	for {
		index := indexOf(remaining, old)
		if index == -1 {
			result += remaining
			break
		}
		result += remaining[:index] + new
		remaining = remaining[index+len(old):]
	}
	return result
}

// Helper function to replace first occurrence
func replaceFirst(str, old, new string) string {
	index := indexOf(str, old)
	if index == -1 {
		return str
	}
	return str[:index] + new + str[index+len(old):]
}

// Helper function to find index of substring
func indexOf(str, substr string) int {
	for i := 0; i <= len(str)-len(substr); i++ {
		if str[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
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

// ============================================================
// SMS Header Management
// ============================================================

func (s *SMSMarketingService) CreateSMSHeader(userID string, header *models.SMSHeader) error {
	header.UserID = userID
	header.CreatedBy = userID
	return s.repo.CreateSMSHeader(header)
}

func (s *SMSMarketingService) GetSMSHeaders(userID string) ([]models.SMSHeader, error) {
	return s.repo.GetSMSHeadersByUserID(userID)
}

func (s *SMSMarketingService) GetSMSHeaderByID(headerID, userID string) (*models.SMSHeader, error) {
	return s.repo.GetSMSHeaderByID(headerID, userID)
}

func (s *SMSMarketingService) UpdateSMSHeader(header *models.SMSHeader) error {
	return s.repo.UpdateSMSHeader(header)
}

func (s *SMSMarketingService) DeleteSMSHeader(headerID, userID string) error {
	return s.repo.DeleteSMSHeader(headerID, userID)
}

// Admin methods
func (s *SMSMarketingService) GetAllSMSHeaders() ([]models.SMSHeader, error) {
	return s.repo.GetAllSMSHeaders()
}

func (s *SMSMarketingService) GetSMSHeaderByIDAdmin(headerID string) (*models.SMSHeader, error) {
	return s.repo.GetSMSHeaderByIDAdmin(headerID)
}

// GetAvailableHeadersByType gets available headers for dropdown based on template type
// For admin: returns all active/approved headers
// For broker: returns headers created by admin or that broker with active/approved status
func (s *SMSMarketingService) GetAvailableHeadersByType(userID, userRole, headerType string) ([]models.SMSHeader, error) {
	return s.repo.GetAvailableHeadersByType(userID, userRole, headerType)
}
