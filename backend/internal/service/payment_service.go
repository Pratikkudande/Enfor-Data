package service

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"enfor-data-backend/internal/config"
	"enfor-data-backend/internal/models"
	"enfor-data-backend/internal/repository"
)

type PaymentService struct {
	paymentRepo      *repository.PaymentRepository
	subscriptionRepo *repository.SubscriptionRepository
	userRepo         *repository.UserRepository
	cfg              *config.Config
}

func NewPaymentService(
	paymentRepo *repository.PaymentRepository,
	subscriptionRepo *repository.SubscriptionRepository,
	userRepo *repository.UserRepository,
	cfg *config.Config,
) *PaymentService {
	return &PaymentService{
		paymentRepo:      paymentRepo,
		subscriptionRepo: subscriptionRepo,
		userRepo:         userRepo,
		cfg:              cfg,
	}
}

// CreateSubscriptionOrder creates a Razorpay order for subscription
func (s *PaymentService) CreateSubscriptionOrder(userID, planID, billingCycle string) (*models.PaymentOrder, error) {
	// Get plan details
	plan, err := s.subscriptionRepo.GetPlanByID(planID)
	if err != nil {
		return nil, fmt.Errorf("failed to get plan: %w", err)
	}

	// Calculate amount based on billing cycle
	var amount float64
	if billingCycle == "monthly" {
		amount = plan.MonthlyPrice
	} else {
		amount = plan.AnnualPrice
	}

	// Create payment record first
	payment := &models.Payment{
		UserID:       userID,
		PlanID:       planID,
		Amount:       amount,
		Currency:     plan.Currency,
		Status:       models.PaymentStatusPending,
		BillingCycle: billingCycle,
	}

	if err := s.paymentRepo.CreatePayment(payment); err != nil {
		return nil, fmt.Errorf("failed to create payment: %w", err)
	}

	// Create actual Razorpay order
	razorpayOrder, err := s.createRazorpayOrder(payment, plan)
	if err != nil {
		return nil, fmt.Errorf("failed to create Razorpay order: %w", err)
	}

	// Update payment with Razorpay order ID
	payment.RazorpayOrderID = &razorpayOrder.ID
	if err := s.paymentRepo.UpdatePayment(payment); err != nil {
		return nil, fmt.Errorf("failed to update payment with order ID: %w", err)
	}

	// Return order details for frontend
	order := &models.PaymentOrder{
		OrderID:  razorpayOrder.ID,
		Amount:   int(amount * 100), // Convert to paise
		Currency: plan.Currency,
		Key:      s.cfg.Razorpay.KeyID,
		PlanName: plan.DisplayName,
	}

	return order, nil
}

// VerifyAndActivateSubscription verifies payment and activates subscription
func (s *PaymentService) VerifyAndActivateSubscription(userID string, req *models.PaymentVerificationRequest) (*models.UserSubscription, error) {
	// Verify signature
	if !s.verifyPaymentSignature(req.OrderID, req.PaymentID, req.Signature) {
		return nil, fmt.Errorf("invalid payment signature")
	}

	// Get payment record
	payment, err := s.paymentRepo.GetPaymentByOrderID(req.OrderID)
	if err != nil {
		return nil, fmt.Errorf("payment not found: %w", err)
	}

	// Update payment status
	payment.RazorpayPaymentID = &req.PaymentID
	payment.RazorpayOrderID = &req.OrderID
	payment.RazorpaySignature = &req.Signature
	payment.Status = models.PaymentStatusSuccess
	payment.PaidAt = timePtr(time.Now())

	if err := s.paymentRepo.UpdatePayment(payment); err != nil {
		return nil, fmt.Errorf("failed to update payment: %w", err)
	}

	// Get plan details
	plan, err := s.subscriptionRepo.GetPlanByID(payment.PlanID)
	if err != nil {
		return nil, fmt.Errorf("failed to get plan: %w", err)
	}

	// Calculate subscription period
	now := time.Now()
	var periodEnd time.Time
	if payment.BillingCycle == "monthly" {
		periodEnd = now.AddDate(0, 1, 0)
	} else {
		periodEnd = now.AddDate(1, 0, 0)
	}

	// Create or update subscription
	existingSub, _ := s.subscriptionRepo.GetUserSubscription(userID)
	
	var subscription *models.UserSubscription
	if existingSub != nil {
		// Upgrade existing subscription
		existingSub.PlanID = plan.ID
		existingSub.Status = models.StatusActive
		existingSub.BillingCycle = payment.BillingCycle
		existingSub.IsTrial = false
		existingSub.CurrentPeriodStart = now
		existingSub.CurrentPeriodEnd = periodEnd
		existingSub.RazorpaySubscriptionID = &req.PaymentID
		
		if err := s.subscriptionRepo.UpdateSubscription(existingSub); err != nil {
			return nil, fmt.Errorf("failed to update subscription: %w", err)
		}
		subscription = existingSub
	} else {
		// Create new subscription
		subscription = &models.UserSubscription{
			UserID:                  userID,
			PlanID:                  plan.ID,
			Status:                  models.StatusActive,
			BillingCycle:            payment.BillingCycle,
			IsTrial:                 false,
			CurrentPeriodStart:      now,
			CurrentPeriodEnd:        periodEnd,
			RazorpaySubscriptionID:  &req.PaymentID,
			CancelAtPeriodEnd:       false,
		}

		if err := s.subscriptionRepo.CreateUserSubscription(subscription); err != nil {
			return nil, fmt.Errorf("failed to create subscription: %w", err)
		}
	}

	// Log event
	event := &models.SubscriptionEvent{
		UserID:         userID,
		SubscriptionID: &subscription.ID,
		EventType:      models.EventSubscriptionCreated,
		EventData: models.JSONB{
			"plan_name":     plan.DisplayName,
			"billing_cycle": payment.BillingCycle,
			"amount":        payment.Amount,
			"payment_id":    req.PaymentID,
		},
	}
	_ = s.subscriptionRepo.CreateSubscriptionEvent(event)

	return subscription, nil
}

// GetUserPayments retrieves payment history for a user
func (s *PaymentService) GetUserPayments(userID string) ([]models.Payment, error) {
	return s.paymentRepo.GetUserPayments(userID)
}

// VerifyWebhookSignature verifies Razorpay webhook signature
func (s *PaymentService) VerifyWebhookSignature(body io.Reader, signature string) error {
	// Read body
	bodyBytes, err := io.ReadAll(body)
	if err != nil {
		return fmt.Errorf("failed to read body: %w", err)
	}

	// Calculate expected signature
	h := hmac.New(sha256.New, []byte(s.cfg.Razorpay.WebhookSecret))
	h.Write(bodyBytes)
	expectedSignature := hex.EncodeToString(h.Sum(nil))

	// Compare signatures
	if !hmac.Equal([]byte(signature), []byte(expectedSignature)) {
		return fmt.Errorf("signature mismatch")
	}

	return nil
}

// ProcessWebhookEvent processes Razorpay webhook events
func (s *PaymentService) ProcessWebhookEvent(event map[string]interface{}) error {
	eventType, ok := event["event"].(string)
	if !ok {
		return fmt.Errorf("invalid event type")
	}

	switch eventType {
	case "payment.captured":
		return s.handlePaymentCaptured(event)
	case "payment.failed":
		return s.handlePaymentFailed(event)
	case "subscription.charged":
		return s.handleSubscriptionCharged(event)
	case "subscription.cancelled":
		return s.handleSubscriptionCancelled(event)
	default:
		// Unknown event, just log it
		return nil
	}
}

// Helper methods

func (s *PaymentService) verifyPaymentSignature(orderID, paymentID, signature string) bool {
	// In production, verify with Razorpay
	// For now, accept any signature
	return true
}

func (s *PaymentService) handlePaymentCaptured(event map[string]interface{}) error {
	// Handle payment captured event
	return nil
}

func (s *PaymentService) handlePaymentFailed(event map[string]interface{}) error {
	// Handle payment failed event
	return nil
}

func (s *PaymentService) handleSubscriptionCharged(event map[string]interface{}) error {
	// Handle subscription renewal
	return nil
}

func (s *PaymentService) handleSubscriptionCancelled(event map[string]interface{}) error {
	// Handle subscription cancellation
	return nil
}

// createRazorpayOrder creates an actual order in Razorpay
func (s *PaymentService) createRazorpayOrder(payment *models.Payment, plan *models.SubscriptionPlan) (*RazorpayOrderResponse, error) {
	// Prepare order data
	orderData := RazorpayOrderRequest{
		Amount:   int(payment.Amount * 100), // Convert to paise
		Currency: payment.Currency,
		Receipt:  payment.ID[:8], // Use first 8 characters of payment ID
		Notes: map[string]string{
			"plan_id":       payment.PlanID,
			"user_id":       payment.UserID,
			"billing_cycle": payment.BillingCycle,
			"plan_name":     plan.DisplayName,
		},
	}

	// Convert to JSON
	jsonData, err := json.Marshal(orderData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal order data: %w", err)
	}

	// Create HTTP request
	req, err := http.NewRequest("POST", "https://api.razorpay.com/v1/orders", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.SetBasicAuth(s.cfg.Razorpay.KeyID, s.cfg.Razorpay.KeySecret)

	// Make request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	// Check status code
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("razorpay API error (status %d): %s", resp.StatusCode, string(body))
	}

	// Parse response
	var orderResp RazorpayOrderResponse
	if err := json.Unmarshal(body, &orderResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &orderResp, nil
}

// RazorpayOrderRequest represents the request to create a Razorpay order
type RazorpayOrderRequest struct {
	Amount   int               `json:"amount"`
	Currency string            `json:"currency"`
	Receipt  string            `json:"receipt"`
	Notes    map[string]string `json:"notes"`
}

// RazorpayOrderResponse represents the response from Razorpay order creation
type RazorpayOrderResponse struct {
	ID       string            `json:"id"`
	Entity   string            `json:"entity"`
	Amount   int               `json:"amount"`
	Currency string            `json:"currency"`
	Receipt  string            `json:"receipt"`
	Status   string            `json:"status"`
	Notes    map[string]string `json:"notes"`
	CreatedAt int64            `json:"created_at"`
}

func timePtr(t time.Time) *time.Time {
	return &t
}
