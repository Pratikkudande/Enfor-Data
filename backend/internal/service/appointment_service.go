package service

import (
	"enfor-data-backend/internal/dto"
	"fmt"
	"time"

	"enfor-data-backend/internal/models"
	"enfor-data-backend/internal/repository"
)

// AppointmentService handles business logic for appointments
type AppointmentService struct {
	appointmentRepo *repository.AppointmentRepository
	clientRepo      *repository.ClientRepository
	propertyRepo    *repository.PropertyRepository
	userRepo        *repository.UserRepository
	smsService      *SMSService
}

// NewAppointmentService creates a new AppointmentService instance
func NewAppointmentService(
	appointmentRepo *repository.AppointmentRepository,
	clientRepo *repository.ClientRepository,
	propertyRepo *repository.PropertyRepository,
	userRepo *repository.UserRepository,
	smsService *SMSService,
) *AppointmentService {
	return &AppointmentService{
		appointmentRepo: appointmentRepo,
		clientRepo:      clientRepo,
		propertyRepo:    propertyRepo,
		userRepo:        userRepo,
		smsService:      smsService,
	}
}

// CreateAppointment creates a new appointment with business logic validation
func (s *AppointmentService) CreateAppointment(req *dto.CreateAppointmentRequest, brokerID string) (*models.Appointment, error) {
	// Validate client_id exists and belongs to broker
	client, err := s.clientRepo.GetByID(req.ClientID)
	if err != nil {
		return nil, fmt.Errorf("invalid client_id: %w", err)
	}
	
	// Verify client belongs to the broker
	if client.BrokerID != brokerID {
		return nil, fmt.Errorf("client does not belong to broker")
	}

	// Validate property_id exists if provided
	if req.PropertyID != nil && *req.PropertyID != "" {
		property, err := s.propertyRepo.GetByID(*req.PropertyID)
		if err != nil {
			return nil, fmt.Errorf("invalid property_id: %w", err)
		}
		
		// Verify property belongs to the broker
		if property.BrokerID != brokerID {
			return nil, fmt.Errorf("property does not belong to broker")
		}
	}

	// Create appointment model with default status 'scheduled'
	appointment := &models.Appointment{
		Title:       req.Title,
		Description: req.Description,
		ClientID:    req.ClientID,
		PropertyID:  req.PropertyID,
		BrokerID:    brokerID,
		Type:        req.Type,
		Status:      "scheduled", // Default status
	}

	// Parse date string into time.Time; parse time string into time.Time
	parsedDate, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		return nil, fmt.Errorf("invalid date format: %w", err)
	}
	appointment.Date = parsedDate

	parsedTime, err := time.Parse("15:04", req.Time)
	if err != nil {
		return nil, fmt.Errorf("invalid time format: %w", err)
	}
	appointment.TimeVal = parsedTime

	// Create appointment in database
	err = s.appointmentRepo.Create(appointment)
	if err != nil {
		return nil, fmt.Errorf("failed to create appointment: %w", err)
	}

	// Send SMS confirmation to client
	go s.sendAppointmentConfirmationSMS(appointment, client, brokerID)

	return appointment, nil
}

// GetBrokerAppointments retrieves all appointments for a broker with optional filters
func (s *AppointmentService) GetBrokerAppointments(brokerID string, filters dto.AppointmentFilters) ([]models.Appointment, error) {
	appointments, err := s.appointmentRepo.GetByBrokerID(brokerID, filters)
	if err != nil {
		return nil, fmt.Errorf("failed to get broker appointments: %w", err)
	}

	return appointments, nil
}

// GetAppointmentByID retrieves a single appointment by ID with broker ownership verification
func (s *AppointmentService) GetAppointmentByID(id, brokerID string) (*models.Appointment, error) {
	appointment, err := s.appointmentRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Verify broker ownership
	if appointment.BrokerID != brokerID {
		return nil, fmt.Errorf("appointment not found") // Return not found to prevent information disclosure
	}

	return appointment, nil
}

// UpdateAppointment updates an appointment with ownership verification and partial updates
func (s *AppointmentService) UpdateAppointment(id string, req *dto.UpdateAppointmentRequest, brokerID string) (*models.Appointment, error) {
	// Verify ownership by fetching the appointment
	appointment, err := s.GetAppointmentByID(id, brokerID)
	if err != nil {
		return nil, err
	}

	// Validate client_id if being updated
	if req.ClientID != nil && *req.ClientID != "" {
		client, err := s.clientRepo.GetByID(*req.ClientID)
		if err != nil {
			return nil, fmt.Errorf("invalid client_id: %w", err)
		}
		
		// Verify client belongs to the broker
		if client.BrokerID != brokerID {
			return nil, fmt.Errorf("client does not belong to broker")
		}
		
		appointment.ClientID = *req.ClientID
	}

	// Validate property_id if being updated
	if req.PropertyID != nil {
		if *req.PropertyID != "" {
			property, err := s.propertyRepo.GetByID(*req.PropertyID)
			if err != nil {
				return nil, fmt.Errorf("invalid property_id: %w", err)
			}
			
			// Verify property belongs to the broker
			if property.BrokerID != brokerID {
				return nil, fmt.Errorf("property does not belong to broker")
			}
		}
		
		appointment.PropertyID = req.PropertyID
	}

	// Apply only provided fields to appointment model (partial updates)
	if req.Title != nil {
		appointment.Title = *req.Title
	}

	if req.Description != nil {
		appointment.Description = req.Description
	}

	if req.Date != nil {
		parsedDate, err := time.Parse("2006-01-02", *req.Date)
		if err != nil {
			return nil, fmt.Errorf("invalid date format: %w", err)
		}
		appointment.Date = parsedDate
	}

	if req.Time != nil {
		parsedTime, err := time.Parse("15:04", *req.Time)
		if err != nil {
			return nil, fmt.Errorf("invalid time format: %w", err)
		}
		appointment.TimeVal = parsedTime
	}

	if req.Type != nil {
		appointment.Type = *req.Type
	}

	if req.Status != nil {
		oldStatus := appointment.Status
		appointment.Status = *req.Status
		
		// Send SMS if status changed to cancelled
		if oldStatus != "cancelled" && *req.Status == "cancelled" {
			client, _ := s.clientRepo.GetByID(appointment.ClientID)
			if client != nil {
				go s.sendAppointmentCancellationSMS(appointment, client)
			}
		}
	}

	// Update appointment in database
	err = s.appointmentRepo.Update(appointment)
	if err != nil {
		return nil, fmt.Errorf("failed to update appointment: %w", err)
	}

	// Send SMS if date or time was updated
	if req.Date != nil || req.Time != nil {
		client, _ := s.clientRepo.GetByID(appointment.ClientID)
		if client != nil {
			go s.sendAppointmentUpdateSMS(appointment, client)
		}
	}

	return appointment, nil
}

// DeleteAppointment deletes an appointment with ownership verification
func (s *AppointmentService) DeleteAppointment(id, brokerID string) error {
	// Verify ownership by fetching the appointment
	_, err := s.GetAppointmentByID(id, brokerID)
	if err != nil {
		return err
	}

	// Delete appointment from database
	err = s.appointmentRepo.Delete(id)
	if err != nil {
		return fmt.Errorf("failed to delete appointment: %w", err)
	}

	return nil
}

// GetAppointmentStats retrieves appointment statistics for a broker
func (s *AppointmentService) GetAppointmentStats(brokerID string) (*dto.AppointmentStats, error) {
	stats, err := s.appointmentRepo.GetStats(brokerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get appointment stats: %w", err)
	}

	return stats, nil
}


// sendAppointmentConfirmationSMS sends SMS confirmation when appointment is created
func (s *AppointmentService) sendAppointmentConfirmationSMS(appointment *models.Appointment, client *models.Client, brokerID string) {
	// Get broker details
	broker, err := s.userRepo.GetUserByID(brokerID)
	if err != nil {
		fmt.Printf("⚠️  Failed to get broker details for SMS: %v\n", err)
		return
	}

	brokerName := fmt.Sprintf("%s %s", broker.FirstName, broker.LastName)
	clientName := fmt.Sprintf("%s %s", client.FirstName, client.LastName)
	
	// Format date and time
	appointmentDate := appointment.Date.Format("Monday, January 2, 2006")
	appointmentTime := appointment.TimeVal.Format("3:04 PM")

	// Send SMS
	err = s.smsService.SendAppointmentConfirmation(
		client.Phone,
		clientName,
		appointment.Title,
		appointmentDate,
		appointmentTime,
		brokerName,
	)

	if err != nil {
		fmt.Printf("⚠️  Failed to send appointment confirmation SMS: %v\n", err)
	}
}

// sendAppointmentUpdateSMS sends SMS when appointment is updated
func (s *AppointmentService) sendAppointmentUpdateSMS(appointment *models.Appointment, client *models.Client) {
	clientName := fmt.Sprintf("%s %s", client.FirstName, client.LastName)
	appointmentDate := appointment.Date.Format("Monday, January 2, 2006")
	appointmentTime := appointment.TimeVal.Format("3:04 PM")

	err := s.smsService.SendAppointmentUpdate(
		client.Phone,
		clientName,
		appointment.Title,
		appointmentDate,
		appointmentTime,
	)

	if err != nil {
		fmt.Printf("⚠️  Failed to send appointment update SMS: %v\n", err)
	}
}

// sendAppointmentCancellationSMS sends SMS when appointment is cancelled
func (s *AppointmentService) sendAppointmentCancellationSMS(appointment *models.Appointment, client *models.Client) {
	clientName := fmt.Sprintf("%s %s", client.FirstName, client.LastName)

	err := s.smsService.SendAppointmentCancellation(
		client.Phone,
		clientName,
		appointment.Title,
	)

	if err != nil {
		fmt.Printf("⚠️  Failed to send appointment cancellation SMS: %v\n", err)
	}
}
