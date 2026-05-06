package repository

import (
	"database/sql"
	"fmt"

	"enfor-data-backend/internal/database"
	"enfor-data-backend/internal/models"
)

// AgreementRepository handles all DB operations for agreements
type AgreementRepository struct {
	db *database.DB
}

func NewAgreementRepository(db *database.DB) *AgreementRepository {
	return &AgreementRepository{db: db}
}

// Create inserts a new agreement. Denormalized fields are filled by DB trigger.
func (r *AgreementRepository) Create(a *models.Agreement) error {
	query := `
		INSERT INTO agreements (property_id, client_id, broker_id, start_date, end_date, status)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, property_title, property_address, client_name, broker_name, created_at, updated_at
	`
	err := r.db.QueryRow(
		query,
		a.PropertyID,
		a.ClientID,
		a.BrokerID,
		a.StartDate,
		a.EndDate,
		a.Status,
	).Scan(
		&a.ID,
		&a.PropertyTitle,
		&a.PropertyAddress,
		&a.ClientName,
		&a.BrokerName,
		&a.CreatedAt,
		&a.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create agreement: %w", err)
	}
	return nil
}

// GetByBrokerID returns all agreements for a broker, newest first.
func (r *AgreementRepository) GetByBrokerID(brokerID string) ([]models.Agreement, error) {
	query := `
		SELECT id, property_id, client_id, broker_id, start_date, end_date, status,
		       property_title, property_address, client_name, broker_name, created_at, updated_at
		FROM agreements
		WHERE broker_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(query, brokerID)
	if err != nil {
		return nil, fmt.Errorf("failed to query agreements: %w", err)
	}
	defer rows.Close()

	var list []models.Agreement
	for rows.Next() {
		var a models.Agreement
		if err := rows.Scan(
			&a.ID, &a.PropertyID, &a.ClientID, &a.BrokerID,
			&a.StartDate, &a.EndDate, &a.Status,
			&a.PropertyTitle, &a.PropertyAddress, &a.ClientName, &a.BrokerName,
			&a.CreatedAt, &a.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan agreement row: %w", err)
		}
		list = append(list, a)
	}
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating agreement rows: %w", err)
	}
	if list == nil {
		list = []models.Agreement{}
	}
	return list, nil
}

// GetByID returns a single agreement by ID.
func (r *AgreementRepository) GetByID(id string) (*models.Agreement, error) {
	query := `
		SELECT id, property_id, client_id, broker_id, start_date, end_date, status,
		       property_title, property_address, client_name, broker_name, created_at, updated_at
		FROM agreements
		WHERE id = $1
	`
	var a models.Agreement
	err := r.db.QueryRow(query, id).Scan(
		&a.ID, &a.PropertyID, &a.ClientID, &a.BrokerID,
		&a.StartDate, &a.EndDate, &a.Status,
		&a.PropertyTitle, &a.PropertyAddress, &a.ClientName, &a.BrokerName,
		&a.CreatedAt, &a.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("agreement not found")
		}
		return nil, fmt.Errorf("failed to get agreement: %w", err)
	}
	return &a, nil
}

// UpdateStatus updates only the status field of an agreement.
func (r *AgreementRepository) UpdateStatus(id, status string) (*models.Agreement, error) {
	query := `
		UPDATE agreements
		SET status = $1
		WHERE id = $2
		RETURNING id, property_id, client_id, broker_id, start_date, end_date, status,
		          property_title, property_address, client_name, broker_name, created_at, updated_at
	`
	var a models.Agreement
	err := r.db.QueryRow(query, status, id).Scan(
		&a.ID, &a.PropertyID, &a.ClientID, &a.BrokerID,
		&a.StartDate, &a.EndDate, &a.Status,
		&a.PropertyTitle, &a.PropertyAddress, &a.ClientName, &a.BrokerName,
		&a.CreatedAt, &a.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("agreement not found")
		}
		return nil, fmt.Errorf("failed to update agreement: %w", err)
	}
	return &a, nil
}

// Delete permanently removes an agreement.
func (r *AgreementRepository) Delete(id string) error {
	result, err := r.db.Exec(`DELETE FROM agreements WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("failed to delete agreement: %w", err)
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("agreement not found")
	}
	return nil
}
