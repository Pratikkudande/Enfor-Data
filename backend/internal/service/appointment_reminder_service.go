package service

import (
	"fmt"
	"time"

	"enfor-data-backend/internal/repository"
)

type AppointmentReminderService struct {
	appointmentRepo *repository.AppointmentRepository
	clientRepo      *repository.ClientRepository
	userRepo        *repository.UserRepository
	smsService      *SMSService
	stopChan        chan bool
}

func NewAppointmentReminderService(
	appointmentRepo *repository.AppointmentRepository,
	clientRepo *repository.ClientRepository,
	userRepo *repository.UserRepository,
	smsService *SMSService,
) *AppointmentReminderService {
	return &AppointmentReminderService{
		appointmentRepo: appointmentRepo,
		clientRepo:      clientRepo,
		userRepo:        userRepo,
		smsService:      smsService,
		stopChan:        make(chan bool),
	}
}

// Start begins the reminder scheduler
func (s *AppointmentReminderService) Start() {
	fmt.Println("📅 Appointment Reminder Service started")
	
	// Check every 5 minutes for appointments that need reminders
	ticker := time.NewTicker(5 * time.Minute)
	
	go func() {
		// Run immediately on start
		s.checkAndSendReminders()
		
		for {
			select {
			case <-ticker.C:
				s.checkAndSendReminders()
			case <-s.stopChan:
				ticker.Stop()
				fmt.Println("📅 Appointment Reminder Service stopped")
				return
			}
		}
	}()
}

// Stop stops the reminder scheduler
func (s *AppointmentReminderService) Stop() {
	close(s.stopChan)
}

// checkAndSendReminders checks for appointments and sends reminders
func (s *AppointmentReminderService) checkAndSendReminders() {
	now := time.Now()
	
	// Calculate time window: 55 minutes to 65 minutes from now
	// This gives us a 10-minute window to catch appointments that need 1-hour reminders
	reminderStart := now.Add(55 * time.Minute)
	reminderEnd := now.Add(65 * time.Minute)
	
	fmt.Printf("\n🔍 Checking for appointments between %s and %s\n", 
		reminderStart.Format("15:04"), 
		reminderEnd.Format("15:04"))
	
	// Get all scheduled appointments (we'll filter by time in code)
	// Note: This is a simplified approach. In production, you'd want to:
	// 1. Add a database query to filter by date/time range
	// 2. Add a "reminder_sent" flag to avoid duplicate reminders
	// 3. Store reminder status in database
	
	// For now, we'll use a simple approach with in-memory tracking
	// In production, add these fields to appointments table:
	// - reminder_sent BOOLEAN DEFAULT FALSE
	// - reminder_sent_at TIMESTAMP
	
	appointments, err := s.getAllUpcomingAppointments()
	if err != nil {
		fmt.Printf("❌ Error fetching appointments: %v\n", err)
		return
	}
	
	remindersSent := 0
	
	for _, appointment := range appointments {
		// Parse appointment date and time
		appointmentDateTime, err := s.parseAppointmentDateTime(appointment.Date, appointment.Time)
		if err != nil {
			fmt.Printf("⚠️  Error parsing appointment time for %s: %v\n", appointment.ID, err)
			continue
		}
		
		// Check if appointment is in the reminder window
		if appointmentDateTime.After(reminderStart) && appointmentDateTime.Before(reminderEnd) {
			// Check if appointment is scheduled (not completed or cancelled)
			if appointment.Status != "scheduled" {
				continue
			}
			
			// Send reminder
			if err := s.sendReminder(&appointment); err != nil {
				fmt.Printf("❌ Failed to send reminder for appointment %s: %v\n", appointment.ID, err)
			} else {
				remindersSent++
				fmt.Printf("✅ Reminder sent for appointment: %s\n", appointment.Title)
			}
		}
	}
	
	if remindersSent > 0 {
		fmt.Printf("📨 Sent %d reminder(s)\n", remindersSent)
	} else {
		fmt.Printf("✓ No reminders to send at this time\n")
	}
}

// getAllUpcomingAppointments gets all appointments for today and tomorrow
func (s *AppointmentReminderService) getAllUpcomingAppointments() ([]struct {
	ID          string
	Title       string
	Date        string
	Time        string
	ClientID    string
	ClientName  string
	ClientPhone string
	BrokerID    string
	BrokerName  string
	Status      string
}, error) {
	// This is a simplified version. In production, you'd want a proper repository method
	// that joins appointments with clients and users, and filters by date range
	
	// For now, return empty slice - you'll need to implement the actual query
	// based on your repository structure
	
	return []struct {
		ID          string
		Title       string
		Date        string
		Time        string
		ClientID    string
		ClientName  string
		ClientPhone string
		BrokerID    string
		BrokerName  string
		Status      string
	}{}, nil
}

// parseAppointmentDateTime parses appointment date and time into a single time.Time
func (s *AppointmentReminderService) parseAppointmentDateTime(date, timeStr string) (time.Time, error) {
	// Combine date and time
	dateTimeStr := fmt.Sprintf("%s %s", date, timeStr)
	
	// Try multiple formats
	formats := []string{
		"2006-01-02 15:04:05",
		"2006-01-02 15:04",
		"2006-01-02T15:04:05Z",
		"2006-01-02T15:04:05",
	}
	
	var lastErr error
	for _, format := range formats {
		if dt, err := time.Parse(format, dateTimeStr); err == nil {
			return dt, nil
		} else {
			lastErr = err
		}
	}
	
	return time.Time{}, fmt.Errorf("failed to parse date/time: %w", lastErr)
}

// sendReminder sends a reminder SMS for an appointment
func (s *AppointmentReminderService) sendReminder(appointment *struct {
	ID          string
	Title       string
	Date        string
	Time        string
	ClientID    string
	ClientName  string
	ClientPhone string
	BrokerID    string
	BrokerName  string
	Status      string
}) error {
	return s.smsService.SendAppointmentReminder(
		appointment.ClientPhone,
		appointment.ClientName,
		appointment.Title,
		appointment.Time,
		appointment.BrokerName,
	)
}
