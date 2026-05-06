package repository

import (
	"database/sql"
	"fmt"

	"enfor-data-backend/internal/database"
	"enfor-data-backend/internal/models"
)

type PaymentRepository struct {
	db *database.DB
}

func NewPaymentRepository(db *database.DB) *PaymentRepository {
	return &PaymentRepository{
		db: db,
	}
}

// CreatePayment creates a new payment record
func (r *PaymentRepository) CreatePayment(payment *models.Payment) error {
	query := `
		INSERT INTO payments (
			user_id, plan_id, amount, currency, status, billing_cycle
		) VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at
	`

	err := r.db.QueryRow(
		query,
		payment.UserID,
		payment.PlanID,
		payment.Amount,
		payment.Currency,
		payment.Status,
		payment.BillingCycle,
	).Scan(&payment.ID, &payment.CreatedAt, &payment.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create payment: %w", err)
	}

	return nil
}

// UpdatePayment updates a payment record
func (r *PaymentRepository) UpdatePayment(payment *models.Payment) error {
	query := `
		UPDATE payments
		SET razorpay_payment_id = $1,
		    razorpay_order_id = $2,
		    razorpay_signature = $3,
		    status = $4,
		    paid_at = $5,
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = $6
	`

	result, err := r.db.Exec(
		query,
		payment.RazorpayPaymentID,
		payment.RazorpayOrderID,
		payment.RazorpaySignature,
		payment.Status,
		payment.PaidAt,
		payment.ID,
	)

	if err != nil {
		return fmt.Errorf("failed to update payment: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rows == 0 {
		return fmt.Errorf("payment not found")
	}

	return nil
}

// GetPaymentByID retrieves a payment by ID
func (r *PaymentRepository) GetPaymentByID(paymentID string) (*models.Payment, error) {
	query := `
		SELECT id, user_id, plan_id, amount, currency, status, billing_cycle,
		       razorpay_payment_id, razorpay_order_id, razorpay_signature,
		       paid_at, created_at, updated_at
		FROM payments
		WHERE id = $1
	`

	var payment models.Payment
	err := r.db.QueryRow(query, paymentID).Scan(
		&payment.ID,
		&payment.UserID,
		&payment.PlanID,
		&payment.Amount,
		&payment.Currency,
		&payment.Status,
		&payment.BillingCycle,
		&payment.RazorpayPaymentID,
		&payment.RazorpayOrderID,
		&payment.RazorpaySignature,
		&payment.PaidAt,
		&payment.CreatedAt,
		&payment.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("payment not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get payment: %w", err)
	}

	return &payment, nil
}

// GetPaymentByOrderID retrieves a payment by Razorpay order ID
func (r *PaymentRepository) GetPaymentByOrderID(orderID string) (*models.Payment, error) {
	query := `
		SELECT id, user_id, plan_id, amount, currency, status, billing_cycle,
		       razorpay_payment_id, razorpay_order_id, razorpay_signature,
		       paid_at, created_at, updated_at
		FROM payments
		WHERE razorpay_order_id = $1
	`

	var payment models.Payment
	err := r.db.QueryRow(query, orderID).Scan(
		&payment.ID,
		&payment.UserID,
		&payment.PlanID,
		&payment.Amount,
		&payment.Currency,
		&payment.Status,
		&payment.BillingCycle,
		&payment.RazorpayPaymentID,
		&payment.RazorpayOrderID,
		&payment.RazorpaySignature,
		&payment.PaidAt,
		&payment.CreatedAt,
		&payment.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get payment by order ID: %w", err)
	}

	return &payment, nil
}

// GetUserPayments retrieves all payments for a user
func (r *PaymentRepository) GetUserPayments(userID string) ([]models.Payment, error) {
	query := `
		SELECT p.id, p.user_id, p.plan_id, p.amount, p.currency, p.status, p.billing_cycle,
		       p.razorpay_payment_id, p.razorpay_order_id, p.razorpay_signature,
		       p.paid_at, p.created_at, p.updated_at,
		       sp.display_name as plan_name
		FROM payments p
		INNER JOIN subscription_plans sp ON p.plan_id = sp.id
		WHERE p.user_id = $1
		ORDER BY p.created_at DESC
	`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query payments: %w", err)
	}
	defer rows.Close()

	var payments []models.Payment
	for rows.Next() {
		var payment models.Payment
		var planName string

		err := rows.Scan(
			&payment.ID,
			&payment.UserID,
			&payment.PlanID,
			&payment.Amount,
			&payment.Currency,
			&payment.Status,
			&payment.BillingCycle,
			&payment.RazorpayPaymentID,
			&payment.RazorpayOrderID,
			&payment.RazorpaySignature,
			&payment.PaidAt,
			&payment.CreatedAt,
			&payment.UpdatedAt,
			&planName,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan payment: %w", err)
		}

		payments = append(payments, payment)
	}

	return payments, nil
}
