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
			description, amenities, photos, status, broker_id, client_id
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
		pq.Array(property.Photos),    // Handle PostgreSQL array type
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
			description, amenities, photos, status, broker_id, client_id,
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
			pq.Array(&property.Photos),    // Handle PostgreSQL array type
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
			description, amenities, photos, status, broker_id, client_id,
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
		pq.Array(&property.Photos),    // Handle PostgreSQL array type
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
			state = $11, description = $12, amenities = $13, photos = $14, status = $15, client_id = $16
		WHERE id = $17 AND deleted_at IS NULL
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
		pq.Array(property.Photos),
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

// GetAllProperties retrieves all properties from all brokers (read access for network view)
// Joins users table for broker contact and clients table for client contact
func (r *PropertyRepository) GetAllProperties() ([]models.Property, error) {
	query := `
		SELECT 
			p.id, p.title, p.type, p.listing_type, p.price, p.area,
			p.bedrooms, p.bathrooms, p.location, p.address, p.city, p.state,
			p.description, p.amenities, p.photos, p.status, p.broker_id, p.client_id,
			p.broker_name, p.broker_city, p.client_name,
			u.whatsapp_number  AS broker_whatsapp,
			u.email            AS broker_email,
			c.phone            AS client_phone,
			c.email            AS client_email,
			p.created_at, p.updated_at
		FROM properties p
		JOIN users u ON u.id = p.broker_id
		LEFT JOIN clients c ON c.id = p.client_id
		WHERE p.deleted_at IS NULL
		ORDER BY p.created_at DESC
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query all properties: %w", err)
	}
	defer rows.Close()

	var properties []models.Property
	for rows.Next() {
		var p models.Property
		err := rows.Scan(
			&p.ID, &p.Title, &p.Type, &p.ListingType, &p.Price, &p.Area,
			&p.Bedrooms, &p.Bathrooms, &p.Location, &p.Address, &p.City, &p.State,
			&p.Description, pq.Array(&p.Amenities), pq.Array(&p.Photos), &p.Status, &p.BrokerID, &p.ClientID,
			&p.BrokerName, &p.BrokerCity, &p.ClientName,
			&p.BrokerWhatsapp, &p.BrokerEmail,
			&p.ClientPhone, &p.ClientEmail,
			&p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan property row: %w", err)
		}
		properties = append(properties, p)
	}
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating property rows: %w", err)
	}
	if properties == nil {
		properties = []models.Property{}
	}
	return properties, nil
}

// GetByIDPublic retrieves a single property by ID without ownership check (read-only access)
func (r *PropertyRepository) GetByIDPublic(id string) (*models.Property, error) {
	query := `
		SELECT 
			p.id, p.title, p.type, p.listing_type, p.price, p.area,
			p.bedrooms, p.bathrooms, p.location, p.address, p.city, p.state,
			p.description, p.amenities, p.photos, p.status, p.broker_id, p.client_id,
			p.broker_name, p.broker_city, p.client_name,
			u.whatsapp_number  AS broker_whatsapp,
			u.email            AS broker_email,
			c.phone            AS client_phone,
			c.email            AS client_email,
			p.created_at, p.updated_at
		FROM properties p
		JOIN users u ON u.id = p.broker_id
		LEFT JOIN clients c ON c.id = p.client_id
		WHERE p.id = $1 AND p.deleted_at IS NULL
	`
	var p models.Property
	err := r.db.QueryRow(query, id).Scan(
		&p.ID, &p.Title, &p.Type, &p.ListingType, &p.Price, &p.Area,
		&p.Bedrooms, &p.Bathrooms, &p.Location, &p.Address, &p.City, &p.State,
		&p.Description, pq.Array(&p.Amenities), pq.Array(&p.Photos), &p.Status, &p.BrokerID, &p.ClientID,
		&p.BrokerName, &p.BrokerCity, &p.ClientName,
		&p.BrokerWhatsapp, &p.BrokerEmail,
		&p.ClientPhone, &p.ClientEmail,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("property not found")
		}
		return nil, fmt.Errorf("failed to get property by ID: %w", err)
	}
	return &p, nil
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
