package service

import (
	"fmt"
	"time"

	"enfor-data-backend/internal/dto"
	"enfor-data-backend/internal/models"
	"enfor-data-backend/internal/repository"
)

type ProjectService struct {
	projectRepo *repository.ProjectRepository
}

func NewProjectService(projectRepo *repository.ProjectRepository) *ProjectService {
	return &ProjectService{projectRepo: projectRepo}
}

func (s *ProjectService) Create(req *dto.CreateProjectRequest, partnerID string) (*models.Project, error) {
	launchDate, err := time.Parse("2006-01-02", req.LaunchDate)
	if err != nil {
		return nil, fmt.Errorf("invalid launch_date format, use YYYY-MM-DD")
	}
	possessionDate, err := time.Parse("2006-01-02", req.PossessionDate)
	if err != nil {
		return nil, fmt.Errorf("invalid possession_date format, use YYYY-MM-DD")
	}
	if req.PriceRangeMax < req.PriceRangeMin {
		return nil, fmt.Errorf("price_range_max must be >= price_range_min")
	}
	if req.AvailableUnits > req.TotalUnits {
		return nil, fmt.Errorf("available_units cannot exceed total_units")
	}

	amenities := req.Amenities
	if amenities == nil {
		amenities = []string{}
	}

	p := &models.Project{
		Name:             req.Name,
		BuilderName:      req.BuilderName,
		ProjectType:      req.ProjectType,
		Description:      req.Description,
		Location:         req.Location,
		Address:          req.Address,
		City:             req.City,
		State:            req.State,
		TotalUnits:       req.TotalUnits,
		AvailableUnits:   req.AvailableUnits,
		PriceRangeMin:    req.PriceRangeMin,
		PriceRangeMax:    req.PriceRangeMax,
		Amenities:        amenities,
		LaunchDate:       launchDate,
		PossessionDate:   possessionDate,
		Status:           req.Status,
		BrochureURL:      req.BrochureURL,
		ChannelPartnerID: partnerID,
	}

	if err := s.projectRepo.Create(p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *ProjectService) GetByPartner(partnerID string) ([]models.Project, error) {
	return s.projectRepo.GetByPartnerID(partnerID)
}

func (s *ProjectService) GetAll() ([]models.Project, error) {
	return s.projectRepo.GetAll()
}

func (s *ProjectService) GetByID(id, partnerID string) (*models.Project, error) {
	p, err := s.projectRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if p.ChannelPartnerID != partnerID {
		return nil, fmt.Errorf("project not found")
	}
	return p, nil
}

func (s *ProjectService) Update(id string, req *dto.UpdateProjectRequest, partnerID string) (*models.Project, error) {
	p, err := s.GetByID(id, partnerID)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		p.Name = *req.Name
	}
	if req.BuilderName != nil {
		p.BuilderName = *req.BuilderName
	}
	if req.ProjectType != nil {
		p.ProjectType = *req.ProjectType
	}
	if req.Description != nil {
		p.Description = *req.Description
	}
	if req.Location != nil {
		p.Location = *req.Location
	}
	if req.Address != nil {
		p.Address = *req.Address
	}
	if req.City != nil {
		p.City = *req.City
	}
	if req.State != nil {
		p.State = *req.State
	}
	if req.TotalUnits != nil {
		p.TotalUnits = *req.TotalUnits
	}
	if req.AvailableUnits != nil {
		p.AvailableUnits = *req.AvailableUnits
	}
	if req.PriceRangeMin != nil {
		p.PriceRangeMin = *req.PriceRangeMin
	}
	if req.PriceRangeMax != nil {
		p.PriceRangeMax = *req.PriceRangeMax
	}
	if req.Amenities != nil {
		p.Amenities = req.Amenities
	}
	if req.LaunchDate != nil {
		d, err := time.Parse("2006-01-02", *req.LaunchDate)
		if err != nil {
			return nil, fmt.Errorf("invalid launch_date format")
		}
		p.LaunchDate = d
	}
	if req.PossessionDate != nil {
		d, err := time.Parse("2006-01-02", *req.PossessionDate)
		if err != nil {
			return nil, fmt.Errorf("invalid possession_date format")
		}
		p.PossessionDate = d
	}
	if req.Status != nil {
		p.Status = *req.Status
	}
	if req.BrochureURL != nil {
		p.BrochureURL = req.BrochureURL
	}

	if p.PriceRangeMax < p.PriceRangeMin {
		return nil, fmt.Errorf("price_range_max must be >= price_range_min")
	}
	if p.AvailableUnits > p.TotalUnits {
		return nil, fmt.Errorf("available_units cannot exceed total_units")
	}

	if err := s.projectRepo.Update(p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *ProjectService) Delete(id, partnerID string) error {
	if _, err := s.GetByID(id, partnerID); err != nil {
		return err
	}
	return s.projectRepo.Delete(id)
}
