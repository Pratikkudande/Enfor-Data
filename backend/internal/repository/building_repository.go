package repository

import (
	"database/sql"
	"fmt"

	"enfor-data-backend/internal/database"
	"enfor-data-backend/internal/models"
)

type BuildingRepository struct {
	db *database.DB
}

func NewBuildingRepository(db *database.DB) *BuildingRepository {
	return &BuildingRepository{db: db}
}

const buildingSelectCols = `
	id, owner_name, mobile_number, building_name, area, notes,
	broker_id, broker_name, broker_city, created_at, updated_at
`

func scanBuilding(row interface{ Scan(...interface{}) error }) (models.BuildingContact, error) {
	var b models.BuildingContact
	err := row.Scan(
		&b.ID, &b.OwnerName, &b.MobileNumber, &b.BuildingName, &b.Area, &b.Notes,
		&b.BrokerID, &b.BrokerName, &b.BrokerCity, &b.CreatedAt, &b.UpdatedAt,
	)
	return b, err
}

func (r *BuildingRepository) Create(b *models.BuildingContact) error {
	query := `
		INSERT INTO building_contacts (
			owner_name, mobile_number, building_name, area, notes, broker_id
		) VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, broker_name, broker_city, created_at, updated_at
	`
	err := r.db.QueryRow(
		query,
		b.OwnerName, b.MobileNumber, b.BuildingName, b.Area, b.Notes, b.BrokerID,
	).Scan(&b.ID, &b.BrokerName, &b.BrokerCity, &b.CreatedAt, &b.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create building contact: %w", err)
	}
	return nil
}

func (r *BuildingRepository) GetByBrokerID(brokerID string, area, building *string) ([]models.BuildingContact, error) {
	query := `SELECT ` + buildingSelectCols + ` FROM building_contacts WHERE broker_id = $1`
	args := []interface{}{brokerID}
	argIdx := 2

	if area != nil && *area != "" {
		query += fmt.Sprintf(" AND LOWER(area) LIKE LOWER($%d)", argIdx)
		args = append(args, "%"+*area+"%")
		argIdx++
	}
	if building != nil && *building != "" {
		query += fmt.Sprintf(" AND LOWER(building_name) LIKE LOWER($%d)", argIdx)
		args = append(args, "%"+*building+"%")
		argIdx++
	}

	query += " ORDER BY created_at DESC"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query building contacts: %w", err)
	}
	defer rows.Close()

	var contacts []models.BuildingContact
	for rows.Next() {
		b, err := scanBuilding(rows)
		if err != nil {
			return nil, fmt.Errorf("failed to scan building contact: %w", err)
		}
		contacts = append(contacts, b)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	if contacts == nil {
		contacts = []models.BuildingContact{}
	}
	return contacts, nil
}

func (r *BuildingRepository) GetByID(id string) (*models.BuildingContact, error) {
	query := `SELECT ` + buildingSelectCols + ` FROM building_contacts WHERE id = $1`
	b, err := scanBuilding(r.db.QueryRow(query, id))
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("building contact not found")
		}
		return nil, fmt.Errorf("failed to get building contact: %w", err)
	}
	return &b, nil
}

func (r *BuildingRepository) Update(b *models.BuildingContact) error {
	query := `
		UPDATE building_contacts SET
			owner_name=$1, mobile_number=$2, building_name=$3, area=$4, notes=$5
		WHERE id=$6
		RETURNING broker_name, broker_city, created_at, updated_at
	`
	err := r.db.QueryRow(
		query,
		b.OwnerName, b.MobileNumber, b.BuildingName, b.Area, b.Notes, b.ID,
	).Scan(&b.BrokerName, &b.BrokerCity, &b.CreatedAt, &b.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("building contact not found")
		}
		return fmt.Errorf("failed to update building contact: %w", err)
	}
	return nil
}

func (r *BuildingRepository) Delete(id string) error {
	result, err := r.db.Exec(`DELETE FROM building_contacts WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("failed to delete building contact: %w", err)
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("building contact not found")
	}
	return nil
}

// MobileExistsForBroker returns true if a contact with the same mobile already exists for this broker.
func (r *BuildingRepository) MobileExistsForBroker(mobile, brokerID string) (bool, error) {
	var count int
	err := r.db.QueryRow(
		`SELECT COUNT(*) FROM building_contacts WHERE mobile_number = $1 AND broker_id = $2`,
		mobile, brokerID,
	).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check mobile existence: %w", err)
	}
	return count > 0, nil
}

// MobileExistsForBrokerExcluding checks for duplicate mobile excluding the given contact id (for updates).
func (r *BuildingRepository) MobileExistsForBrokerExcluding(mobile, brokerID, excludeID string) (bool, error) {
	var count int
	err := r.db.QueryRow(
		`SELECT COUNT(*) FROM building_contacts WHERE mobile_number = $1 AND broker_id = $2 AND id != $3`,
		mobile, brokerID, excludeID,
	).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check mobile existence: %w", err)
	}
	return count > 0, nil
}

// GetByIDs retrieves multiple building contacts by their IDs
func (r *BuildingRepository) GetByIDs(ids []string) ([]models.BuildingContact, error) {
	if len(ids) == 0 {
		return []models.BuildingContact{}, nil
	}

	query := `SELECT ` + buildingSelectCols + ` FROM building_contacts WHERE id = ANY($1)`
	rows, err := r.db.Query(query, ids)
	if err != nil {
		return nil, fmt.Errorf("failed to query building contacts by IDs: %w", err)
	}
	defer rows.Close()

	var contacts []models.BuildingContact
	for rows.Next() {
		b, err := scanBuilding(rows)
		if err != nil {
			return nil, fmt.Errorf("failed to scan building contact: %w", err)
		}
		contacts = append(contacts, b)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	if contacts == nil {
		contacts = []models.BuildingContact{}
	}
	return contacts, nil
}
