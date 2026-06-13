package service

import (
	"enfor-data-backend/internal/dto"
	"fmt"

	"enfor-data-backend/internal/models"
	"enfor-data-backend/internal/repository"
)

// ClientService handles business logic for client operations
type ClientService struct {
	clientRepo *repository.ClientRepository
	userRepo   *repository.UserRepository
}

// NewClientService creates a new ClientService instance
func NewClientService(clientRepo *repository.ClientRepository, userRepo *repository.UserRepository) *ClientService {
	return &ClientService{
		clientRepo: clientRepo,
		userRepo:   userRepo,
	}
}

// CreateClient creates a new client with validation and broker information
func (s *ClientService) CreateClient(req *dto.CreateClientRequest, brokerID string) (*models.Client, error) {
	// Validate budget range if both min and max provided
	if err := s.validateBudgetRange(req.BudgetMin, req.BudgetMax); err != nil {
		return nil, err
	}

	// Check for duplicate phone number for this broker
	exists, err := s.clientRepo.PhoneExistsForBroker(req.Phone, brokerID)
	if err != nil {
		return nil, fmt.Errorf("failed to check for duplicate: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("client with phone number %s already exists", req.Phone)
	}

	// Fetch broker information from userRepo to validate broker exists
	_, err = s.userRepo.GetUserByID(brokerID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch broker information: %w", err)
	}

	// Create Client model from CreateClientRequest
	client := &models.Client{
		FirstName:         req.FirstName,
		LastName:          req.LastName,
		Email:             req.Email,
		Phone:             req.Phone,
		Type:              req.Type,
		Status:            "active",
		BudgetMin:         req.BudgetMin,
		BudgetMax:         req.BudgetMax,
		ExpectedAmount:    req.ExpectedAmount,
		MinPrice:          req.MinPrice,
		MaxPrice:          req.MaxPrice,
		PropertyAddress:   strPtr(req.PropertyAddress),
		BuildupArea:       req.BuildupArea,
		CarpetArea:        req.CarpetArea,
		MeasurementUnit:   strPtr(req.MeasurementUnit),
		DepositBudget:     req.DepositBudget,
		PreferredLocation: req.PreferredLocation,
		Address:           req.Address,
		City:              req.City,
		State:             req.State,
		PostalCode:        req.PostalCode,
		Requirements:      req.Requirements,
		Notes:             req.Notes,
		BrokerID:          brokerID,
	}

	// Call repository Create method
	if err := s.clientRepo.Create(client); err != nil {
		return nil, fmt.Errorf("failed to create client: %w", err)
	}

	// Return created client with all populated fields (including broker info from trigger)
	return client, nil
}

// GetBrokerClients retrieves all clients for a specific broker
func (s *ClientService) GetBrokerClients(brokerID string) ([]models.Client, error) {
	// Call repository GetByBrokerID with broker_id
	clients, err := s.clientRepo.GetByBrokerID(brokerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get broker clients: %w", err)
	}

	// Return clients array directly (no additional processing needed)
	return clients, nil
}

// GetBrokerClientOptions returns lightweight client options for the broker,
// used to populate selection dropdowns.
func (s *ClientService) GetBrokerClientOptions(brokerID string) ([]models.ClientOption, error) {
	options, err := s.clientRepo.GetOptionsByBrokerID(brokerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get broker client options: %w", err)
	}
	return options, nil
}

// GetClientByID retrieves a client by ID with ownership verification
func (s *ClientService) GetClientByID(id, brokerID string) (*models.Client, error) {
	// Call repository GetByID to fetch client
	client, err := s.clientRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Verify client.broker_id matches requesting broker_id
	if client.BrokerID != brokerID {
		return nil, fmt.Errorf("access denied: client does not belong to this broker")
	}

	// Return client if verification passes
	return client, nil
}

// UpdateClient updates a client with ownership verification and validation
func (s *ClientService) UpdateClient(id string, req *dto.UpdateClientRequest, brokerID string) (*models.Client, error) {
	// Call GetClientByID to verify ownership (reuse existing logic)
	client, err := s.GetClientByID(id, brokerID)
	if err != nil {
		return nil, err
	}

	// Validate budget range if both values provided in update
	if err := s.validateBudgetRange(req.BudgetMin, req.BudgetMax); err != nil {
		return nil, err
	}

	// Apply updates to client model
	if req.FirstName != nil {
		client.FirstName = *req.FirstName
	}
	if req.LastName != nil {
		client.LastName = *req.LastName
	}
	if req.Email != nil {
		client.Email = *req.Email
	}
	if req.Phone != nil {
		client.Phone = *req.Phone
	}
	if req.Type != nil {
		client.Type = *req.Type
	}
	if req.Status != nil {
		client.Status = *req.Status
	}
	if req.BudgetMin != nil {
		client.BudgetMin = req.BudgetMin
	}
	if req.BudgetMax != nil {
		client.BudgetMax = req.BudgetMax
	}
	if req.PreferredLocation != nil {
		client.PreferredLocation = *req.PreferredLocation
	}
	if req.Address != nil {
		client.Address = *req.Address
	}
	if req.City != nil {
		client.City = *req.City
	}
	if req.State != nil {
		client.State = *req.State
	}
	if req.PostalCode != nil {
		client.PostalCode = *req.PostalCode
	}
	if req.Requirements != nil {
		client.Requirements = *req.Requirements
	}
	if req.Notes != nil {
		client.Notes = req.Notes
	}
	if req.ExpectedAmount != nil {
		client.ExpectedAmount = req.ExpectedAmount
	}
	if req.MinPrice != nil {
		client.MinPrice = req.MinPrice
	}
	if req.MaxPrice != nil {
		client.MaxPrice = req.MaxPrice
	}
	if req.PropertyAddress != nil {
		client.PropertyAddress = req.PropertyAddress
	}
	if req.BuildupArea != nil {
		client.BuildupArea = req.BuildupArea
	}
	if req.CarpetArea != nil {
		client.CarpetArea = req.CarpetArea
	}
	if req.MeasurementUnit != nil {
		client.MeasurementUnit = req.MeasurementUnit
	}
	if req.DepositBudget != nil {
		client.DepositBudget = req.DepositBudget
	}

	// Call repository Update method
	if err := s.clientRepo.Update(client); err != nil {
		return nil, fmt.Errorf("failed to update client: %w", err)
	}

	// Return updated client
	return client, nil
}

// DeleteClient deletes a client with ownership verification
func (s *ClientService) DeleteClient(id, brokerID string) error {
	// Call GetClientByID to verify ownership
	_, err := s.GetClientByID(id, brokerID)
	if err != nil {
		return err
	}

	// Call repository Delete method
	if err := s.clientRepo.Delete(id); err != nil {
		return fmt.Errorf("failed to delete client: %w", err)
	}

	return nil
}

// strPtr returns a pointer to a string, or nil if the string is empty
func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// validateBudgetRange validates that budget_min <= budget_max when both are provided
func (s *ClientService) validateBudgetRange(budgetMin, budgetMax *float64) error {
	// Check if both budget_min and budget_max are provided
	if budgetMin != nil && budgetMax != nil {
		// Validate both values are positive
		if *budgetMin <= 0 {
			return fmt.Errorf("budget_min must be a positive value")
		}
		if *budgetMax <= 0 {
			return fmt.Errorf("budget_max must be a positive value")
		}

		// Validate budget_min <= budget_max
		if *budgetMin > *budgetMax {
			return fmt.Errorf("budget_min cannot be greater than budget_max")
		}
	} else if budgetMin != nil && *budgetMin <= 0 {
		// Validate single budget_min is positive
		return fmt.Errorf("budget_min must be a positive value")
	} else if budgetMax != nil && *budgetMax <= 0 {
		// Validate single budget_max is positive
		return fmt.Errorf("budget_max must be a positive value")
	}

	return nil
}
