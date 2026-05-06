package models

import (
	"time"
)

// Payment represents a payment transaction
type Payment struct {
	ID             string  `json:"id" db:"id"`
	UserID         string  `json:"user_id" db:"user_id"`
	SubscriptionID *string `json:"subscription_id" db:"subscription_id"`
	PlanID         string  `json:"plan_id" db:"plan_id"`
	
	// Payment Details
	Amount        float64 `json:"amount" db:"amount"`
	Currency      string  `json:"currency" db:"currency"`
	Status        string  `json:"status" db:"status"` // pending, success, failed, refunded
	BillingCycle  string  `json:"billing_cycle" db:"billing_cycle"` // monthly, annual
	PaymentMethod *string `json:"payment_method" db:"payment_method"` // card, upi, netbanking, wallet
	
	// Razorpay Integration
	RazorpayPaymentID *string `json:"razorpay_payment_id" db:"razorpay_payment_id"`
	RazorpayOrderID   *string `json:"razorpay_order_id" db:"razorpay_order_id"`
	RazorpaySignature *string `json:"razorpay_signature" db:"razorpay_signature"`
	
	// Payment Metadata
	Description   *string `json:"description" db:"description"`
	InvoiceNumber *string `json:"invoice_number" db:"invoice_number"`
	ReceiptURL    *string `json:"receipt_url" db:"receipt_url"`
	
	// Failure Information
	FailureReason *string `json:"failure_reason" db:"failure_reason"`
	FailureCode   *string `json:"failure_code" db:"failure_code"`
	
	// Timestamps
	PaidAt     *time.Time `json:"paid_at" db:"paid_at"`
	FailedAt   *time.Time `json:"failed_at" db:"failed_at"`
	RefundedAt *time.Time `json:"refunded_at" db:"refunded_at"`
	CreatedAt  time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at" db:"updated_at"`
}

// IsSuccessful checks if payment was successful
func (p *Payment) IsSuccessful() bool {
	return p.Status == PaymentStatusSuccess
}

// IsPending checks if payment is pending
func (p *Payment) IsPending() bool {
	return p.Status == PaymentStatusPending
}

// IsFailed checks if payment failed
func (p *Payment) IsFailed() bool {
	return p.Status == PaymentStatusFailed
}

// IsRefunded checks if payment was refunded
func (p *Payment) IsRefunded() bool {
	return p.Status == PaymentStatusRefunded
}

// Payment status constants
const (
	PaymentStatusPending  = "pending"
	PaymentStatusSuccess  = "success"
	PaymentStatusFailed   = "failed"
	PaymentStatusRefunded = "refunded"
)

// Payment method constants
const (
	PaymentMethodCard       = "card"
	PaymentMethodUPI        = "upi"
	PaymentMethodNetbanking = "netbanking"
	PaymentMethodWallet     = "wallet"
)

// RazorpayOrder represents a Razorpay order for checkout
type RazorpayOrder struct {
	OrderID   string  `json:"order_id"`
	Amount    float64 `json:"amount"`
	Currency  string  `json:"currency"`
	KeyID     string  `json:"key_id"`
	Name      string  `json:"name"`
	Description string `json:"description"`
	PrefillContact string `json:"prefill_contact"`
	PrefillEmail   string `json:"prefill_email"`
}

// RazorpayWebhookPayload represents webhook data from Razorpay
type RazorpayWebhookPayload struct {
	Event   string                 `json:"event"`
	Payload map[string]interface{} `json:"payload"`
}

// PaymentVerificationRequest represents payment verification request
type PaymentVerificationRequest struct {
	OrderID   string `json:"order_id" binding:"required"`
	PaymentID string `json:"payment_id" binding:"required"`
	Signature string `json:"signature" binding:"required"`
}

// PaymentOrder represents a Razorpay order
type PaymentOrder struct {
	OrderID  string `json:"order_id"`
	Amount   int    `json:"amount"` // in paise
	Currency string `json:"currency"`
	Key      string `json:"key"` // Razorpay key
	PlanName string `json:"plan_name"`
}
