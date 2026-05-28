package service

import (
	"fmt"

	"enfor-data-backend/internal/dto"
	"enfor-data-backend/internal/models"
	"enfor-data-backend/internal/repository"
)

// StaffService handles business logic for staff listings.
type StaffService struct {
	repo *repository.StaffRepository
}

func NewStaffService(repo *repository.StaffRepository) *StaffService {
	return &StaffService{repo: repo}
}

// Create validates and persists a new staff listing.
func (s *StaffService) Create(req *dto.CreateStaffRequest, userID string) (*models.StaffMember, error) {
	status := req.Status
	if status == "" {
		status = "available"
	}

	member := &models.StaffMember{
		UserID:          userID,
		Type:            req.Type,
		FirstName:       req.FirstName,
		LastName:        req.LastName,
		Phone:           req.Phone,
		Email:           req.Email,
		Role:            req.Role,
		ExperienceYears: req.ExperienceYears,
		Status:          status,
		Location:        req.Location,
		Address:         req.Address,
		Description:     req.Description,
		ResumeURL:       req.ResumeURL,
		PhotoURL:        req.PhotoURL,
	}

	if err := s.repo.Create(member); err != nil {
		return nil, fmt.Errorf("failed to create staff listing: %w", err)
	}
	return member, nil
}

// GetAll returns all staff listings with optional filters.
func (s *StaffService) GetAll(staffType, location string) ([]models.StaffMember, error) {
	return s.repo.GetAll(staffType, location)
}

// GetMyListings returns listings created by the authenticated user.
func (s *StaffService) GetMyListings(userID string) ([]models.StaffMember, error) {
	return s.repo.GetByUser(userID)
}

// GetByID returns a single staff listing.
func (s *StaffService) GetByID(id string) (*models.StaffMember, error) {
	return s.repo.GetByID(id)
}

// Update applies partial updates, verifying ownership.
func (s *StaffService) Update(id string, req *dto.UpdateStaffRequest, userID string) (*models.StaffMember, error) {
	member, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if member.UserID != userID {
		return nil, fmt.Errorf("staff listing not found")
	}

	updates := map[string]interface{}{
		"first_name":       req.FirstName,
		"last_name":        req.LastName,
		"phone":            req.Phone,
		"email":            req.Email,
		"role":             req.Role,
		"experience_years": req.ExperienceYears,
		"status":           req.Status,
		"location":         req.Location,
		"address":          req.Address,
		"description":      req.Description,
		"resume_url":       req.ResumeURL,
		"photo_url":        req.PhotoURL,
	}
	return s.repo.Update(id, updates)
}

// Delete removes a staff listing after ownership check.
func (s *StaffService) Delete(id, userID string) error {
	member, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if member.UserID != userID {
		return fmt.Errorf("staff listing not found")
	}
	return s.repo.Delete(id)
}
