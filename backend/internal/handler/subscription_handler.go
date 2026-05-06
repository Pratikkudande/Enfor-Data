package handler

import (
	"net/http"

	"enfor-data-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type SubscriptionHandler struct {
	subscriptionService *service.SubscriptionService
}

func NewSubscriptionHandler(subscriptionService *service.SubscriptionService) *SubscriptionHandler {
	return &SubscriptionHandler{
		subscriptionService: subscriptionService,
	}
}

// ============================================================================
// Subscription Plans
// ============================================================================

// GetAllPlans retrieves all available subscription plans
// GET /api/subscriptions/plans
func (h *SubscriptionHandler) GetAllPlans(c *gin.Context) {
	plans, err := h.subscriptionService.GetAllPlans()
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to retrieve plans",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Plans retrieved successfully",
		Data:    plans,
	})
}

// GetPlanByID retrieves a specific plan by ID
// GET /api/subscriptions/plans/:id
func (h *SubscriptionHandler) GetPlanByID(c *gin.Context) {
	planID := c.Param("id")

	plan, err := h.subscriptionService.GetPlanByID(planID)
	if err != nil {
		if err.Error() == "plan not found" {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error:   "Plan not found",
				Message: "The requested plan does not exist",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to retrieve plan",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Plan retrieved successfully",
		Data:    plan,
	})
}

// GetPlanBySlug retrieves a specific plan by slug
// GET /api/subscriptions/plans/slug/:slug
func (h *SubscriptionHandler) GetPlanBySlug(c *gin.Context) {
	slug := c.Param("slug")

	plan, err := h.subscriptionService.GetPlanBySlug(slug)
	if err != nil {
		if err.Error() == "plan not found" {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error:   "Plan not found",
				Message: "The requested plan does not exist",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to retrieve plan",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Plan retrieved successfully",
		Data:    plan,
	})
}

// ComparePlans returns a comparison matrix of all plans
// GET /api/subscriptions/plans/compare
func (h *SubscriptionHandler) ComparePlans(c *gin.Context) {
	comparison, err := h.subscriptionService.ComparePlans()
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to compare plans",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Plan comparison retrieved successfully",
		Data:    comparison,
	})
}

// ============================================================================
// User Subscriptions
// ============================================================================

// GetCurrentSubscription retrieves the current user's subscription
// GET /api/subscriptions/current
func (h *SubscriptionHandler) GetCurrentSubscription(c *gin.Context) {
	userID := c.GetString("user_id")

	subscription, err := h.subscriptionService.GetUserSubscription(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to retrieve subscription",
			Message: err.Error(),
		})
		return
	}

	// No subscription found
	if subscription == nil {
		c.JSON(http.StatusOK, SuccessResponse{
			Message: "No active subscription",
			Data: gin.H{
				"has_subscription": false,
				"message":          "Activate your free trial to get started",
			},
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Subscription retrieved successfully",
		Data:    subscription,
	})
}

// GetSubscriptionStatus retrieves the subscription status
// GET /api/subscriptions/status
func (h *SubscriptionHandler) GetSubscriptionStatus(c *gin.Context) {
	userID := c.GetString("user_id")

	status, err := h.subscriptionService.GetSubscriptionStatus(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to retrieve subscription status",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Subscription status retrieved successfully",
		Data:    status,
	})
}

// ActivateTrial activates a free trial for the current user
// POST /api/subscriptions/activate-trial
func (h *SubscriptionHandler) ActivateTrial(c *gin.Context) {
	userID := c.GetString("user_id")

	subscription, err := h.subscriptionService.ActivateTrial(userID)
	if err != nil {
		// Handle specific error cases
		errorMsg := err.Error()

		switch errorMsg {
		case "mobile number must be verified before activating trial":
			c.JSON(http.StatusForbidden, ErrorResponse{
				Error:   "Mobile verification required",
				Message: "Please verify your mobile number before activating trial",
			})
			return
		case "user already has an active subscription":
			c.JSON(http.StatusConflict, ErrorResponse{
				Error:   "Already subscribed",
				Message: "You already have an active subscription",
			})
			return
		case "trial already used. Please subscribe to a paid plan":
			c.JSON(http.StatusConflict, ErrorResponse{
				Error:   "Trial already used",
				Message: "You have already used your free trial. Please subscribe to a paid plan",
			})
			return
		default:
			c.JSON(http.StatusInternalServerError, ErrorResponse{
				Error:   "Failed to activate trial",
				Message: errorMsg,
			})
			return
		}
	}

	c.JSON(http.StatusCreated, SuccessResponse{
		Message: "Free trial activated successfully",
		Data:    subscription,
	})
}

// CancelSubscription cancels the current user's subscription
// POST /api/subscriptions/cancel
func (h *SubscriptionHandler) CancelSubscription(c *gin.Context) {
	userID := c.GetString("user_id")

	err := h.subscriptionService.CancelSubscription(userID)
	if err != nil {
		if err.Error() == "no active subscription found" {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error:   "No subscription found",
				Message: "You don't have an active subscription to cancel",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to cancel subscription",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Subscription canceled successfully",
		Data: gin.H{
			"canceled": true,
			"message":  "Your subscription has been canceled. You can continue using the service until the end of your billing period",
		},
	})
}

// ============================================================================
// Feature Access
// ============================================================================

// CheckFeatureAccess checks if user has access to a specific feature
// GET /api/subscriptions/features/:feature/access
func (h *SubscriptionHandler) CheckFeatureAccess(c *gin.Context) {
	userID := c.GetString("user_id")
	featureName := c.Param("feature")

	hasAccess, err := h.subscriptionService.CheckFeatureAccess(userID, featureName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to check feature access",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Feature access checked successfully",
		Data: gin.H{
			"feature":    featureName,
			"has_access": hasAccess,
		},
	})
}

// CheckFeatureLimit checks the usage limit for a specific feature
// GET /api/subscriptions/features/:feature/limit
func (h *SubscriptionHandler) CheckFeatureLimit(c *gin.Context) {
	userID := c.GetString("user_id")
	featureName := c.Param("feature")

	limitCheck, err := h.subscriptionService.CheckFeatureLimit(userID, featureName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to check feature limit",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Feature limit checked successfully",
		Data:    limitCheck,
	})
}

// GetFeatureUsage retrieves all feature usage for the current user
// GET /api/subscriptions/usage
func (h *SubscriptionHandler) GetFeatureUsage(c *gin.Context) {
	userID := c.GetString("user_id")

	subscription, err := h.subscriptionService.GetUserSubscription(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to retrieve feature usage",
			Message: err.Error(),
		})
		return
	}

	if subscription == nil {
		c.JSON(http.StatusOK, SuccessResponse{
			Message: "No active subscription",
			Data: gin.H{
				"usage": map[string]int{},
			},
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Feature usage retrieved successfully",
		Data: gin.H{
			"usage":     subscription.Usage,
			"plan_name": subscription.Plan.Name,
		},
	})
}
