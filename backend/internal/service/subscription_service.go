package service

import (
	"fmt"
	"time"

	"enfor-data-backend/internal/models"
	"enfor-data-backend/internal/repository"
)

type SubscriptionService struct {
	subscriptionRepo *repository.SubscriptionRepository
	userRepo         *repository.UserRepository
}

func NewSubscriptionService(
	subscriptionRepo *repository.SubscriptionRepository,
	userRepo *repository.UserRepository,
) *SubscriptionService {
	return &SubscriptionService{
		subscriptionRepo: subscriptionRepo,
		userRepo:         userRepo,
	}
}

// ============================================================================
// Subscription Plans
// ============================================================================

// GetAllPlans retrieves all active subscription plans
func (s *SubscriptionService) GetAllPlans() ([]models.SubscriptionPlan, error) {
	plans, err := s.subscriptionRepo.GetAllPlans()
	if err != nil {
		return nil, fmt.Errorf("failed to get plans: %w", err)
	}

	return plans, nil
}

// GetPlanByID retrieves a specific plan by ID
func (s *SubscriptionService) GetPlanByID(planID string) (*models.SubscriptionPlan, error) {
	plan, err := s.subscriptionRepo.GetPlanByID(planID)
	if err != nil {
		return nil, fmt.Errorf("failed to get plan: %w", err)
	}

	return plan, nil
}

// GetPlanBySlug retrieves a specific plan by slug
func (s *SubscriptionService) GetPlanBySlug(slug string) (*models.SubscriptionPlan, error) {
	plan, err := s.subscriptionRepo.GetPlanBySlug(slug)
	if err != nil {
		return nil, fmt.Errorf("failed to get plan: %w", err)
	}

	return plan, nil
}

// ComparePlans returns a comparison matrix of all plans
func (s *SubscriptionService) ComparePlans() (*models.PlanComparison, error) {
	plans, err := s.subscriptionRepo.GetAllPlans()
	if err != nil {
		return nil, fmt.Errorf("failed to get plans: %w", err)
	}

	comparison := &models.PlanComparison{
		Plans:    plans,
		Features: s.buildFeatureMatrix(plans),
	}

	return comparison, nil
}

// buildFeatureMatrix builds a feature comparison matrix
func (s *SubscriptionService) buildFeatureMatrix(plans []models.SubscriptionPlan) []models.FeatureComparison {
	features := []models.FeatureComparison{
		{
			Category: "Core Features",
			Items: []models.FeatureItem{
				{Name: "Properties", Key: "max_properties"},
				{Name: "Clients", Key: "max_clients"},
				{Name: "Appointments/Month", Key: "max_appointments"},
			},
		},
		{
			Category: "Communication",
			Items: []models.FeatureItem{
				{Name: "SMS Messages/Month", Key: "sms_limit"},
				{Name: "WhatsApp Messages/Month", Key: "whatsapp_limit"},
			},
		},
		{
			Category: "Network & Collaboration",
			Items: []models.FeatureItem{
				{Name: "Broker Connections", Key: "max_connections"},
				{Name: "Business Posts/Month", Key: "max_posts"},
			},
		},
		{
			Category: "Analytics & Reports",
			Items: []models.FeatureItem{
				{Name: "Basic Analytics", Key: "basic_analytics"},
				{Name: "Advanced Analytics", Key: "advanced_analytics"},
			},
		},
		{
			Category: "Support",
			Items: []models.FeatureItem{
				{Name: "Priority Support", Key: "priority_support"},
				{Name: "API Access", Key: "api_access"},
			},
		},
	}

	// Populate values for each plan
	for i := range features {
		for j := range features[i].Items {
			features[i].Items[j].Values = make(map[string]interface{})
			for _, plan := range plans {
				key := features[i].Items[j].Key
				var value interface{}

				switch key {
				case "max_properties":
					value = plan.MaxProperties
				case "max_clients":
					value = plan.MaxClients
				case "max_appointments":
					value = plan.MaxAppointmentsPerMonth
				case "sms_limit":
					value = plan.MaxSmsMessagesPerMonth
				case "whatsapp_limit":
					value = plan.MaxWhatsappMessagesPerMonth
				case "max_connections":
					value = plan.MaxBrokerConnections
				case "max_posts":
					value = plan.MaxBusinessPostsPerMonth
				case "basic_analytics":
					value = plan.HasAnalytics
				case "advanced_analytics":
					value = plan.HasAdvancedAnalytics
				case "priority_support":
					value = plan.HasPrioritySupport
				case "api_access":
					value = plan.HasAPIAccess
				default:
					value = false
				}

				features[i].Items[j].Values[plan.Name] = value
			}
		}
	}

	return features
}

// ============================================================================
// User Subscriptions
// ============================================================================

// GetUserSubscription retrieves the current subscription for a user
func (s *SubscriptionService) GetUserSubscription(userID string) (*models.UserSubscriptionDetails, error) {
	// Get subscription
	sub, err := s.subscriptionRepo.GetUserSubscription(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get subscription: %w", err)
	}

	// If no subscription, return nil (user needs to activate trial or subscribe)
	if sub == nil {
		return nil, nil
	}

	// Get plan details
	plan, err := s.subscriptionRepo.GetPlanByID(sub.PlanID)
	if err != nil {
		return nil, fmt.Errorf("failed to get plan: %w", err)
	}

	// Get feature usage
	usage, err := s.subscriptionRepo.GetAllFeatureUsage(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get feature usage: %w", err)
	}

	// Build detailed response
	details := &models.UserSubscriptionDetails{
		Subscription: sub,
		Plan:         plan,
		Usage:        usage,
		IsActive:     s.isSubscriptionActive(sub),
		DaysLeft:     s.calculateDaysLeft(sub),
	}

	return details, nil
}

// ActivateTrial activates a free trial for a user
func (s *SubscriptionService) ActivateTrial(userID string) (*models.UserSubscription, error) {
	// Check if user exists and mobile is verified
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	if !user.MobileVerified {
		return nil, fmt.Errorf("mobile number must be verified before activating trial")
	}

	// Check if user already has an active subscription
	hasActive, err := s.subscriptionRepo.HasActiveSubscription(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check active subscription: %w", err)
	}
	if hasActive {
		return nil, fmt.Errorf("user already has an active subscription")
	}

	// Check if user has already used trial
	hasUsedTrial, err := s.subscriptionRepo.HasUsedTrial(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check trial usage: %w", err)
	}
	if hasUsedTrial {
		return nil, fmt.Errorf("trial already used. Please subscribe to a paid plan")
	}

	// Get free trial plan
	trialPlan, err := s.subscriptionRepo.GetPlanBySlug("free_trial")
	if err != nil {
		return nil, fmt.Errorf("trial plan not found: %w", err)
	}

	// Create trial subscription (15 days)
	now := time.Now()
	trialEnd := now.AddDate(0, 0, 15) // 15 days trial

	subscription := &models.UserSubscription{
		UserID:             userID,
		PlanID:             trialPlan.ID,
		Status:             models.StatusTrial,
		BillingCycle:       models.BillingCycleTrial,
		IsTrial:            true,
		TrialStartsAt:      &now,
		TrialEndsAt:        &trialEnd,
		CurrentPeriodStart: now,
		CurrentPeriodEnd:   trialEnd,
		CancelAtPeriodEnd:  false,
	}

	if err := s.subscriptionRepo.CreateUserSubscription(subscription); err != nil {
		return nil, fmt.Errorf("failed to create trial subscription: %w", err)
	}

	// Log event
	eventData := models.JSONB{
		"plan_name":  trialPlan.DisplayName,
		"trial_days": 15,
		"trial_end":  trialEnd,
	}

	event := &models.SubscriptionEvent{
		UserID:         userID,
		SubscriptionID: &subscription.ID,
		EventType:      models.EventTrialStarted,
		EventData:      eventData,
	}
	_ = s.subscriptionRepo.CreateSubscriptionEvent(event)

	return subscription, nil
}

// CancelSubscription cancels a user's subscription
func (s *SubscriptionService) CancelSubscription(userID string) error {
	// Get current subscription
	sub, err := s.subscriptionRepo.GetUserSubscription(userID)
	if err != nil {
		return fmt.Errorf("failed to get subscription: %w", err)
	}

	if sub == nil {
		return fmt.Errorf("no active subscription found")
	}

	// Cancel subscription
	if err := s.subscriptionRepo.CancelSubscription(sub.ID); err != nil {
		return fmt.Errorf("failed to cancel subscription: %w", err)
	}

	// Log event
	eventData := models.JSONB{
		"canceled_at": time.Now(),
		"reason":      "user_requested",
	}

	event := &models.SubscriptionEvent{
		UserID:         userID,
		SubscriptionID: &sub.ID,
		EventType:      models.EventSubscriptionCancelled,
		EventData:      eventData,
	}
	_ = s.subscriptionRepo.CreateSubscriptionEvent(event)

	return nil
}

// ============================================================================
// Feature Access Control
// ============================================================================

// CheckFeatureAccess checks if user has access to a feature
func (s *SubscriptionService) CheckFeatureAccess(userID string, featureName string) (bool, error) {
	// Get user subscription
	sub, err := s.subscriptionRepo.GetUserSubscription(userID)
	if err != nil {
		return false, fmt.Errorf("failed to get subscription: %w", err)
	}

	// No subscription = no access
	if sub == nil {
		return false, nil
	}

	// Check if subscription is active
	if !s.isSubscriptionActive(sub) {
		return false, nil
	}

	// Get plan limits
	plan, err := s.subscriptionRepo.GetPlanByID(sub.PlanID)
	if err != nil {
		return false, fmt.Errorf("failed to get plan: %w", err)
	}

	// Check feature access based on plan
	switch featureName {
	case "properties":
		return plan.MaxProperties == nil || *plan.MaxProperties > 0, nil
	case "clients":
		return plan.MaxClients == nil || *plan.MaxClients > 0, nil
	case "appointments":
		return plan.MaxAppointmentsPerMonth == nil || *plan.MaxAppointmentsPerMonth > 0, nil
	case "whatsapp":
		return plan.MaxWhatsappMessagesPerMonth != nil && *plan.MaxWhatsappMessagesPerMonth > 0, nil
	case "sms":
		return plan.MaxSmsMessagesPerMonth != nil && *plan.MaxSmsMessagesPerMonth > 0, nil
	case "network":
		return plan.MaxBrokerConnections != nil && *plan.MaxBrokerConnections > 0, nil
	case "analytics":
		return plan.HasAnalytics, nil
	case "advanced_analytics":
		return plan.HasAdvancedAnalytics, nil
	case "api_access":
		return plan.HasAPIAccess, nil
	case "priority_support":
		return plan.HasPrioritySupport, nil
	default:
		return false, nil
	}
}

// CheckFeatureLimit checks if user has exceeded a feature limit
func (s *SubscriptionService) CheckFeatureLimit(userID string, featureName string) (*models.FeatureLimitCheck, error) {
	// Get user subscription
	sub, err := s.subscriptionRepo.GetUserSubscription(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get subscription: %w", err)
	}

	result := &models.FeatureLimitCheck{
		FeatureName: featureName,
		HasAccess:   false,
		Limit:       0,
		Used:        0,
		Remaining:   0,
	}

	// No subscription = no access
	if sub == nil {
		return result, nil
	}

	// Check if subscription is active
	if !s.isSubscriptionActive(sub) {
		return result, nil
	}

	// Get plan limits
	plan, err := s.subscriptionRepo.GetPlanByID(sub.PlanID)
	if err != nil {
		return nil, fmt.Errorf("failed to get plan: %w", err)
	}

	// Get limit and usage based on feature
	var limit *int
	var used int

	switch featureName {
	case "properties":
		limit = plan.MaxProperties
		used = sub.CurrentPropertiesCount
	case "clients":
		limit = plan.MaxClients
		used = sub.CurrentClientsCount
	case "appointments":
		limit = plan.MaxAppointmentsPerMonth
		used = sub.CurrentAppointmentsCount
	case "whatsapp_messages":
		limit = plan.MaxWhatsappMessagesPerMonth
		used = sub.CurrentWhatsappMessagesCount
	case "sms_messages":
		limit = plan.MaxSmsMessagesPerMonth
		used = sub.CurrentSmsMessagesCount
	case "business_posts":
		limit = plan.MaxBusinessPostsPerMonth
		used = sub.CurrentBusinessPostsCount
	default:
		return result, nil
	}

	result.HasAccess = true
	result.Used = used

	if limit == nil {
		// Unlimited
		result.Limit = -1
		result.Remaining = -1
	} else {
		result.Limit = *limit
		result.Remaining = *limit - used
		if result.Remaining < 0 {
			result.Remaining = 0
		}
	}

	return result, nil
}

// IncrementFeatureUsage increments usage for a feature
func (s *SubscriptionService) IncrementFeatureUsage(userID string, featureName string, count int) error {
	return s.subscriptionRepo.IncrementFeatureUsage(userID, featureName, count)
}

// ============================================================================
// Helper Methods
// ============================================================================

// isSubscriptionActive checks if a subscription is currently active
func (s *SubscriptionService) isSubscriptionActive(sub *models.UserSubscription) bool {
	if sub == nil {
		return false
	}

	// Check status
	if sub.Status != models.StatusActive && sub.Status != models.StatusTrial {
		return false
	}

	// Check if period has ended
	if time.Now().After(sub.CurrentPeriodEnd) {
		return false
	}

	return true
}

// calculateDaysLeft calculates days remaining in subscription
func (s *SubscriptionService) calculateDaysLeft(sub *models.UserSubscription) int {
	if sub == nil {
		return 0
	}

	duration := time.Until(sub.CurrentPeriodEnd)
	days := int(duration.Hours() / 24)

	if days < 0 {
		return 0
	}

	return days
}

// GetSubscriptionStatus returns a detailed status of user's subscription
func (s *SubscriptionService) GetSubscriptionStatus(userID string) (*models.SubscriptionStatusInfo, error) {
	sub, err := s.subscriptionRepo.GetUserSubscription(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get subscription: %w", err)
	}

	status := &models.SubscriptionStatusInfo{
		HasSubscription: sub != nil,
		IsActive:        false,
		IsTrialing:      false,
		IsPaid:          false,
		DaysLeft:        0,
	}

	if sub != nil {
		status.IsActive = s.isSubscriptionActive(sub)
		status.IsTrialing = sub.Status == models.StatusTrial
		status.IsPaid = sub.Status == models.StatusActive && sub.RazorpaySubscriptionID != nil
		status.DaysLeft = s.calculateDaysLeft(sub)

		// Get plan name
		if plan, err := s.subscriptionRepo.GetPlanByID(sub.PlanID); err == nil {
			status.PlanSlug = plan.Name
		}
	}

	return status, nil
}
