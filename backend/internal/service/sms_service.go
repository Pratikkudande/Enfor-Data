package service

import (
	"fmt"

	"enfor-data-backend/internal/config"
	"enfor-data-backend/internal/provider"
)

type SMSService struct {
	config        *config.Config
	provider      provider.MessagingProvider
	providerName  string
	isInitialized bool
}

func NewSMSService(cfg *config.Config) *SMSService {
	// Select provider based on configuration
	var smsProvider provider.MessagingProvider
	var providerName string
	var isInitialized bool

	switch cfg.SMS.Provider {
	case "fast2sms":
		if cfg.Fast2SMS.Enabled {
			smsProvider = provider.NewFast2SMSProviderWithTemplate(
				cfg.Fast2SMS.AuthKey,
				cfg.Fast2SMS.SenderID,
				cfg.Fast2SMS.Route,
				cfg.Fast2SMS.TemplateID,
			)
			providerName = "Fast2SMS"
			isInitialized = true
			fmt.Println("✅ SMS Service initialized with Fast2SMS provider on startup")
		}
	case "msg91":
		if cfg.MSG91.Enabled {
			smsProvider = provider.NewMSG91ProviderWithTemplate(
				cfg.MSG91.AuthKey,
				cfg.MSG91.SenderID,
				cfg.MSG91.Route,
				cfg.MSG91.TemplateID,
			)
			providerName = "MSG91"
			isInitialized = true
			fmt.Println("✅ SMS Service initialized with MSG91 provider on startup")
		}
	default:
		// Default to MSG91
		if cfg.MSG91.Enabled {
			smsProvider = provider.NewMSG91ProviderWithTemplate(
				cfg.MSG91.AuthKey,
				cfg.MSG91.SenderID,
				cfg.MSG91.Route,
				cfg.MSG91.TemplateID,
			)
			providerName = "MSG91"
			isInitialized = true
			fmt.Println("✅ SMS Service initialized with MSG91 provider (default) on startup")
		}
	}

	// Use mock provider if no provider is configured
	if smsProvider == nil {
		smsProvider = &provider.MockProvider{}
		providerName = "Mock"
		isInitialized = false
		fmt.Println("⚠️ SMS Service initialized with Mock provider (no SMS provider configured)")
	}

	return &SMSService{
		config:        cfg,
		provider:      smsProvider,
		providerName:  providerName,
		isInitialized: isInitialized,
	}
}

// GetProviderName returns the name of the initialized SMS provider
func (s *SMSService) GetProviderName() string {
	return s.providerName
}

// IsInitialized returns true if a real SMS provider is initialized
func (s *SMSService) IsInitialized() bool {
	return s.isInitialized
}

// SendSMS sends an SMS using the configured provider
func (s *SMSService) SendSMS(to, message string) error {
	result, err := s.provider.SendMessage(to, message)
	if err != nil {
		return fmt.Errorf("failed to send SMS: %w", err)
	}

	if result.Status == "failed" {
		return fmt.Errorf("SMS delivery failed: %s", result.Error)
	}

	return nil
}

// SendAppointmentConfirmation sends appointment confirmation SMS
func (s *SMSService) SendAppointmentConfirmation(clientPhone, clientName, appointmentTitle, appointmentDate, appointmentTime, brokerName string) error {
	message := fmt.Sprintf(
		"Hi %s! Your appointment '%s' has been scheduled for %s at %s with %s. We look forward to seeing you!",
		clientName,
		appointmentTitle,
		appointmentDate,
		appointmentTime,
		brokerName,
	)

	return s.SendSMS(clientPhone, message)
}

// SendAppointmentReminder sends appointment reminder SMS (1 hour before)
func (s *SMSService) SendAppointmentReminder(clientPhone, clientName, appointmentTitle, appointmentTime, brokerName string) error {
	message := fmt.Sprintf(
		"Reminder: Hi %s! Your appointment '%s' is scheduled in 1 hour at %s with %s. See you soon!",
		clientName,
		appointmentTitle,
		appointmentTime,
		brokerName,
	)

	return s.SendSMS(clientPhone, message)
}

// SendAppointmentCancellation sends appointment cancellation SMS
func (s *SMSService) SendAppointmentCancellation(clientPhone, clientName, appointmentTitle string) error {
	message := fmt.Sprintf(
		"Hi %s, your appointment '%s' has been cancelled. Please contact us if you have any questions.",
		clientName,
		appointmentTitle,
	)

	return s.SendSMS(clientPhone, message)
}

// SendAppointmentUpdate sends appointment update SMS
func (s *SMSService) SendAppointmentUpdate(clientPhone, clientName, appointmentTitle, newDate, newTime string) error {
	message := fmt.Sprintf(
		"Hi %s, your appointment '%s' has been rescheduled to %s at %s. Thank you!",
		clientName,
		appointmentTitle,
		newDate,
		newTime,
	)

	return s.SendSMS(clientPhone, message)
}
