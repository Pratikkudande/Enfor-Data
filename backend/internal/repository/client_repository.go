package repository

import (
	"database/sql"
	"fmt"

	"enfor-data-backend/internal/database"
	"enfor-data-backend/internal/models"
)

// ClientRepository handles database operations for clients
type ClientRepository struct {
	db *database.DB
}

// NewClientRepository creates a new ClientRepository instance
func NewClientRepository(db *database.DB) *ClientRepository {
	return &ClientRepository{db: db}
}

// Create inserts a new client into the database
// The broker_name and broker_city are automatically populated by database trigger
func (r *ClientRepository) Create(client *models.Client) error {
	query := `
		INSERT INTO clients (
				first_name, last_name, email, phone, type, status,
				budget_min, budget_max, expected_amount, preferred_location, address, city, state, postal_code,
				requirements, notes, broker_id
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
		RETURNING id, broker_name, broker_city, created_at, updated_at
	`

	err := r.db.QueryRow(
		query,
		client.FirstName,
		client.LastName,
		client.Email,
		client.Phone,
		client.Type,
		client.Status,
		client.BudgetMin,
		client.BudgetMax,
		client.ExpectedAmount,
		client.PreferredLocation,
		client.Address,
		client.City,
		client.State,
		client.PostalCode,
		client.Requirements,
		client.Notes,
		client.BrokerID,
	).Scan(
		&client.ID,
		&client.BrokerName,
		&client.BrokerCity,
		&client.CreatedAt,
		&client.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create client: %w", err)
	}

	return nil
}

// GetByBrokerID retrieves all clients for a specific broker
// Uses optimized composite index (broker_id, created_at DESC) for fast retrieval
func (r *ClientRepository) GetByBrokerID(brokerID string) ([]models.Client, error) {
	query := `
		SELECT 
			id, first_name, last_name, email, phone, type, status,
			budget_min, budget_max, expected_amount, preferred_location, address, city, state, postal_code,
			requirements, notes, broker_id, broker_name, broker_city, created_at, updated_at
		FROM clients
		WHERE broker_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query, brokerID)
	if err != nil {
		return nil, fmt.Errorf("failed to query clients by broker ID: %w", err)
	}
	defer rows.Close()

	var clients []models.Client

	for rows.Next() {
		var client models.Client

		err := rows.Scan(
			&client.ID,
			&client.FirstName,
			&client.LastName,
			&client.Email,
			&client.Phone,
			&client.Type,
			&client.Status,
			&client.BudgetMin,
			&client.BudgetMax,
			&client.ExpectedAmount,
			&client.PreferredLocation,
			&client.Address,
			&client.City,
			&client.State,
			&client.PostalCode,
			&client.Requirements,
			&client.Notes,
			&client.BrokerID,
			&client.BrokerName,
			&client.BrokerCity,
			&client.CreatedAt,
			&client.UpdatedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan client row: %w", err)
		}

		clients = append(clients, client)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating client rows: %w", err)
	}

	// Return empty slice instead of nil if no clients found
	if clients == nil {
		clients = []models.Client{}
	}

	return clients, nil
}

// GetByID retrieves a single client by ID
// This method does NOT validate broker ownership - that should be done at the service layer
func (r *ClientRepository) GetByID(id string) (*models.Client, error) {
	query := `
		SELECT 
			id, first_name, last_name, email, phone, type, status,
			budget_min, budget_max, expected_amount, preferred_location, address, city, state, postal_code,
			requirements, notes, broker_id, broker_name, broker_city, created_at, updated_at
		FROM clients
		WHERE id = $1
	`

	var client models.Client

	err := r.db.QueryRow(query, id).Scan(
		&client.ID,
		&client.FirstName,
		&client.LastName,
		&client.Email,
		&client.Phone,
		&client.Type,
		&client.Status,
		&client.BudgetMin,
		&client.BudgetMax,
		&client.ExpectedAmount,
		&client.PreferredLocation,
		&client.Address,
		&client.City,
		&client.State,
		&client.PostalCode,
		&client.Requirements,
		&client.Notes,
		&client.BrokerID,
		&client.BrokerName,
		&client.BrokerCity,
		&client.CreatedAt,
		&client.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("client not found")
		}
		return nil, fmt.Errorf("failed to get client by ID: %w", err)
	}

	return &client, nil
}

// Update modifies an existing client in the database
// The updated_at timestamp is automatically updated by database trigger
func (r *ClientRepository) Update(client *models.Client) error {
	query := `
		UPDATE clients SET
			first_name = $1, last_name = $2, email = $3, phone = $4, type = $5, status = $6,
			budget_min = $7, budget_max = $8, expected_amount = $9, preferred_location = $10, address = $11,
			city = $12, state = $13, postal_code = $14, requirements = $15, notes = $16
		WHERE id = $17
		RETURNING broker_name, broker_city, created_at, updated_at
	`

	err := r.db.QueryRow(
		query,
		client.FirstName,
		client.LastName,
		client.Email,
		client.Phone,
		client.Type,
		client.Status,
		client.BudgetMin,
		client.BudgetMax,
		client.ExpectedAmount,
		client.PreferredLocation,
		client.Address,
		client.City,
		client.State,
		client.PostalCode,
		client.Requirements,
		client.Notes,
		client.ID,
	).Scan(
		&client.BrokerName,
		&client.BrokerCity,
		&client.CreatedAt,
		&client.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("client not found")
		}
		return fmt.Errorf("failed to update client: %w", err)
	}

	return nil
}

// Delete removes a client from the database
func (r *ClientRepository) Delete(id string) error {
	query := `DELETE FROM clients WHERE id = $1`

	result, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete client: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("client not found")
	}

	return nil
}
