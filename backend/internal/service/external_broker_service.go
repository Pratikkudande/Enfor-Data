package service

import (
	"fmt"
	"strings"

	"enfor-data-backend/internal/dto"
	"enfor-data-backend/internal/models"
	"enfor-data-backend/internal/repository"
)

type ExternalBrokerService struct {
	repo     *repository.ExternalBrokerRepository
	userRepo *repository.UserRepository
}

func NewExternalBrokerService(repo *repository.ExternalBrokerRepository, userRepo *repository.UserRepository) *ExternalBrokerService {
	return &ExternalBrokerService{repo: repo, userRepo: userRepo}
}

func (s *ExternalBrokerService) Create(req *dto.CreateExternalBrokerRequest, addedBy string) (*models.ExternalBroker, error) {
	// Duplicate mobile check (globally unique — a person can only appear once)
	exists, err := s.repo.MobileExists(req.MobileNumber)
	if err != nil {
		return nil, fmt.Errorf("failed to check duplicate: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("an external broker with mobile %s already exists", req.MobileNumber)
	}

	// Also reject if this mobile belongs to an existing EnforData user
	if _, err := s.userRepo.GetUserByMobile(req.MobileNumber); err == nil {
		return nil, fmt.Errorf("this mobile number belongs to an existing EnforData broker")
	}

	b := &models.ExternalBroker{
		Name:         req.Name,
		MobileNumber: req.MobileNumber,
		Area:         req.Area,
		Location:     req.Location,
		Notes:        req.Notes,
		AddedBy:      addedBy,
	}
	if err := s.repo.Create(b); err != nil {
		return nil, err
	}
	return b, nil
}

func (s *ExternalBrokerService) GetAll(area, location *string) ([]models.ExternalBroker, error) {
	return s.repo.GetAll(area, location)
}

func (s *ExternalBrokerService) GetByID(id string) (*models.ExternalBroker, error) {
	return s.repo.GetByID(id)
}

func (s *ExternalBrokerService) Update(id string, req *dto.UpdateExternalBrokerRequest, requestorID string) (*models.ExternalBroker, error) {
	b, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if b.AddedBy != requestorID {
		return nil, fmt.Errorf("access denied: only the broker who added this record can edit it")
	}

	if req.MobileNumber != nil && *req.MobileNumber != b.MobileNumber {
		exists, err := s.repo.MobileExistsExcluding(*req.MobileNumber, id)
		if err != nil {
			return nil, err
		}
		if exists {
			return nil, fmt.Errorf("an external broker with mobile %s already exists", *req.MobileNumber)
		}
		b.MobileNumber = *req.MobileNumber
	}
	if req.Name != nil {
		b.Name = *req.Name
	}
	if req.Area != nil {
		b.Area = req.Area
	}
	if req.Location != nil {
		b.Location = req.Location
	}
	if req.Notes != nil {
		b.Notes = req.Notes
	}

	if err := s.repo.Update(b); err != nil {
		return nil, err
	}
	return b, nil
}

func (s *ExternalBrokerService) Delete(id, requestorID string) error {
	b, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if b.AddedBy != requestorID {
		return fmt.Errorf("access denied: only the broker who added this record can delete it")
	}
	return s.repo.Delete(id)
}

// AdminDelete allows an admin to delete any external broker record.
func (s *ExternalBrokerService) AdminDelete(id string) error {
	_, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	return s.repo.Delete(id)
}

// BulkCreate inserts multiple external brokers, skipping duplicates silently.
// Returns (created, duplicates, errors).
func (s *ExternalBrokerService) BulkCreate(items []dto.CreateExternalBrokerRequest, addedBy string) (int, int, []string) {
	created, duplicates := 0, 0
	var errs []string
	for i, req := range items {
		_, err := s.Create(&req, addedBy)
		if err != nil {
			if strings.Contains(err.Error(), "already exists") || strings.Contains(err.Error(), "belongs to an existing") {
				duplicates++
			} else {
				errs = append(errs, fmt.Sprintf("row %d: %v", i+2, err))
			}
		} else {
			created++
		}
	}
	return created, duplicates, errs
}
