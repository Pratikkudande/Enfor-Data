package repository

import (
	"database/sql"
	"fmt"

	"enfor-data-backend/internal/database"
	"enfor-data-backend/internal/models"
)

type ClientRequirementRepository struct {
	db *database.DB
}

func NewClientRequirementRepository(db *database.DB) *ClientRequirementRepository {
	return &ClientRequirementRepository{db: db}
}

// CreateRequirement creates a new client requirement
func (r *ClientRequirementRepository) CreateRequirement(req *models.ClientRequirement) error {
	query := `
		INSERT INTO client_requirements (
			client_id, requirement_type, buildup_area, carpet_area, measurement_unit,
			min_budget, max_budget, deposit_budget, preferred_location, city, state,
			postal_code, enquiry, notes, status, created_by
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
		RETURNING id, created_at, updated_at
	`

	return r.db.QueryRow(
		query,
		req.ClientID, req.RequirementType, req.BuildupArea, req.CarpetArea, req.MeasurementUnit,
		req.MinBudget, req.MaxBudget, req.DepositBudget, req.PreferredLocation, req.City,
		req.State, req.PostalCode, req.Enquiry, req.Notes, req.Status, req.CreatedBy,
	).Scan(&req.ID, &req.CreatedAt, &req.UpdatedAt)
}

// GetRequirementsByBrokerID gets all requirements for a broker
func (r *ClientRequirementRepository) GetRequirementsByBrokerID(brokerID string) ([]models.ClientRequirement, error) {
	query := `
		SELECT 
			cr.id, cr.client_id, cr.requirement_type, cr.buildup_area, cr.carpet_area,
			cr.measurement_unit, cr.min_budget, cr.max_budget, cr.deposit_budget,
			cr.preferred_location, cr.city, cr.state, cr.postal_code, cr.enquiry,
			cr.notes, cr.status, cr.created_by, cr.created_at, cr.updated_at,
			CONCAT(c.first_name, ' ', c.last_name) as client_name,
			c.phone as client_phone
		FROM client_requirements cr
		INNER JOIN clients c ON cr.client_id = c.id
		WHERE c.broker_id = $1
		ORDER BY cr.created_at DESC
	`

	rows, err := r.db.Query(query, brokerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get requirements: %w", err)
	}
	defer rows.Close()

	var requirements []models.ClientRequirement
	for rows.Next() {
		var req models.ClientRequirement
		err := rows.Scan(
			&req.ID, &req.ClientID, &req.RequirementType, &req.BuildupArea, &req.CarpetArea,
			&req.MeasurementUnit, &req.MinBudget, &req.MaxBudget, &req.DepositBudget,
			&req.PreferredLocation, &req.City, &req.State, &req.PostalCode, &req.Enquiry,
			&req.Notes, &req.Status, &req.CreatedBy, &req.CreatedAt, &req.UpdatedAt,
			&req.ClientName, &req.ClientPhone,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan requirement: %w", err)
		}
		requirements = append(requirements, req)
	}

	return requirements, nil
}

// GetRequirementByID gets a requirement by ID
func (r *ClientRequirementRepository) GetRequirementByID(requirementID, brokerID string) (*models.ClientRequirement, error) {
	query := `
		SELECT 
			cr.id, cr.client_id, cr.requirement_type, cr.buildup_area, cr.carpet_area,
			cr.measurement_unit, cr.min_budget, cr.max_budget, cr.deposit_budget,
			cr.preferred_location, cr.city, cr.state, cr.postal_code, cr.enquiry,
			cr.notes, cr.status, cr.created_by, cr.created_at, cr.updated_at,
			CONCAT(c.first_name, ' ', c.last_name) as client_name,
			c.phone as client_phone
		FROM client_requirements cr
		INNER JOIN clients c ON cr.client_id = c.id
		WHERE cr.id = $1 AND c.broker_id = $2
	`

	var req models.ClientRequirement
	err := r.db.QueryRow(query, requirementID, brokerID).Scan(
		&req.ID, &req.ClientID, &req.RequirementType, &req.BuildupArea, &req.CarpetArea,
		&req.MeasurementUnit, &req.MinBudget, &req.MaxBudget, &req.DepositBudget,
		&req.PreferredLocation, &req.City, &req.State, &req.PostalCode, &req.Enquiry,
		&req.Notes, &req.Status, &req.CreatedBy, &req.CreatedAt, &req.UpdatedAt,
		&req.ClientName, &req.ClientPhone,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get requirement: %w", err)
	}

	return &req, nil
}

// GetRequirementsByClientID gets all requirements for a specific client
func (r *ClientRequirementRepository) GetRequirementsByClientID(clientID, brokerID string) ([]models.ClientRequirement, error) {
	query := `
		SELECT 
			cr.id, cr.client_id, cr.requirement_type, cr.buildup_area, cr.carpet_area,
			cr.measurement_unit, cr.min_budget, cr.max_budget, cr.deposit_budget,
			cr.preferred_location, cr.city, cr.state, cr.postal_code, cr.enquiry,
			cr.notes, cr.status, cr.created_by, cr.created_at, cr.updated_at,
			CONCAT(c.first_name, ' ', c.last_name) as client_name,
			c.phone as client_phone
		FROM client_requirements cr
		INNER JOIN clients c ON cr.client_id = c.id
		WHERE cr.client_id = $1 AND c.broker_id = $2
		ORDER BY cr.created_at DESC
	`

	rows, err := r.db.Query(query, clientID, brokerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get requirements: %w", err)
	}
	defer rows.Close()

	var requirements []models.ClientRequirement
	for rows.Next() {
		var req models.ClientRequirement
		err := rows.Scan(
			&req.ID, &req.ClientID, &req.RequirementType, &req.BuildupArea, &req.CarpetArea,
			&req.MeasurementUnit, &req.MinBudget, &req.MaxBudget, &req.DepositBudget,
			&req.PreferredLocation, &req.City, &req.State, &req.PostalCode, &req.Enquiry,
			&req.Notes, &req.Status, &req.CreatedBy, &req.CreatedAt, &req.UpdatedAt,
			&req.ClientName, &req.ClientPhone,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan requirement: %w", err)
		}
		requirements = append(requirements, req)
	}

	return requirements, nil
}

// UpdateRequirement updates a requirement
func (r *ClientRequirementRepository) UpdateRequirement(req *models.ClientRequirement) error {
	query := `
		UPDATE client_requirements SET
			requirement_type = $1, buildup_area = $2, carpet_area = $3, measurement_unit = $4,
			min_budget = $5, max_budget = $6, deposit_budget = $7, preferred_location = $8,
			city = $9, state = $10, postal_code = $11, enquiry = $12, notes = $13, status = $14
		WHERE id = $15
	`

	_, err := r.db.Exec(
		query,
		req.RequirementType, req.BuildupArea, req.CarpetArea, req.MeasurementUnit,
		req.MinBudget, req.MaxBudget, req.DepositBudget, req.PreferredLocation,
		req.City, req.State, req.PostalCode, req.Enquiry, req.Notes, req.Status, req.ID,
	)

	return err
}

// DeleteRequirement deletes a requirement
func (r *ClientRequirementRepository) DeleteRequirement(requirementID, brokerID string) error {
	query := `
		DELETE FROM client_requirements cr
		USING clients c
		WHERE cr.id = $1 AND cr.client_id = c.id AND c.broker_id = $2
	`

	_, err := r.db.Exec(query, requirementID, brokerID)
	return err
}
