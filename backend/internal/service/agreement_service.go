package service

import (
	"fmt"
	"time"

	"enfor-data-backend/internal/dto"
	"enfor-data-backend/internal/models"
	"enfor-data-backend/internal/repository"
)

// AgreementService handles business logic for agreements
type AgreementService struct {
	agreementRepo *repository.AgreementRepository
	propertyRepo  *repository.PropertyRepository
	clientRepo    *repository.ClientRepository
}

func NewAgreementService(
	agreementRepo *repository.AgreementRepository,
	propertyRepo *repository.PropertyRepository,
	clientRepo *repository.ClientRepository,
) *AgreementService {
	return &AgreementService{
		agreementRepo: agreementRepo,
		propertyRepo:  propertyRepo,
		clientRepo:    clientRepo,
	}
}

// Create validates and persists a new agreement.
func (s *AgreementService) Create(req *dto.CreateAgreementRequest, brokerID string) (*models.Agreement, error) {
	// Parse dates
	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		return nil, fmt.Errorf("invalid start_date format, use YYYY-MM-DD")
	}
	endDate, err := time.Parse("2006-01-02", req.EndDate)
	if err != nil {
		return nil, fmt.Errorf("invalid end_date format, use YYYY-MM-DD")
	}
	if !endDate.After(startDate) {
		return nil, fmt.Errorf("end_date must be after start_date")
	}

	// Verify the property belongs to this broker
	property, err := s.propertyRepo.GetByID(req.PropertyID)
	if err != nil {
		return nil, fmt.Errorf("property not found")
	}
	if property.BrokerID != brokerID {
		return nil, fmt.Errorf("property does not belong to this broker")
	}

	// Validate client if provided
	if req.ClientID != nil && *req.ClientID != "" {
		client, err := s.clientRepo.GetByID(*req.ClientID)
		if err != nil {
			return nil, fmt.Errorf("client not found")
		}
		if client.BrokerID != brokerID {
			return nil, fmt.Errorf("client does not belong to this broker")
		}
	}

	agreement := &models.Agreement{
		PropertyID: req.PropertyID,
		ClientID:   req.ClientID,
		BrokerID:   brokerID,
		StartDate:  startDate,
		EndDate:    endDate,
		Status:     "active",
	}

	if err := s.agreementRepo.Create(agreement); err != nil {
		return nil, fmt.Errorf("failed to create agreement: %w", err)
	}
	return agreement, nil
}

// GetByBroker returns all agreements for the authenticated broker.
func (s *AgreementService) GetByBroker(brokerID string) ([]models.Agreement, error) {
	return s.agreementRepo.GetByBrokerID(brokerID)
}

// GetByID returns a single agreement, verifying broker ownership.
func (s *AgreementService) GetByID(id, brokerID string) (*models.Agreement, error) {
	a, err := s.agreementRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if a.BrokerID != brokerID {
		return nil, fmt.Errorf("agreement not found")
	}
	return a, nil
}

// UpdateStatus updates the status of an agreement (e.g. terminate).
func (s *AgreementService) UpdateStatus(id string, req *dto.UpdateAgreementRequest, brokerID string) (*models.Agreement, error) {
	if _, err := s.GetByID(id, brokerID); err != nil {
		return nil, err
	}
	return s.agreementRepo.UpdateStatus(id, req.Status)
}

// Delete removes an agreement after ownership check.
func (s *AgreementService) Delete(id, brokerID string) error {
	if _, err := s.GetByID(id, brokerID); err != nil {
		return err
	}
	return s.agreementRepo.Delete(id)
}
