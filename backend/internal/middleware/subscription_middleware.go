package middleware

import (
	"net/http"

	"enfor-data-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type SubscriptionMiddleware struct {
	subscriptionService *service.SubscriptionService
}

func NewSubscriptionMiddleware(subscriptionService *service.SubscriptionService) *SubscriptionMiddleware {
	return &SubscriptionMiddleware{
		subscriptionService: subscriptionService,
	}
}

// RequireActiveSubscription ensures user has an active subscription
func (m *SubscriptionMiddleware) RequireActiveSubscription() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Unauthorized",
				"message": "User not authenticated",
			})
			c.Abort()
			return
		}

		// Get subscription status
		status, err := m.subscriptionService.GetSubscriptionStatus(userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Failed to check subscription",
				"message": err.Error(),
			})
			c.Abort()
			return
		}

		// Check if user has active subscription
		if !status.HasSubscription || !status.IsActive {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Subscription required",
				"message": "Please activate your free trial or subscribe to a plan",
				"action":  "activate_trial",
			})
			c.Abort()
			return
		}

		// Store subscription info in context
		c.Set("subscription_status", status)
		c.Next()
	}
}

// RequireFeatureAccess checks if user has access to a specific feature
func (m *SubscriptionMiddleware) RequireFeatureAccess(featureName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Unauthorized",
				"message": "User not authenticated",
			})
			c.Abort()
			return
		}

		// Check feature access
		hasAccess, err := m.subscriptionService.CheckFeatureAccess(userID, featureName)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Failed to check feature access",
				"message": err.Error(),
			})
			c.Abort()
			return
		}

		if !hasAccess {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Feature not available",
				"message": "This feature is not available in your current plan",
				"feature": featureName,
				"action":  "upgrade_plan",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// CheckFeatureLimit checks if user has exceeded feature limit
func (m *SubscriptionMiddleware) CheckFeatureLimit(featureName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Unauthorized",
				"message": "User not authenticated",
			})
			c.Abort()
			return
		}

		// Check feature limit
		limitCheck, err := m.subscriptionService.CheckFeatureLimit(userID, featureName)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Failed to check feature limit",
				"message": err.Error(),
			})
			c.Abort()
			return
		}

		// Check if limit exceeded
		if limitCheck.Limit != -1 && limitCheck.Remaining <= 0 {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Limit exceeded",
				"message": "You have reached your plan limit for this feature",
				"feature": featureName,
				"limit":   limitCheck.Limit,
				"used":    limitCheck.Used,
				"action":  "upgrade_plan",
			})
			c.Abort()
			return
		}

		// Store limit info in context
		c.Set("feature_limit", limitCheck)
		c.Next()
	}
}

// RequirePaidSubscription ensures user has a paid (non-trial) subscription
func (m *SubscriptionMiddleware) RequirePaidSubscription() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Unauthorized",
				"message": "User not authenticated",
			})
			c.Abort()
			return
		}

		// Get subscription status
		status, err := m.subscriptionService.GetSubscriptionStatus(userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Failed to check subscription",
				"message": err.Error(),
			})
			c.Abort()
			return
		}

		// Check if user has paid subscription
		if !status.IsPaid {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Paid subscription required",
				"message": "This feature requires a paid subscription",
				"action":  "subscribe",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// IncrementUsage increments feature usage after successful operation
func (m *SubscriptionMiddleware) IncrementUsage(featureName string, count int) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		if userID == "" {
			c.Next()
			return
		}

		// Increment usage after request completes successfully
		c.Next()

		// Only increment if request was successful (2xx status)
		if c.Writer.Status() >= 200 && c.Writer.Status() < 300 {
			_ = m.subscriptionService.IncrementFeatureUsage(userID, featureName, count)
		}
	}
}
