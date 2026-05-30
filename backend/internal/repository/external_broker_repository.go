package repository

import (
	"database/sql"
	"fmt"

	"enfor-data-backend/internal/database"
	"enfor-data-backend/internal/models"
)

type ExternalBrokerRepository struct {
	db *database.DB
}

func NewExternalBrokerRepository(db *database.DB) *ExternalBrokerRepository {
	return &ExternalBrokerRepository{db: db}
}

const extBrokerCols = `
	id, name, mobile_number, area, location, notes,
	added_by, added_by_name, added_by_city, created_at, updated_at
`

func scanExtBroker(row interface{ Scan(...interface{}) error }) (models.ExternalBroker, error) {
	var b models.ExternalBroker
	err := row.Scan(
		&b.ID, &b.Name, &b.MobileNumber, &b.Area, &b.Location, &b.Notes,
		&b.AddedBy, &b.AddedByName, &b.AddedByCity, &b.CreatedAt, &b.UpdatedAt,
	)
	return b, err
}

// Create inserts a new external broker record.
func (r *ExternalBrokerRepository) Create(b *models.ExternalBroker) error {
	query := `
		INSERT INTO external_brokers (name, mobile_number, area, location, notes, added_by)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, added_by_name, added_by_city, created_at, updated_at
	`
	err := r.db.QueryRow(query,
		b.Name, b.MobileNumber, b.Area, b.Location, b.Notes, b.AddedBy,
	).Scan(&b.ID, &b.AddedByName, &b.AddedByCity, &b.CreatedAt, &b.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create external broker: %w", err)
	}
	return nil
}

// GetAll returns all external brokers visible to every EnforData user, with optional filters.
func (r *ExternalBrokerRepository) GetAll(area, location *string) ([]models.ExternalBroker, error) {
	query := `SELECT ` + extBrokerCols + ` FROM external_brokers WHERE 1=1`
	args := []interface{}{}
	idx := 1

	if area != nil && *area != "" {
		query += fmt.Sprintf(" AND LOWER(area) LIKE LOWER($%d)", idx)
		args = append(args, "%"+*area+"%")
		idx++
	}
	if location != nil && *location != "" {
		query += fmt.Sprintf(" AND LOWER(location) LIKE LOWER($%d)", idx)
		args = append(args, "%"+*location+"%")
		idx++
	}
	query += " ORDER BY created_at DESC"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query external brokers: %w", err)
	}
	defer rows.Close()

	var list []models.ExternalBroker
	for rows.Next() {
		b, err := scanExtBroker(rows)
		if err != nil {
			return nil, fmt.Errorf("failed to scan external broker: %w", err)
		}
		list = append(list, b)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	if list == nil {
		list = []models.ExternalBroker{}
	}
	return list, nil
}

// GetByID fetches one record.
func (r *ExternalBrokerRepository) GetByID(id string) (*models.ExternalBroker, error) {
	query := `SELECT ` + extBrokerCols + ` FROM external_brokers WHERE id = $1`
	b, err := scanExtBroker(r.db.QueryRow(query, id))
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("external broker not found")
		}
		return nil, fmt.Errorf("failed to get external broker: %w", err)
	}
	return &b, nil
}

// Update saves changes to name, mobile, area, location, notes.
func (r *ExternalBrokerRepository) Update(b *models.ExternalBroker) error {
	query := `
		UPDATE external_brokers
		SET name=$1, mobile_number=$2, area=$3, location=$4, notes=$5
		WHERE id=$6
		RETURNING added_by_name, added_by_city, created_at, updated_at
	`
	err := r.db.QueryRow(query,
		b.Name, b.MobileNumber, b.Area, b.Location, b.Notes, b.ID,
	).Scan(&b.AddedByName, &b.AddedByCity, &b.CreatedAt, &b.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("external broker not found")
		}
		return fmt.Errorf("failed to update external broker: %w", err)
	}
	return nil
}

// Delete removes a record by ID.
func (r *ExternalBrokerRepository) Delete(id string) error {
	res, err := r.db.Exec(`DELETE FROM external_brokers WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("failed to delete external broker: %w", err)
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return fmt.Errorf("external broker not found")
	}
	return nil
}

// MobileExists returns true if the mobile number is already in the table.
func (r *ExternalBrokerRepository) MobileExists(mobile string) (bool, error) {
	var count int
	err := r.db.QueryRow(
		`SELECT COUNT(*) FROM external_brokers WHERE mobile_number = $1`, mobile,
	).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check mobile: %w", err)
	}
	return count > 0, nil
}

// MobileExistsExcluding checks for duplicate mobile excluding the given id (for updates).
func (r *ExternalBrokerRepository) MobileExistsExcluding(mobile, excludeID string) (bool, error) {
	var count int
	err := r.db.QueryRow(
		`SELECT COUNT(*) FROM external_brokers WHERE mobile_number = $1 AND id != $2`,
		mobile, excludeID,
	).Scan(&count)
	return count > 0, err
}
