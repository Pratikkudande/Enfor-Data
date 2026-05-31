package service

import (
	"fmt"

	"enfor-data-backend/internal/dto"
	"enfor-data-backend/internal/models"
	"enfor-data-backend/internal/repository"
)

type BuildingService struct {
	buildingRepo *repository.BuildingRepository
	userRepo     *repository.UserRepository
}

func NewBuildingService(buildingRepo *repository.BuildingRepository, userRepo *repository.UserRepository) *BuildingService {
	return &BuildingService{buildingRepo: buildingRepo, userRepo: userRepo}
}

func (s *BuildingService) CreateBuildingContact(req *dto.CreateBuildingContactRequest, brokerID string) (*models.BuildingContact, error) {
	exists, err := s.buildingRepo.MobileExistsForBroker(req.MobileNumber, brokerID)
	if err != nil {
		return nil, fmt.Errorf("failed to check for duplicate: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("building contact with mobile number %s already exists", req.MobileNumber)
	}

	_, err = s.userRepo.GetUserByID(brokerID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch broker information: %w", err)
	}

	contact := &models.BuildingContact{
		OwnerName:    req.OwnerName,
		MobileNumber: req.MobileNumber,
		BuildingName: req.BuildingName,
		Area:         req.Area,
		Notes:        req.Notes,
		BrokerID:     brokerID,
	}

	if err := s.buildingRepo.Create(contact); err != nil {
		return nil, fmt.Errorf("failed to create building contact: %w", err)
	}
	return contact, nil
}

func (s *BuildingService) GetBuildingContacts(brokerID string, area, building *string) ([]models.BuildingContact, error) {
	contacts, err := s.buildingRepo.GetByBrokerID(brokerID, area, building)
	if err != nil {
		return nil, fmt.Errorf("failed to get building contacts: %w", err)
	}
	return contacts, nil
}

func (s *BuildingService) GetBuildingContactByID(id, brokerID string) (*models.BuildingContact, error) {
	contact, err := s.buildingRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if contact.BrokerID != brokerID {
		return nil, fmt.Errorf("access denied: contact does not belong to this broker")
	}
	return contact, nil
}

func (s *BuildingService) UpdateBuildingContact(id string, req *dto.UpdateBuildingContactRequest, brokerID string) (*models.BuildingContact, error) {
	contact, err := s.GetBuildingContactByID(id, brokerID)
	if err != nil {
		return nil, err
	}

	if req.MobileNumber != nil && *req.MobileNumber != contact.MobileNumber {
		exists, err := s.buildingRepo.MobileExistsForBrokerExcluding(*req.MobileNumber, brokerID, id)
		if err != nil {
			return nil, fmt.Errorf("failed to check for duplicate: %w", err)
		}
		if exists {
			return nil, fmt.Errorf("building contact with mobile number %s already exists", *req.MobileNumber)
		}
		contact.MobileNumber = *req.MobileNumber
	}
	if req.OwnerName != nil {
		contact.OwnerName = req.OwnerName
	}
	if req.BuildingName != nil {
		contact.BuildingName = req.BuildingName
	}
	if req.Area != nil {
		contact.Area = req.Area
	}
	if req.Notes != nil {
		contact.Notes = req.Notes
	}

	if err := s.buildingRepo.Update(contact); err != nil {
		return nil, fmt.Errorf("failed to update building contact: %w", err)
	}
	return contact, nil
}

func (s *BuildingService) DeleteBuildingContact(id, brokerID string) error {
	_, err := s.GetBuildingContactByID(id, brokerID)
	if err != nil {
		return err
	}
	if err := s.buildingRepo.Delete(id); err != nil {
		return fmt.Errorf("failed to delete building contact: %w", err)
	}
	return nil
}
