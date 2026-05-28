package repository

import (
	"database/sql"
	"fmt"

	"enfor-data-backend/internal/database"
	"enfor-data-backend/internal/models"
)

// StaffRepository handles DB operations for staff listings.
type StaffRepository struct {
	db *database.DB
}

func NewStaffRepository(db *database.DB) *StaffRepository {
	return &StaffRepository{db: db}
}

// Create inserts a new staff listing.
func (r *StaffRepository) Create(s *models.StaffMember) error {
	query := `
		INSERT INTO staff_listings (
			user_id, type, first_name, last_name, phone, email,
			role, experience_years, status, location, address, description,
			resume_url, photo_url
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
		RETURNING id, poster_name, created_at, updated_at`

	return r.db.QueryRow(query,
		s.UserID, s.Type, s.FirstName, s.LastName, s.Phone, s.Email,
		s.Role, s.ExperienceYears, s.Status, s.Location, s.Address, s.Description,
		s.ResumeURL, s.PhotoURL,
	).Scan(&s.ID, &s.PosterName, &s.CreatedAt, &s.UpdatedAt)
}

// GetAll returns all staff listings, optionally filtered.
func (r *StaffRepository) GetAll(staffType, location string) ([]models.StaffMember, error) {
	query := `
		SELECT id, user_id, type, first_name, last_name, phone, email,
		       role, experience_years, status, location, address, description,
		       resume_url, photo_url, poster_name, created_at, updated_at
		FROM staff_listings
		WHERE 1=1`

	args := []interface{}{}
	argIdx := 1

	if staffType != "" {
		query += fmt.Sprintf(" AND type = $%d", argIdx)
		args = append(args, staffType)
		argIdx++
	}
	if location != "" {
		query += fmt.Sprintf(" AND location ILIKE $%d", argIdx)
		args = append(args, "%"+location+"%")
	}

	query += " ORDER BY created_at DESC"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanStaff(rows)
}

// GetByUser returns all staff listings created by a specific user.
func (r *StaffRepository) GetByUser(userID string) ([]models.StaffMember, error) {
	rows, err := r.db.Query(`
		SELECT id, user_id, type, first_name, last_name, phone, email,
		       role, experience_years, status, location, address, description,
		       resume_url, photo_url, poster_name, created_at, updated_at
		FROM staff_listings WHERE user_id = $1 ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanStaff(rows)
}

// GetByID returns a single staff listing.
func (r *StaffRepository) GetByID(id string) (*models.StaffMember, error) {
	s := &models.StaffMember{}
	err := r.db.QueryRow(`
		SELECT id, user_id, type, first_name, last_name, phone, email,
		       role, experience_years, status, location, address, description,
		       resume_url, photo_url, poster_name, created_at, updated_at
		FROM staff_listings WHERE id = $1`, id).Scan(
		&s.ID, &s.UserID, &s.Type, &s.FirstName, &s.LastName, &s.Phone, &s.Email,
		&s.Role, &s.ExperienceYears, &s.Status, &s.Location, &s.Address, &s.Description,
		&s.ResumeURL, &s.PhotoURL, &s.PosterName, &s.CreatedAt, &s.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("staff listing not found")
	}
	return s, err
}

// Update applies partial updates.
func (r *StaffRepository) Update(id string, req map[string]interface{}) (*models.StaffMember, error) {
	_, err := r.db.Exec(`
		UPDATE staff_listings SET
			first_name       = COALESCE($2, first_name),
			last_name        = COALESCE($3, last_name),
			phone            = COALESCE($4, phone),
			email            = COALESCE($5, email),
			role             = COALESCE($6, role),
			experience_years = COALESCE($7, experience_years),
			status           = COALESCE($8, status),
			location         = COALESCE($9, location),
			address          = COALESCE($10, address),
			description      = COALESCE($11, description),
			resume_url       = COALESCE($12, resume_url),
			photo_url        = COALESCE($13, photo_url),
			updated_at       = NOW()
		WHERE id = $1`,
		id,
		req["first_name"], req["last_name"], req["phone"], req["email"],
		req["role"], req["experience_years"], req["status"],
		req["location"], req["address"], req["description"],
		req["resume_url"], req["photo_url"],
	)
	if err != nil {
		return nil, err
	}
	return r.GetByID(id)
}

// Delete removes a staff listing.
func (r *StaffRepository) Delete(id string) error {
	_, err := r.db.Exec(`DELETE FROM staff_listings WHERE id = $1`, id)
	return err
}

func scanStaff(rows *sql.Rows) ([]models.StaffMember, error) {
	var list []models.StaffMember
	for rows.Next() {
		var s models.StaffMember
		if err := rows.Scan(
			&s.ID, &s.UserID, &s.Type, &s.FirstName, &s.LastName, &s.Phone, &s.Email,
			&s.Role, &s.ExperienceYears, &s.Status, &s.Location, &s.Address, &s.Description,
			&s.ResumeURL, &s.PhotoURL, &s.PosterName, &s.CreatedAt, &s.UpdatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	if list == nil {
		list = []models.StaffMember{}
	}
	return list, rows.Err()
}
