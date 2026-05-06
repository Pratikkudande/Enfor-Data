package handler

import (
	"log"
	"net/http"

	"enfor-data-backend/internal/models"
	"enfor-data-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type PaymentHandler struct {
	paymentService      *service.PaymentService
	subscriptionService *service.SubscriptionService
}

func NewPaymentHandler(
	paymentService *service.PaymentService,
	subscriptionService *service.SubscriptionService,
) *PaymentHandler {
	return &PaymentHandler{
		paymentService:      paymentService,
		subscriptionService: subscriptionService,
	}
}

// CreateSubscriptionOrder creates a Razorpay order for subscription
// POST /api/payments/create-order
func (h *PaymentHandler) CreateSubscriptionOrder(c *gin.Context) {
	userID := c.GetString("user_id")
	
	// Log the user ID for debugging
	log.Printf("Creating payment order for user: %s", userID)

	var req struct {
		PlanID       string `json:"plan_id" binding:"required"`
		BillingCycle string `json:"billing_cycle" binding:"required,oneof=monthly annual"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Invalid request data: %v", err)
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	log.Printf("Payment request - Plan ID: %s, Billing Cycle: %s", req.PlanID, req.BillingCycle)

	// Create order
	order, err := h.paymentService.CreateSubscriptionOrder(userID, req.PlanID, req.BillingCycle)
	if err != nil {
		log.Printf("Failed to create payment order: %v", err)
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to create order",
			Message: err.Error(),
		})
		return
	}

	log.Printf("Payment order created successfully: %+v", order)
	c.JSON(http.StatusCreated, SuccessResponse{
		Message: "Order created successfully",
		Data:    order,
	})
}

// VerifyPayment verifies Razorpay payment signature
// POST /api/payments/verify
func (h *PaymentHandler) VerifyPayment(c *gin.Context) {
	userID := c.GetString("user_id")

	var req models.PaymentVerificationRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	// Verify payment
	subscription, err := h.paymentService.VerifyAndActivateSubscription(userID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Payment verification failed",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Payment verified and subscription activated",
		Data:    subscription,
	})
}

// GetPaymentHistory retrieves user's payment history
// GET /api/payments/history
func (h *PaymentHandler) GetPaymentHistory(c *gin.Context) {
	userID := c.GetString("user_id")

	payments, err := h.paymentService.GetUserPayments(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to retrieve payment history",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Payment history retrieved successfully",
		Data:    payments,
	})
}

// RazorpayWebhook handles Razorpay webhook events
// POST /api/payments/webhook
func (h *PaymentHandler) RazorpayWebhook(c *gin.Context) {
	var event map[string]interface{}

	if err := c.ShouldBindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid webhook payload",
			Message: err.Error(),
		})
		return
	}

	// Verify webhook signature
	signature := c.GetHeader("X-Razorpay-Signature")
	if err := h.paymentService.VerifyWebhookSignature(c.Request.Body, signature); err != nil {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "Invalid webhook signature",
			Message: err.Error(),
		})
		return
	}

	// Process webhook event
	if err := h.paymentService.ProcessWebhookEvent(event); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to process webhook",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
	})
}
