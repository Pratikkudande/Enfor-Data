package repository

import (
	"database/sql"
	"fmt"

	"enfor-data-backend/internal/database"
	"enfor-data-backend/internal/models"
	"github.com/lib/pq"
)

type ClientRepository struct {
	db *database.DB
}

func NewClientRepository(db *database.DB) *ClientRepository {
	return &ClientRepository{db: db}
}

// GetClientTypes returns all types for a specific client
func (r *ClientRepository) GetClientTypes(clientID string) ([]string, error) {
	query := `SELECT type FROM client_types WHERE client_id = $1 ORDER BY created_at DESC`
	rows, err := r.db.Query(query, clientID)
	if err != nil {
		return nil, fmt.Errorf("failed to query client types: %w", err)
	}
	defer rows.Close()

	var types []string
	for rows.Next() {
		var t string
		if err := rows.Scan(&t); err != nil {
			return nil, fmt.Errorf("failed to scan client type: %w", err)
		}
		types = append(types, t)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	return types, nil
}

// GetClientTypesBatch returns all types for multiple clients in a single query
// Returns a map of client_id -> []types
func (r *ClientRepository) GetClientTypesBatch(clientIDs []string) (map[string][]string, error) {
	if len(clientIDs) == 0 {
		return make(map[string][]string), nil
	}

	// Build the query with PostgreSQL array parameter
	query := `SELECT client_id, type FROM client_types WHERE client_id = ANY($1) ORDER BY client_id, created_at DESC`
	
	rows, err := r.db.Query(query, pq.Array(clientIDs))
	if err != nil {
		return nil, fmt.Errorf("failed to query client types batch: %w", err)
	}
	defer rows.Close()

	typesMap := make(map[string][]string)
	for rows.Next() {
		var clientID, typeVal string
		if err := rows.Scan(&clientID, &typeVal); err != nil {
			return nil, fmt.Errorf("failed to scan client type: %w", err)
		}
		typesMap[clientID] = append(typesMap[clientID], typeVal)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}

	return typesMap, nil
}

// SetClientTypes replaces all types for a client with the provided list
func (r *ClientRepository) SetClientTypes(clientID string, types []string) error {
	// Start transaction
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	// Delete existing types
	_, err = tx.Exec(`DELETE FROM client_types WHERE client_id = $1`, clientID)
	if err != nil {
		return fmt.Errorf("failed to delete existing types: %w", err)
	}

	// Insert new types
	for _, t := range types {
		_, err = tx.Exec(
			`INSERT INTO client_types (client_id, type) VALUES ($1, $2) ON CONFLICT (client_id, type) DO NOTHING`,
			clientID, t,
		)
		if err != nil {
			return fmt.Errorf("failed to insert type %s: %w", t, err)
		}
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

const clientSelectCols = `
	id, first_name, last_name, email, phone, type, status,
	budget_min, budget_max,
	preferred_location, city, state, postal_code,
	broker_id,
	created_at, updated_at
`

// clientListSelectCols is the same as clientSelectCols for now (simplified)
const clientListSelectCols = `
	id, first_name, last_name, email, phone, type, status,
	budget_min, budget_max,
	preferred_location, city, state, postal_code,
	broker_id,
	created_at, updated_at
`

// scanClientList scans the columns in clientListSelectCols
func scanClientList(row interface{ Scan(...interface{}) error }) (models.Client, error) {
	var c models.Client
	err := row.Scan(
		&c.ID, &c.FirstName, &c.LastName, &c.Email, &c.Phone, &c.Type, &c.Status,
		&c.BudgetMin, &c.BudgetMax,
		&c.PreferredLocation, &c.City, &c.State, &c.PostalCode,
		&c.BrokerID,
		&c.CreatedAt, &c.UpdatedAt,
	)
	return c, err
}

func scanClient(row interface{ Scan(...interface{}) error }) (models.Client, error) {
	var c models.Client
	err := row.Scan(
		&c.ID, &c.FirstName, &c.LastName, &c.Email, &c.Phone, &c.Type, &c.Status,
		&c.BudgetMin, &c.BudgetMax,
		&c.PreferredLocation, &c.City, &c.State, &c.PostalCode,
		&c.BrokerID,
		&c.CreatedAt, &c.UpdatedAt,
	)
	return c, err
}

func (r *ClientRepository) Create(client *models.Client) error {
	// Start transaction
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	query := `
		INSERT INTO clients (
			first_name, last_name, email, phone, type, status,
			budget_min, budget_max,
			preferred_location, city, state, postal_code,
			broker_id
		) VALUES (
			$1,$2,$3,$4,$5,$6,
			$7,$8,
			COALESCE(NULLIF($9,''),''),
			COALESCE(NULLIF($10,''),''),
			COALESCE(NULLIF($11,''),''),
			COALESCE(NULLIF($12,''),''),
			$13
		)
		RETURNING id, created_at, updated_at
	`
	err = tx.QueryRow(
		query,
		client.FirstName, client.LastName, client.Email, client.Phone, client.Type, client.Status,
		client.BudgetMin, client.BudgetMax,
		client.PreferredLocation, client.City, client.State, client.PostalCode,
		client.BrokerID,
	).Scan(&client.ID, &client.CreatedAt, &client.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create client: %w", err)
	}

	// Insert types into client_types table
	if len(client.Types) > 0 {
		for _, t := range client.Types {
			_, err = tx.Exec(
				`INSERT INTO client_types (client_id, type) VALUES ($1, $2) ON CONFLICT (client_id, type) DO NOTHING`,
				client.ID, t,
			)
			if err != nil {
				return fmt.Errorf("failed to insert client type: %w", err)
			}
		}
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

func (r *ClientRepository) GetByBrokerID(brokerID string) ([]models.Client, error) {
	query := `SELECT ` + clientListSelectCols + ` FROM clients WHERE broker_id = $1 ORDER BY created_at DESC`
	rows, err := r.db.Query(query, brokerID)
	if err != nil {
		return nil, fmt.Errorf("failed to query clients: %w", err)
	}
	defer rows.Close()

	var clients []models.Client
	var clientIDs []string
	for rows.Next() {
		c, err := scanClientList(rows)
		if err != nil {
			return nil, fmt.Errorf("failed to scan client: %w", err)
		}
		clients = append(clients, c)
		clientIDs = append(clientIDs, c.ID)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	if clients == nil {
		clients = []models.Client{}
		return clients, nil
	}

	// Batch fetch all types for all clients in one query
	typesMap, err := r.GetClientTypesBatch(clientIDs)
	if err != nil {
		return nil, fmt.Errorf("failed to get client types: %w", err)
	}

	// Assign types to each client
	for i := range clients {
		if types, exists := typesMap[clients[i].ID]; exists {
			clients[i].Types = types
		} else {
			clients[i].Types = []string{}
		}
	}

	return clients, nil
}

// GetOptionsByBrokerID returns lightweight client options (id, name, phone) for
// the broker — used to populate dropdowns without fetching full client records.
func (r *ClientRepository) GetOptionsByBrokerID(brokerID string) ([]models.ClientOption, error) {
	query := `SELECT id, first_name, last_name, phone, COALESCE(email, ''), type, COALESCE(preferred_location, '')
		FROM clients WHERE broker_id = $1 ORDER BY first_name, last_name`
	rows, err := r.db.Query(query, brokerID)
	if err != nil {
		return nil, fmt.Errorf("failed to query client options: %w", err)
	}
	defer rows.Close()

	options := []models.ClientOption{}
	var clientIDs []string
	for rows.Next() {
		var o models.ClientOption
		if err := rows.Scan(&o.ID, &o.FirstName, &o.LastName, &o.Phone, &o.Email, &o.Type, &o.PreferredLocation); err != nil {
			return nil, fmt.Errorf("failed to scan client option: %w", err)
		}
		options = append(options, o)
		clientIDs = append(clientIDs, o.ID)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}

	if len(clientIDs) == 0 {
		return options, nil
	}

	// Batch fetch all types for all clients in one query
	typesMap, err := r.GetClientTypesBatch(clientIDs)
	if err != nil {
		return nil, fmt.Errorf("failed to get client types: %w", err)
	}

	// Assign types to each client option
	for i := range options {
		if types, exists := typesMap[options[i].ID]; exists {
			options[i].Types = types
		} else {
			options[i].Types = []string{}
		}
	}

	return options, nil
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

	// Fetch types for this client
	types, err := r.GetClientTypes(c.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get client types: %w", err)
	}
	c.Types = types

	return &c, nil
}

func (r *ClientRepository) Update(client *models.Client) error {
	// Start transaction
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	query := `
		UPDATE clients SET
			first_name=$1, last_name=$2, email=$3, phone=$4, type=$5, status=$6,
			budget_min=$7, budget_max=$8,
			preferred_location=$9, city=$10, state=$11, postal_code=$12,
			updated_at=NOW()
		WHERE id=$13
		RETURNING created_at, updated_at
	`
	err = tx.QueryRow(
		query,
		client.FirstName, client.LastName, client.Email, client.Phone, client.Type, client.Status,
		client.BudgetMin, client.BudgetMax,
		client.PreferredLocation, client.City, client.State, client.PostalCode,
		client.ID,
	).Scan(&client.CreatedAt, &client.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("client not found")
		}
		return fmt.Errorf("failed to update client: %w", err)
	}

	// Update types if provided
	if len(client.Types) > 0 {
		// Delete existing types
		_, err = tx.Exec(`DELETE FROM client_types WHERE client_id = $1`, client.ID)
		if err != nil {
			return fmt.Errorf("failed to delete existing types: %w", err)
		}

		// Insert new types
		for _, t := range client.Types {
			_, err = tx.Exec(
				`INSERT INTO client_types (client_id, type) VALUES ($1, $2) ON CONFLICT (client_id, type) DO NOTHING`,
				client.ID, t,
			)
			if err != nil {
				return fmt.Errorf("failed to insert type: %w", err)
			}
		}
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
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
