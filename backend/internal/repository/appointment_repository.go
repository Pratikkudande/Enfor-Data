package repository

import (
	"enfor-data-backend/internal/dto"
	"database/sql"
	"fmt"
	"time"

	"enfor-data-backend/internal/database"
	"enfor-data-backend/internal/models"
)

// AppointmentRepository handles database operations for appointments
type AppointmentRepository struct {
	db *database.DB
}

// NewAppointmentRepository creates a new AppointmentRepository instance
func NewAppointmentRepository(db *database.DB) *AppointmentRepository {
	return &AppointmentRepository{db: db}
}

// Create inserts a new appointment into the database
// The denormalized fields are automatically populated by database triggers
func (r *AppointmentRepository) Create(appointment *models.Appointment) error {
	query := `
		INSERT INTO appointments (
			title, description, date, time, client_id, property_id, broker_id, type, status
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, client_name, client_phone, property_address, broker_name, broker_city, created_at, updated_at
	`

	err := r.db.QueryRow(
		query,
		appointment.Title,
		appointment.Description,
		appointment.Date,
		appointment.TimeVal,
		appointment.ClientID,
		appointment.PropertyID,
		appointment.BrokerID,
		appointment.Type,
		appointment.Status,
	).Scan(
		&appointment.ID,
		&appointment.ClientName,
		&appointment.ClientPhone,
		&appointment.PropertyAddress,
		&appointment.BrokerName,
		&appointment.BrokerCity,
		&appointment.CreatedAt,
		&appointment.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create appointment: %w", err)
	}

	return nil
}

// GetByBrokerID retrieves all appointments for a specific broker with optional filters
// Uses composite index (broker_id, date, time) for optimal query performance
func (r *AppointmentRepository) GetByBrokerID(brokerID string, filters dto.AppointmentFilters) ([]models.Appointment, error) {
	// Build dynamic query with filters
	query := `
		SELECT 
			id, title, description, date, time, client_id, property_id, broker_id,
			type, status, client_name, client_phone, property_address, broker_name, broker_city,
			created_at, updated_at
		FROM appointments
		WHERE broker_id = $1
	`

	args := []interface{}{brokerID}
	argCount := 1

	// Add optional filters
	if filters.Status != nil {
		argCount++
		query += fmt.Sprintf(" AND status = $%d", argCount)
		args = append(args, *filters.Status)
	}

	if filters.Date != nil {
		argCount++
		query += fmt.Sprintf(" AND date = $%d", argCount)
		args = append(args, *filters.Date)
	}

	if filters.Type != nil {
		argCount++
		query += fmt.Sprintf(" AND type = $%d", argCount)
		args = append(args, *filters.Type)
	}

	if filters.ClientID != nil {
		argCount++
		query += fmt.Sprintf(" AND client_id = $%d", argCount)
		args = append(args, *filters.ClientID)
	}

	if filters.StartDate != nil {
		argCount++
		query += fmt.Sprintf(" AND date >= $%d", argCount)
		args = append(args, *filters.StartDate)
	}

	if filters.EndDate != nil {
		argCount++
		query += fmt.Sprintf(" AND date <= $%d", argCount)
		args = append(args, *filters.EndDate)
	}

	// Order by date and time ascending
	query += " ORDER BY date ASC, time ASC"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query appointments by broker ID: %w", err)
	}
	defer rows.Close()

	var appointments []models.Appointment

	for rows.Next() {
		var appointment models.Appointment

		err := rows.Scan(
			&appointment.ID,
			&appointment.Title,
			&appointment.Description,
			&appointment.Date,
			&appointment.TimeVal,
			&appointment.ClientID,
			&appointment.PropertyID,
			&appointment.BrokerID,
			&appointment.Type,
			&appointment.Status,
			&appointment.ClientName,
			&appointment.ClientPhone,
			&appointment.PropertyAddress,
			&appointment.BrokerName,
			&appointment.BrokerCity,
			&appointment.CreatedAt,
			&appointment.UpdatedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan appointment row: %w", err)
		}

		appointments = append(appointments, appointment)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating appointment rows: %w", err)
	}

	// Return empty slice instead of nil if no appointments found
	if appointments == nil {
		appointments = []models.Appointment{}
	}

	return appointments, nil
}

// GetByID retrieves a single appointment by ID
// This method does NOT validate broker ownership - that should be done at the service layer
func (r *AppointmentRepository) GetByID(id string) (*models.Appointment, error) {
	query := `
		SELECT 
			id, title, description, date, time, client_id, property_id, broker_id,
			type, status, client_name, client_phone, property_address, broker_name, broker_city,
			created_at, updated_at
		FROM appointments
		WHERE id = $1
	`

	var appointment models.Appointment

	err := r.db.QueryRow(query, id).Scan(
		&appointment.ID,
		&appointment.Title,
		&appointment.Description,
		&appointment.Date,
		&appointment.TimeVal,
		&appointment.ClientID,
		&appointment.PropertyID,
		&appointment.BrokerID,
		&appointment.Type,
		&appointment.Status,
		&appointment.ClientName,
		&appointment.ClientPhone,
		&appointment.PropertyAddress,
		&appointment.BrokerName,
		&appointment.BrokerCity,
		&appointment.CreatedAt,
		&appointment.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("appointment not found")
		}
		return nil, fmt.Errorf("failed to get appointment by ID: %w", err)
	}

	return &appointment, nil
}

// Update modifies an existing appointment in the database
// The updated_at timestamp is automatically updated by database trigger
func (r *AppointmentRepository) Update(appointment *models.Appointment) error {
	query := `
		UPDATE appointments SET
			title = $1, description = $2, date = $3, time = $4,
			client_id = $5, property_id = $6, type = $7, status = $8
		WHERE id = $9
		RETURNING client_name, client_phone, property_address, broker_name, broker_city, created_at, updated_at
	`

	err := r.db.QueryRow(
		query,
		appointment.Title,
		appointment.Description,
		appointment.Date,
		appointment.TimeVal,
		appointment.ClientID,
		appointment.PropertyID,
		appointment.Type,
		appointment.Status,
		appointment.ID,
	).Scan(
		&appointment.ClientName,
		&appointment.ClientPhone,
		&appointment.PropertyAddress,
		&appointment.BrokerName,
		&appointment.BrokerCity,
		&appointment.CreatedAt,
		&appointment.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("appointment not found")
		}
		return fmt.Errorf("failed to update appointment: %w", err)
	}

	return nil
}

// Delete removes an appointment from the database
func (r *AppointmentRepository) Delete(id string) error {
	query := `DELETE FROM appointments WHERE id = $1`

	result, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete appointment: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("appointment not found")
	}

	return nil
}

// GetStats calculates appointment statistics for a broker
func (r *AppointmentRepository) GetStats(brokerID string) (*dto.AppointmentStats, error) {
	now := time.Now()
	firstDayOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	today := now.Format("2006-01-02")

	stats := &dto.AppointmentStats{
		AppointmentsByType: make(map[string]int),
	}

	// Query for total this month
	query := `
		SELECT COUNT(*) 
		FROM appointments 
		WHERE broker_id = $1 AND date >= $2
	`
	err := r.db.QueryRow(query, brokerID, firstDayOfMonth.Format("2006-01-02")).Scan(&stats.TotalThisMonth)
	if err != nil {
		return nil, fmt.Errorf("failed to get total this month: %w", err)
	}

	// Query for today's appointments
	query = `
		SELECT COUNT(*) 
		FROM appointments 
		WHERE broker_id = $1 AND date = $2
	`
	err = r.db.QueryRow(query, brokerID, today).Scan(&stats.TodayAppointments)
	if err != nil {
		return nil, fmt.Errorf("failed to get today appointments: %w", err)
	}

	// Query for scheduled appointments
	query = `
		SELECT COUNT(*) 
		FROM appointments 
		WHERE broker_id = $1 AND status = 'scheduled'
	`
	err = r.db.QueryRow(query, brokerID).Scan(&stats.ScheduledAppointments)
	if err != nil {
		return nil, fmt.Errorf("failed to get scheduled appointments: %w", err)
	}

	// Query for completed appointments
	query = `
		SELECT COUNT(*) 
		FROM appointments 
		WHERE broker_id = $1 AND status = 'completed'
	`
	err = r.db.QueryRow(query, brokerID).Scan(&stats.CompletedAppointments)
	if err != nil {
		return nil, fmt.Errorf("failed to get completed appointments: %w", err)
	}

	// Query for cancelled appointments
	query = `
		SELECT COUNT(*) 
		FROM appointments 
		WHERE broker_id = $1 AND status = 'cancelled'
	`
	err = r.db.QueryRow(query, brokerID).Scan(&stats.CancelledAppointments)
	if err != nil {
		return nil, fmt.Errorf("failed to get cancelled appointments: %w", err)
	}

	// Query for appointments by type
	query = `
		SELECT type, COUNT(*) 
		FROM appointments 
		WHERE broker_id = $1 
		GROUP BY type
	`
	rows, err := r.db.Query(query, brokerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get appointments by type: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var appointmentType string
		var count int
		err := rows.Scan(&appointmentType, &count)
		if err != nil {
			return nil, fmt.Errorf("failed to scan appointment type row: %w", err)
		}
		stats.AppointmentsByType[appointmentType] = count
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating appointment type rows: %w", err)
	}

	// Populate aliased fields for frontend compatibility
	stats.Total = stats.TotalThisMonth
	stats.Scheduled = stats.ScheduledAppointments
	stats.Completed = stats.CompletedAppointments
	stats.Cancelled = stats.CancelledAppointments
	stats.Today = stats.TodayAppointments
	stats.Upcoming = stats.ScheduledAppointments

	return stats, nil
}
