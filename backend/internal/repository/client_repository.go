package repository

import (
	"database/sql"
	"fmt"

	"enfor-data-backend/internal/database"
	"enfor-data-backend/internal/models"
)

type ClientRepository struct {
	db *database.DB
}

func NewClientRepository(db *database.DB) *ClientRepository {
	return &ClientRepository{db: db}
}

const clientSelectCols = `
	id, first_name, last_name, email, phone, type, status,
	budget_min, budget_max, expected_amount,
	min_price, max_price, property_address,
	buildup_area, carpet_area, measurement_unit, deposit_budget,
	preferred_location, address, city, state, postal_code,
	requirements, notes, broker_id, broker_name, broker_city,
	created_at, updated_at
`

func scanClient(row interface{ Scan(...interface{}) error }) (models.Client, error) {
	var c models.Client
	err := row.Scan(
		&c.ID, &c.FirstName, &c.LastName, &c.Email, &c.Phone, &c.Type, &c.Status,
		&c.BudgetMin, &c.BudgetMax, &c.ExpectedAmount,
		&c.MinPrice, &c.MaxPrice, &c.PropertyAddress,
		&c.BuildupArea, &c.CarpetArea, &c.MeasurementUnit, &c.DepositBudget,
		&c.PreferredLocation, &c.Address, &c.City, &c.State, &c.PostalCode,
		&c.Requirements, &c.Notes, &c.BrokerID, &c.BrokerName, &c.BrokerCity,
		&c.CreatedAt, &c.UpdatedAt,
	)
	return c, err
}

func (r *ClientRepository) Create(client *models.Client) error {
	query := `
		INSERT INTO clients (
			first_name, last_name, email, phone, type, status,
			budget_min, budget_max, expected_amount,
			min_price, max_price, property_address,
			buildup_area, carpet_area, measurement_unit, deposit_budget,
			preferred_location, address, city, state, postal_code,
			requirements, notes, broker_id
		) VALUES (
			$1,$2,$3,$4,$5,$6,
			$7,$8,$9,
			$10,$11,$12,
			$13,$14,$15,$16,
			$17,$18,$19,$20,$21,
			$22,$23,$24
		)
		RETURNING id, broker_name, broker_city, created_at, updated_at
	`
	err := r.db.QueryRow(
		query,
		client.FirstName, client.LastName, client.Email, client.Phone, client.Type, client.Status,
		client.BudgetMin, client.BudgetMax, client.ExpectedAmount,
		client.MinPrice, client.MaxPrice, client.PropertyAddress,
		client.BuildupArea, client.CarpetArea, client.MeasurementUnit, client.DepositBudget,
		client.PreferredLocation, client.Address, client.City, client.State, client.PostalCode,
		client.Requirements, client.Notes, client.BrokerID,
	).Scan(&client.ID, &client.BrokerName, &client.BrokerCity, &client.CreatedAt, &client.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create client: %w", err)
	}
	return nil
}

func (r *ClientRepository) GetByBrokerID(brokerID string) ([]models.Client, error) {
	query := `SELECT ` + clientSelectCols + ` FROM clients WHERE broker_id = $1 ORDER BY created_at DESC`
	rows, err := r.db.Query(query, brokerID)
	if err != nil {
		return nil, fmt.Errorf("failed to query clients: %w", err)
	}
	defer rows.Close()

	var clients []models.Client
	for rows.Next() {
		c, err := scanClient(rows)
		if err != nil {
			return nil, fmt.Errorf("failed to scan client: %w", err)
		}
		clients = append(clients, c)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	if clients == nil {
		clients = []models.Client{}
	}
	return clients, nil
}

func (r *ClientRepository) GetByID(id string) (*models.Client, error) {
	query := `SELECT ` + clientSelectCols + ` FROM clients WHERE id = $1`
	c, err := scanClient(r.db.QueryRow(query, id))
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("client not found")
		}
		return nil, fmt.Errorf("failed to get client: %w", err)
	}
	return &c, nil
}

func (r *ClientRepository) Update(client *models.Client) error {
	query := `
		UPDATE clients SET
			first_name=$1, last_name=$2, email=$3, phone=$4, type=$5, status=$6,
			budget_min=$7, budget_max=$8, expected_amount=$9,
			min_price=$10, max_price=$11, property_address=$12,
			buildup_area=$13, carpet_area=$14, measurement_unit=$15, deposit_budget=$16,
			preferred_location=$17, address=$18, city=$19, state=$20, postal_code=$21,
			requirements=$22, notes=$23
		WHERE id=$24
		RETURNING broker_name, broker_city, created_at, updated_at
	`
	err := r.db.QueryRow(
		query,
		client.FirstName, client.LastName, client.Email, client.Phone, client.Type, client.Status,
		client.BudgetMin, client.BudgetMax, client.ExpectedAmount,
		client.MinPrice, client.MaxPrice, client.PropertyAddress,
		client.BuildupArea, client.CarpetArea, client.MeasurementUnit, client.DepositBudget,
		client.PreferredLocation, client.Address, client.City, client.State, client.PostalCode,
		client.Requirements, client.Notes,
		client.ID,
	).Scan(&client.BrokerName, &client.BrokerCity, &client.CreatedAt, &client.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("client not found")
		}
		return fmt.Errorf("failed to update client: %w", err)
	}
	return nil
}

func (r *ClientRepository) Delete(id string) error {
	result, err := r.db.Exec(`DELETE FROM clients WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("failed to delete client: %w", err)
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("client not found")
	}
	return nil
}

// PhoneExistsForBroker returns true if a client with the same phone already exists for this broker.
func (r *ClientRepository) PhoneExistsForBroker(phone, brokerID string) (bool, error) {
	var count int
	err := r.db.QueryRow(
		`SELECT COUNT(*) FROM clients WHERE phone = $1 AND broker_id = $2`,
		phone, brokerID,
	).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check phone existence: %w", err)
	}
	return count > 0, nil
}
