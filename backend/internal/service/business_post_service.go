package service

import (
	"fmt"

	"enfor-data-backend/internal/dto"
	"enfor-data-backend/internal/models"
	"enfor-data-backend/internal/repository"
)

// BusinessPostService handles business logic for business posts.
type BusinessPostService struct {
	repo *repository.BusinessPostRepository
}

func NewBusinessPostService(repo *repository.BusinessPostRepository) *BusinessPostService {
	return &BusinessPostService{repo: repo}
}

// Create validates and persists a new business post.
func (s *BusinessPostService) Create(req *dto.CreateBusinessPostRequest, userID string) (*models.BusinessPost, error) {
	status := "active"
	if req.Status != "" {
		status = req.Status
	}

	post := &models.BusinessPost{
		UserID:          userID,
		Title:           req.Title,
		Category:        req.Category,
		Subcategory:     req.Subcategory,
		Description:     req.Description,
		Price:           req.Price,
		Location:        req.Location,
		Status:          status,
		ContactName:     req.ContactName,
		ContactPhone:    req.ContactPhone,
		ContactEmail:    req.ContactEmail,
		ContactWhatsapp: req.ContactWhatsapp,
		ContactAddress:  req.ContactAddress,
		ServiceArea:     req.ServiceArea,
		Rating:          req.Rating,
		Images:          req.Images,
		ResumeURL:       req.ResumeURL,
	}

	if post.Images == nil {
		post.Images = []string{}
	}

	if err := s.repo.Create(post); err != nil {
		return nil, fmt.Errorf("failed to create business post: %w", err)
	}
	return post, nil
}

// GetAll returns the public feed with optional filters.
func (s *BusinessPostService) GetAll(category, subcategory, location string) ([]models.BusinessPost, error) {
	return s.repo.GetAll(category, subcategory, location)
}

// GetMyPosts returns posts created by the authenticated user.
func (s *BusinessPostService) GetMyPosts(userID string) ([]models.BusinessPost, error) {
	return s.repo.GetByUser(userID)
}

// GetByID returns a single post.
func (s *BusinessPostService) GetByID(id string) (*models.BusinessPost, error) {
	return s.repo.GetByID(id)
}

// Update applies partial updates, verifying ownership.
func (s *BusinessPostService) Update(id string, req *dto.UpdateBusinessPostRequest, userID string) (*models.BusinessPost, error) {
	post, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if post.UserID != userID {
		return nil, fmt.Errorf("post not found")
	}
	return s.repo.Update(id, req.Title, req.Description, req.Location, req.Status, req.Price, req.ServiceArea, req.Rating)
}

// Delete removes a post after ownership check.
func (s *BusinessPostService) Delete(id, userID string) error {
	post, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if post.UserID != userID {
		return fmt.Errorf("post not found")
	}
	return s.repo.Delete(id)
}
