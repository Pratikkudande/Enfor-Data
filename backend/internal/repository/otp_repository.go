package repository

import (
	"database/sql"
	"fmt"
	"time"

	"enfor-data-backend/internal/database"
	"enfor-data-backend/internal/models"
)

type OTPRepository struct {
	db *database.DB
}

func NewOTPRepository(db *database.DB) *OTPRepository {
	return &OTPRepository{db: db}
}

// CreateOTP creates a new OTP verification record
func (r *OTPRepository) CreateOTP(otp *models.OTPVerification) error {
	query := `
		INSERT INTO otp_verifications (
			user_id, mobile_number, otp_code, otp_hash, purpose,
			is_verified, attempts_count, max_attempts, expires_at,
			ip_address, user_agent
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, created_at, updated_at
	`

	err := r.db.QueryRow(
		query,
		otp.UserID,
		otp.MobileNumber,
		otp.OTPCode,
		otp.OTPHash,
		otp.Purpose,
		otp.IsVerified,
		otp.AttemptsCount,
		otp.MaxAttempts,
		otp.ExpiresAt,
		otp.IPAddress,
		otp.UserAgent,
	).Scan(&otp.ID, &otp.CreatedAt, &otp.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create OTP: %w", err)
	}

	return nil
}

// GetOTPByID retrieves an OTP by ID
func (r *OTPRepository) GetOTPByID(otpID string) (*models.OTPVerification, error) {
	query := `
		SELECT id, user_id, mobile_number, otp_code, otp_hash, purpose,
			   is_verified, attempts_count, max_attempts, expires_at, verified_at,
			   ip_address, user_agent, created_at, updated_at
		FROM otp_verifications
		WHERE id = $1
	`

	otp := &models.OTPVerification{}
	err := r.db.QueryRow(query, otpID).Scan(
		&otp.ID,
		&otp.UserID,
		&otp.MobileNumber,
		&otp.OTPCode,
		&otp.OTPHash,
		&otp.Purpose,
		&otp.IsVerified,
		&otp.AttemptsCount,
		&otp.MaxAttempts,
		&otp.ExpiresAt,
		&otp.VerifiedAt,
		&otp.IPAddress,
		&otp.UserAgent,
		&otp.CreatedAt,
		&otp.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("OTP not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get OTP: %w", err)
	}

	return otp, nil
}

// GetLatestOTPByMobile retrieves the latest OTP for a mobile number and purpose
func (r *OTPRepository) GetLatestOTPByMobile(mobileNumber, purpose string) (*models.OTPVerification, error) {
	query := `
		SELECT id, user_id, mobile_number, otp_code, otp_hash, purpose,
			   is_verified, attempts_count, max_attempts, expires_at, verified_at,
			   ip_address, user_agent, created_at, updated_at
		FROM otp_verifications
		WHERE mobile_number = $1 AND purpose = $2
		ORDER BY created_at DESC
		LIMIT 1
	`

	otp := &models.OTPVerification{}
	err := r.db.QueryRow(query, mobileNumber, purpose).Scan(
		&otp.ID,
		&otp.UserID,
		&otp.MobileNumber,
		&otp.OTPCode,
		&otp.OTPHash,
		&otp.Purpose,
		&otp.IsVerified,
		&otp.AttemptsCount,
		&otp.MaxAttempts,
		&otp.ExpiresAt,
		&otp.VerifiedAt,
		&otp.IPAddress,
		&otp.UserAgent,
		&otp.CreatedAt,
		&otp.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil // No OTP found is not an error
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get latest OTP: %w", err)
	}

	return otp, nil
}

// UpdateOTP updates an OTP record
func (r *OTPRepository) UpdateOTP(otp *models.OTPVerification) error {
	query := `
		UPDATE otp_verifications
		SET is_verified = $1,
			attempts_count = $2,
			verified_at = $3,
			updated_at = NOW()
		WHERE id = $4
	`

	_, err := r.db.Exec(query, otp.IsVerified, otp.AttemptsCount, otp.VerifiedAt, otp.ID)
	if err != nil {
		return fmt.Errorf("failed to update OTP: %w", err)
	}

	return nil
}

// IncrementAttempts increments the attempts count for an OTP
func (r *OTPRepository) IncrementAttempts(otpID string) error {
	query := `
		UPDATE otp_verifications
		SET attempts_count = attempts_count + 1,
			updated_at = NOW()
		WHERE id = $1
	`

	_, err := r.db.Exec(query, otpID)
	if err != nil {
		return fmt.Errorf("failed to increment attempts: %w", err)
	}

	return nil
}

// MarkAsVerified marks an OTP as verified
func (r *OTPRepository) MarkAsVerified(otpID string) error {
	now := time.Now()
	query := `
		UPDATE otp_verifications
		SET is_verified = true,
			verified_at = $1,
			updated_at = NOW()
		WHERE id = $2
	`

	_, err := r.db.Exec(query, now, otpID)
	if err != nil {
		return fmt.Errorf("failed to mark OTP as verified: %w", err)
	}

	return nil
}

// CountRecentOTPs counts OTPs sent to a mobile number in the last N minutes
func (r *OTPRepository) CountRecentOTPs(mobileNumber string, minutes int) (int, error) {
	query := `
		SELECT COUNT(*)
		FROM otp_verifications
		WHERE mobile_number = $1
		  AND created_at > NOW() - INTERVAL '1 minute' * $2
	`

	var count int
	err := r.db.QueryRow(query, mobileNumber, minutes).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count recent OTPs: %w", err)
	}

	return count, nil
}

// DeleteExpiredOTPs deletes expired OTP records (cleanup)
func (r *OTPRepository) DeleteExpiredOTPs() error {
	query := `
		DELETE FROM otp_verifications
		WHERE expires_at < NOW()
		  AND is_verified = false
	`

	_, err := r.db.Exec(query)
	if err != nil {
		return fmt.Errorf("failed to delete expired OTPs: %w", err)
	}

	return nil
}

// GetOTPsByMobile retrieves all OTPs for a mobile number (for admin/debugging)
func (r *OTPRepository) GetOTPsByMobile(mobileNumber string, limit int) ([]models.OTPVerification, error) {
	query := `
		SELECT id, user_id, mobile_number, otp_code, otp_hash, purpose,
			   is_verified, attempts_count, max_attempts, expires_at, verified_at,
			   ip_address, user_agent, created_at, updated_at
		FROM otp_verifications
		WHERE mobile_number = $1
		ORDER BY created_at DESC
		LIMIT $2
	`

	rows, err := r.db.Query(query, mobileNumber, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get OTPs: %w", err)
	}
	defer rows.Close()

	var otps []models.OTPVerification
	for rows.Next() {
		var otp models.OTPVerification
		err := rows.Scan(
			&otp.ID,
			&otp.UserID,
			&otp.MobileNumber,
			&otp.OTPCode,
			&otp.OTPHash,
			&otp.Purpose,
			&otp.IsVerified,
			&otp.AttemptsCount,
			&otp.MaxAttempts,
			&otp.ExpiresAt,
			&otp.VerifiedAt,
			&otp.IPAddress,
			&otp.UserAgent,
			&otp.CreatedAt,
			&otp.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan OTP: %w", err)
		}
		otps = append(otps, otp)
	}

	return otps, nil
}
