package repository

import (
	"database/sql"
	"fmt"

	"enfor-data-backend/internal/database"
	"enfor-data-backend/internal/models"
)

type UserRepository struct {
	db *database.DB
}

func NewUserRepository(db *database.DB) *UserRepository {
	return &UserRepository{db: db}
}

// CreateUser creates a new user in the database
func (r *UserRepository) CreateUser(user *models.User) error {
	query := `
		INSERT INTO users (
			first_name, last_name, email, password_hash, date_of_birth,
			firm_name, role, whatsapp_number, alternative_number, foreign_number,
			address, location, city, state, postal_code, profile_image
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
		RETURNING id, created_at, updated_at, is_verified, is_active
	`

	err := r.db.QueryRow(
		query,
		user.FirstName, user.LastName, user.Email, user.PasswordHash, user.DateOfBirth,
		user.FirmName, user.Role, user.WhatsappNumber, user.AlternativeNumber, user.ForeignNumber,
		user.Address, user.Location, user.City, user.State, user.PostalCode, user.ProfileImage,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt, &user.IsVerified, &user.IsActive)

	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	return nil
}

// GetUserByEmail retrieves a user by email
func (r *UserRepository) GetUserByEmail(email string) (*models.User, error) {
	user := &models.User{}
	query := `
		SELECT 
			id, first_name, last_name, email, password_hash, date_of_birth,
			firm_name, role, whatsapp_number, alternative_number, foreign_number,
			address, location, city, state, postal_code, profile_image,
			is_verified, is_active, created_at, updated_at
		FROM users 
		WHERE email = $1 AND is_active = true
	`

	err := r.db.QueryRow(query, email).Scan(
		&user.ID, &user.FirstName, &user.LastName, &user.Email, &user.PasswordHash, &user.DateOfBirth,
		&user.FirmName, &user.Role, &user.WhatsappNumber, &user.AlternativeNumber, &user.ForeignNumber,
		&user.Address, &user.Location, &user.City, &user.State, &user.PostalCode, &user.ProfileImage,
		&user.IsVerified, &user.IsActive, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}

	return user, nil
}

// GetUserByID retrieves a user by ID
func (r *UserRepository) GetUserByID(id string) (*models.User, error) {
	user := &models.User{}
	query := `
		SELECT 
			id, first_name, last_name, email, password_hash, date_of_birth,
			firm_name, role, whatsapp_number, alternative_number, foreign_number,
			address, location, city, state, postal_code, profile_image,
			is_verified, is_active, created_at, updated_at
		FROM users 
		WHERE id = $1 AND is_active = true
	`

	err := r.db.QueryRow(query, id).Scan(
		&user.ID, &user.FirstName, &user.LastName, &user.Email, &user.PasswordHash, &user.DateOfBirth,
		&user.FirmName, &user.Role, &user.WhatsappNumber, &user.AlternativeNumber, &user.ForeignNumber,
		&user.Address, &user.Location, &user.City, &user.State, &user.PostalCode, &user.ProfileImage,
		&user.IsVerified, &user.IsActive, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user by ID: %w", err)
	}

	return user, nil
}

// UpdateUserProfileImage updates the user's profile image
func (r *UserRepository) UpdateUserProfileImage(userID, imagePath string) error {
	query := `UPDATE users SET profile_image = $1, updated_at = NOW() WHERE id = $2`

	_, err := r.db.Exec(query, imagePath, userID)
	if err != nil {
		return fmt.Errorf("failed to update profile image: %w", err)
	}

	return nil
}

// EmailExists checks if an email already exists in the database
func (r *UserRepository) EmailExists(email string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`

	err := r.db.QueryRow(query, email).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check email existence: %w", err)
	}

	return exists, nil
}

// UpdateUser updates user information
func (r *UserRepository) UpdateUser(user *models.User) error {
	query := `
		UPDATE users SET 
			first_name = $1, last_name = $2, date_of_birth = $3,
			firm_name = $4, whatsapp_number = $5, alternative_number = $6, foreign_number = $7,
			address = $8, location = $9, city = $10, state = $11, postal_code = $12,
			updated_at = NOW()
		WHERE id = $13
	`

	_, err := r.db.Exec(
		query,
		user.FirstName, user.LastName, user.DateOfBirth,
		user.FirmName, user.WhatsappNumber, user.AlternativeNumber, user.ForeignNumber,
		user.Address, user.Location, user.City, user.State, user.PostalCode,
		user.ID,
	)

	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	return nil
}

// GetUserByMobile retrieves a user by mobile number (whatsapp_number)
func (r *UserRepository) GetUserByMobile(mobileNumber string) (*models.User, error) {
	user := &models.User{}
	query := `
		SELECT 
			id, first_name, last_name, email, password_hash, date_of_birth,
			firm_name, role, whatsapp_number, alternative_number, foreign_number,
			address, location, city, state, postal_code, profile_image,
			is_verified, is_active, created_at, updated_at
		FROM users 
		WHERE whatsapp_number = $1 AND is_active = true
	`

	err := r.db.QueryRow(query, mobileNumber).Scan(
		&user.ID, &user.FirstName, &user.LastName, &user.Email, &user.PasswordHash, &user.DateOfBirth,
		&user.FirmName, &user.Role, &user.WhatsappNumber, &user.AlternativeNumber, &user.ForeignNumber,
		&user.Address, &user.Location, &user.City, &user.State, &user.PostalCode, &user.ProfileImage,
		&user.IsVerified, &user.IsActive, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user by mobile: %w", err)
	}

	return user, nil
}

// UpdateMobileVerification updates the mobile verification status
func (r *UserRepository) UpdateMobileVerification(userID string, verified bool) error {
	query := `
		UPDATE users 
		SET mobile_verified = $1,
			mobile_verified_at = CASE WHEN $1 = true THEN NOW() ELSE NULL END,
			updated_at = NOW()
		WHERE id = $2
	`

	_, err := r.db.Exec(query, verified, userID)
	if err != nil {
		return fmt.Errorf("failed to update mobile verification: %w", err)
	}

	return nil
}

// MobileExists checks if a mobile number already exists in the database
func (r *UserRepository) MobileExists(mobileNumber string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE whatsapp_number = $1)`

	err := r.db.QueryRow(query, mobileNumber).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check mobile existence: %w", err)
	}

	return exists, nil
}
