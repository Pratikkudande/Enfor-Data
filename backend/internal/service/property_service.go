package service

import (
	"fmt"

	"enfor-data-backend/internal/models"
	"enfor-data-backend/internal/repository"
)

// PropertyService handles business logic for property operations
type PropertyService struct {
	propertyRepo *repository.PropertyRepository
	clientRepo   *repository.ClientRepository
	userRepo     *repository.UserRepository
}

// NewPropertyService creates a new PropertyService instance
func NewPropertyService(propertyRepo *repository.PropertyRepository, clientRepo *repository.ClientRepository, userRepo *repository.UserRepository) *PropertyService {
	return &PropertyService{
		propertyRepo: propertyRepo,
		clientRepo:   clientRepo,
		userRepo:     userRepo,
	}
}

// CreateProperty creates a new property with business logic validation
func (s *PropertyService) CreateProperty(req *models.CreatePropertyRequest, brokerID string) (*models.Property, error) {
	// Validate type-specific requirements
	if err := validatePropertyTypeRequirements(req.Type, req.Bedrooms, req.Bathrooms); err != nil {
		return nil, err
	}

	clientID, clientName, err := s.resolvePropertyClient(req.ClientID, brokerID)
	if err != nil {
		return nil, err
	}

	// Fetch broker information from user repository
	broker, err := s.userRepo.GetUserByID(brokerID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch broker information: %w", err)
	}

	// Create property model from request
	property := &models.Property{
		Title:       req.Title,
		Type:        req.Type,
		ListingType: req.ListingType,
		Price:       req.Price,
		Area:        req.Area,
		Bedrooms:    req.Bedrooms,
		Bathrooms:   req.Bathrooms,
		Location:    req.Location,
		Address:     req.Address,
		City:        req.City,
		State:       req.State,
		Description: req.Description,
		Amenities:   req.Amenities,
		Status:      "available", // Default status
		BrokerID:    brokerID,
		ClientID:    clientID,
		ClientName:  clientName,
	}

	// Populate broker information
	brokerName := fmt.Sprintf("%s %s", broker.FirstName, broker.LastName)
	property.BrokerName = &brokerName
	property.BrokerCity = &broker.City

	// Handle amenities array - ensure it's not nil
	if property.Amenities == nil {
		property.Amenities = []string{}
	}

	// Create property in repository
	if err := s.propertyRepo.Create(property); err != nil {
		return nil, fmt.Errorf("failed to create property: %w", err)
	}

	return property, nil
}

// GetBrokerProperties retrieves all properties for a specific broker
func (s *PropertyService) GetBrokerProperties(brokerID string) ([]models.Property, error) {
	properties, err := s.propertyRepo.GetByBrokerID(brokerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get broker properties: %w", err)
	}

	return properties, nil
}

// GetPropertyByID retrieves a single property with ownership verification.
func (s *PropertyService) GetPropertyByID(id, brokerID string) (*models.Property, error) {
	property, err := s.propertyRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if property.BrokerID != brokerID {
		return nil, fmt.Errorf("access denied: property does not belong to this broker")
	}

	return property, nil
}

// UpdateProperty updates a property with ownership verification and type-aware validation.
func (s *PropertyService) UpdateProperty(id string, req *models.UpdatePropertyRequest, brokerID string) (*models.Property, error) {
	property, err := s.GetPropertyByID(id, brokerID)
	if err != nil {
		return nil, err
	}

	if req.Title != nil {
		property.Title = *req.Title
	}
	if req.Type != nil {
		property.Type = *req.Type
	}
	if req.ListingType != nil {
		property.ListingType = *req.ListingType
	}
	if req.Price != nil {
		property.Price = *req.Price
	}
	if req.Area != nil {
		property.Area = *req.Area
	}
	if req.Bedrooms != nil {
		property.Bedrooms = req.Bedrooms
	}
	if req.Bathrooms != nil {
		property.Bathrooms = req.Bathrooms
	}
	if req.Location != nil {
		property.Location = *req.Location
	}
	if req.Address != nil {
		property.Address = *req.Address
	}
	if req.City != nil {
		property.City = *req.City
	}
	if req.State != nil {
		property.State = *req.State
	}
	if req.Description != nil {
		property.Description = *req.Description
	}
	if req.Amenities != nil {
		property.Amenities = req.Amenities
	}
	if req.Status != nil {
		property.Status = *req.Status
	}
	if req.ClientID != nil {
		clientID, clientName, err := s.resolvePropertyClient(req.ClientID, brokerID)
		if err != nil {
			return nil, err
		}
		property.ClientID = clientID
		property.ClientName = clientName
	}

	if err := validatePropertyTypeRequirements(property.Type, property.Bedrooms, property.Bathrooms); err != nil {
		return nil, err
	}

	if property.Amenities == nil {
		property.Amenities = []string{}
	}

	if err := s.propertyRepo.Update(property); err != nil {
		return nil, fmt.Errorf("failed to update property: %w", err)
	}

	return property, nil
}

// DeleteProperty soft deletes a property after ownership verification.
func (s *PropertyService) DeleteProperty(id, brokerID string) error {
	_, err := s.GetPropertyByID(id, brokerID)
	if err != nil {
		return err
	}

	if err := s.propertyRepo.SoftDelete(id); err != nil {
		return fmt.Errorf("failed to delete property: %w", err)
	}

	return nil
}

func (s *PropertyService) resolvePropertyClient(clientID *string, brokerID string) (*string, *string, error) {
	if clientID == nil {
		return nil, nil, nil
	}

	if *clientID == "" {
		return nil, nil, nil
	}

	client, err := s.clientRepo.GetByID(*clientID)
	if err != nil {
		return nil, nil, fmt.Errorf("invalid client_id: %w", err)
	}

	if client.BrokerID != brokerID {
		return nil, nil, fmt.Errorf("client does not belong to broker")
	}

	clientName := fmt.Sprintf("%s %s", client.FirstName, client.LastName)
	return clientID, &clientName, nil
}

// validatePropertyTypeRequirements validates type-specific requirements.
func validatePropertyTypeRequirements(propertyType string, bedrooms, bathrooms *int) error {
	// For apartments and houses, bedrooms and bathrooms are required
	if propertyType == "apartment" || propertyType == "house" {
		if bedrooms == nil {
			return fmt.Errorf("bedrooms are required for property type '%s'", propertyType)
		}
		if bathrooms == nil {
			return fmt.Errorf("bathrooms are required for property type '%s'", propertyType)
		}

		// Validate positive values
		if *bedrooms < 0 {
			return fmt.Errorf("bedrooms must be a positive number")
		}
		if *bathrooms < 0 {
			return fmt.Errorf("bathrooms must be a positive number")
		}
	}

	// For commercial and plot, bedrooms and bathrooms are optional
	// No additional validation needed for these types

	return nil
}
