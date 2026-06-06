package service

import (
	"enfor-data-backend/internal/models"
	"enfor-data-backend/internal/repository"
)

type AdminService struct {
	adminRepo   *repository.AdminRepository
	userRepo    *repository.UserRepository
	authService *AuthService
}

func NewAdminService(adminRepo *repository.AdminRepository, userRepo *repository.UserRepository, authService *AuthService) *AdminService {
	return &AdminService{adminRepo: adminRepo, userRepo: userRepo, authService: authService}
}

func (s *AdminService) GetDashboardStats() (*models.AdminDashboardStats, error) {
	return s.adminRepo.GetDashboardStats()
}

func (s *AdminService) GetAnalytics() (*models.AdminAnalytics, error) {
	return s.adminRepo.GetAnalytics()
}

func (s *AdminService) GetBrokers(search, status string, page, limit int) ([]models.BrokerListItem, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	return s.adminRepo.GetBrokers(search, status, page, limit)
}

func (s *AdminService) GetBrokerDetails(id string) (*models.BrokerListItem, error) {
	return s.adminRepo.GetBrokerByID(id)
}

func (s *AdminService) UpdateUserStatus(adminID, adminName, userID, status, ip string) error {
	if err := s.adminRepo.UpdateUserStatus(userID, status); err != nil {
		return err
	}
	s.adminRepo.CreateAuditLog(adminID, adminName, "USER_STATUS_CHANGE", "user", userID, "Status changed to: "+status, ip)
	return nil
}

func (s *AdminService) DeleteUser(adminID, adminName, userID, ip string) error {
	if err := s.adminRepo.DeleteUser(userID); err != nil {
		return err
	}
	s.adminRepo.CreateAuditLog(adminID, adminName, "USER_DELETED", "user", userID, "User account deleted", ip)
	return nil
}

func (s *AdminService) GetRevenueStats() (*models.RevenueStats, error) {
	return s.adminRepo.GetRevenueStats()
}

func (s *AdminService) GetSubscriptions(page, limit int) ([]models.SubscriptionRecord, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	return s.adminRepo.GetSubscriptions(page, limit)
}

func (s *AdminService) GetSMSStats() (*models.SMSStats, error) {
	return s.adminRepo.GetSMSStats()
}

func (s *AdminService) GetAuditLogs(page, limit int) ([]models.AuditLog, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}
	return s.adminRepo.GetAuditLogs(page, limit)
}

func (s *AdminService) CreateAnnouncement(adminID string, req map[string]interface{}) (*models.Announcement, error) {
	a := &models.Announcement{
		AdminID:     adminID,
		Title:       req["title"].(string),
		Message:     req["message"].(string),
		Type:        getStringOrDefault(req, "type", "dashboard"),
		Target:      getStringOrDefault(req, "target", "all"),
		TargetValue: getStringOrDefault(req, "target_value", ""),
	}
	if err := s.adminRepo.CreateAnnouncement(a); err != nil {
		return nil, err
	}
	return a, nil
}

func (s *AdminService) GetAnnouncements(page, limit int) ([]models.Announcement, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	return s.adminRepo.GetAnnouncements(page, limit)
}

func (s *AdminService) SendAnnouncement(adminID, adminName, announcementID, ip string) error {
	if err := s.adminRepo.SendAnnouncement(announcementID); err != nil {
		return err
	}
	s.adminRepo.CreateAuditLog(adminID, adminName, "ANNOUNCEMENT_SENT", "announcement", announcementID, "Announcement sent to brokers", ip)
	return nil
}

func (s *AdminService) GetFeedback(status string, page, limit int) ([]models.Feedback, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	return s.adminRepo.GetFeedback(status, page, limit)
}

func (s *AdminService) UpdateFeedback(id, status, adminNotes string) error {
	return s.adminRepo.UpdateFeedback(id, status, adminNotes)
}

func (s *AdminService) GetRenewals() (map[string][]models.RenewalRecord, error) {
	return s.adminRepo.GetRenewals()
}

func (s *AdminService) GetActivityLog(page, limit int) ([]models.ActivityRecord, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}
	return s.adminRepo.GetActivityLog(page, limit)
}

func (s *AdminService) LoginAsBroker(devAdminID, devAdminName, brokerID, ip string) (string, string, error) {
	broker, err := s.adminRepo.GetUserByID(brokerID)
	if err != nil {
		return "", "", err
	}

	brokerName := broker.FirstName + " " + broker.LastName
	sessionID, err := s.adminRepo.CreateDeveloperSession(devAdminID, devAdminName, brokerID, brokerName)
	if err != nil {
		return "", "", err
	}

	// Generate a token for the broker
	token, err := s.authService.GenerateToken(broker.ID, broker.Email, broker.Role)
	if err != nil {
		return "", "", err
	}

	s.adminRepo.CreateAuditLog(devAdminID, devAdminName, "LOGIN_AS_BROKER", "user", brokerID,
		"Developer admin logged in as broker: "+brokerName, ip)

	return token, sessionID, nil
}

func (s *AdminService) GetSystemConfig() ([]models.SystemConfig, error) {
	return s.adminRepo.GetSystemConfig()
}

func (s *AdminService) UpdateSystemConfig(adminID, adminName, key, value, ip string) error {
	if err := s.adminRepo.UpdateSystemConfig(key, value); err != nil {
		return err
	}
	s.adminRepo.CreateAuditLog(adminID, adminName, "CONFIG_UPDATED", "system_config", key, "Config key '"+key+"' updated to: "+value, ip)
	return nil
}

func (s *AdminService) GetStorageStats() (*models.StorageStats, error) {
	return s.adminRepo.GetStorageStats()
}

func (s *AdminService) ExportData(dataType, brokerID string) ([]map[string]interface{}, error) {
	switch dataType {
	case "brokers":
		return s.adminRepo.GetAllBrokersForExport()
	case "properties":
		return s.adminRepo.ExportPropertiesData(brokerID)
	case "buyers":
		return s.adminRepo.ExportClientsData("buyer", brokerID)
	case "sellers":
		return s.adminRepo.ExportClientsData("seller", brokerID)
	case "rent_clients":
		return s.adminRepo.ExportClientsData("tenant", brokerID)
	case "clients":
		return s.adminRepo.ExportClientsData("", brokerID)
	default:
		return s.adminRepo.GetAllBrokersForExport()
	}
}

func (s *AdminService) RecordLogin(userID string) {
	s.adminRepo.IncrementLoginCount(userID)
}

func getStringOrDefault(m map[string]interface{}, key, def string) string {
	if v, ok := m[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return def
}
