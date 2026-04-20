package repository

import (
	"database/sql"
	"fmt"

	"enfor-data-backend/internal/database"
	"enfor-data-backend/internal/models"

	"github.com/lib/pq"
)

// PropertyRepository handles database operations for properties
type PropertyRepository struct {
	db *database.DB
}

// NewPropertyRepository creates a new PropertyRepository instance
func NewPropertyRepository(db *database.DB) *PropertyRepository {
	return &PropertyRepository{db: db}
}

// Create inserts a new property into the database
// The broker_name and broker_city are automatically populated by database trigger
func (r *PropertyRepository) Create(property *models.Property) error {
	query := `
		INSERT INTO properties (
			title, type, listing_type, price, area,
			bedrooms, bathrooms, location, address, city, state,
			description, amenities, status, broker_id, client_id
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
		RETURNING id, broker_name, broker_city, client_name, created_at, updated_at
	`

	err := r.db.QueryRow(
		query,
		property.Title,
		property.Type,
		property.ListingType,
		property.Price,
		property.Area,
		property.Bedrooms,
		property.Bathrooms,
		property.Location,
		property.Address,
		property.City,
		property.State,
		property.Description,
		pq.Array(property.Amenities), // Handle PostgreSQL array type
		property.Status,
		property.BrokerID,
		property.ClientID,
	).Scan(
		&property.ID,
		&property.BrokerName,
		&property.BrokerCity,
		&property.ClientName,
		&property.CreatedAt,
		&property.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create property: %w", err)
	}

	return nil
}

// GetByBrokerID retrieves all properties for a specific broker
// Uses optimized composite index (broker_id, created_at DESC) for fast retrieval
func (r *PropertyRepository) GetByBrokerID(brokerID string) ([]models.Property, error) {
	query := `
		SELECT 
			id, title, type, listing_type, price, area,
			bedrooms, bathrooms, location, address, city, state,
			description, amenities, status, broker_id, client_id,
			broker_name, broker_city, client_name, created_at, updated_at
		FROM properties
		WHERE broker_id = $1 AND deleted_at IS NULL
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query, brokerID)
	if err != nil {
		return nil, fmt.Errorf("failed to query properties by broker ID: %w", err)
	}
	defer rows.Close()

	var properties []models.Property

	for rows.Next() {
		var property models.Property

		err := rows.Scan(
			&property.ID,
			&property.Title,
			&property.Type,
			&property.ListingType,
			&property.Price,
			&property.Area,
			&property.Bedrooms,
			&property.Bathrooms,
			&property.Location,
			&property.Address,
			&property.City,
			&property.State,
			&property.Description,
			pq.Array(&property.Amenities), // Handle PostgreSQL array type
			&property.Status,
			&property.BrokerID,
			&property.ClientID,
			&property.BrokerName,
			&property.BrokerCity,
			&property.ClientName,
			&property.CreatedAt,
			&property.UpdatedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan property row: %w", err)
		}

		properties = append(properties, property)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating property rows: %w", err)
	}

	// Return empty slice instead of nil if no properties found
	if properties == nil {
		properties = []models.Property{}
	}

	return properties, nil
}

// GetByID retrieves a single property by ID
// This method does NOT validate broker ownership - that should be done at the service layer
func (r *PropertyRepository) GetByID(id string) (*models.Property, error) {
	query := `
		SELECT 
			id, title, type, listing_type, price, area,
			bedrooms, bathrooms, location, address, city, state,
			description, amenities, status, broker_id, client_id,
			broker_name, broker_city, client_name, created_at, updated_at
		FROM properties
		WHERE id = $1 AND deleted_at IS NULL
	`

	var property models.Property

	err := r.db.QueryRow(query, id).Scan(
		&property.ID,
		&property.Title,
		&property.Type,
		&property.ListingType,
		&property.Price,
		&property.Area,
		&property.Bedrooms,
		&property.Bathrooms,
		&property.Location,
		&property.Address,
		&property.City,
		&property.State,
		&property.Description,
		pq.Array(&property.Amenities), // Handle PostgreSQL array type
		&property.Status,
		&property.BrokerID,
		&property.ClientID,
		&property.BrokerName,
		&property.BrokerCity,
		&property.ClientName,
		&property.CreatedAt,
		&property.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("property not found")
		}
		return nil, fmt.Errorf("failed to get property by ID: %w", err)
	}

	return &property, nil
}

// Update modifies an existing property in the database.
func (r *PropertyRepository) Update(property *models.Property) error {
	query := `
		UPDATE properties SET
			title = $1, type = $2, listing_type = $3, price = $4, area = $5,
			bedrooms = $6, bathrooms = $7, location = $8, address = $9, city = $10,
			state = $11, description = $12, amenities = $13, status = $14, client_id = $15
		WHERE id = $16 AND deleted_at IS NULL
		RETURNING broker_name, broker_city, client_name, created_at, updated_at
	`

	err := r.db.QueryRow(
		query,
		property.Title,
		property.Type,
		property.ListingType,
		property.Price,
		property.Area,
		property.Bedrooms,
		property.Bathrooms,
		property.Location,
		property.Address,
		property.City,
		property.State,
		property.Description,
		pq.Array(property.Amenities),
		property.Status,
		property.ClientID,
		property.ID,
	).Scan(
		&property.BrokerName,
		&property.BrokerCity,
		&property.ClientName,
		&property.CreatedAt,
		&property.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("property not found")
		}
		return fmt.Errorf("failed to update property: %w", err)
	}

	return nil
}

// SoftDelete marks a property as deleted without removing it from the database.
func (r *PropertyRepository) SoftDelete(id string) error {
	query := `
		UPDATE properties
		SET deleted_at = NOW(), updated_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL
	`

	result, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to soft delete property: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("property not found")
	}

	return nil
}
