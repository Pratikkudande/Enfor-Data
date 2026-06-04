package repository

import (
	"database/sql"
	"fmt"
	"time"

	"enfor-data-backend/internal/database"
	"enfor-data-backend/internal/models"
)

type SubscriptionRepository struct {
	db *database.DB
}

func NewSubscriptionRepository(db *database.DB) *SubscriptionRepository {
	return &SubscriptionRepository{
		db: db,
	}
}

// ============================================================================
// Subscription Plans
// ============================================================================

// GetAllPlans retrieves all active subscription plans
func (r *SubscriptionRepository) GetAllPlans() ([]models.SubscriptionPlan, error) {
	query := `
		SELECT id, name, display_name, description, monthly_price, annual_price, currency,
		       sms_credits, sms_rate,
		       max_properties, max_clients, max_appointments_per_month,
		       max_whatsapp_messages_per_month, max_sms_messages_per_month,
		       max_broker_connections, max_business_posts_per_month, max_team_members,
		       has_analytics, has_advanced_analytics, has_api_access,
		       has_custom_templates, has_priority_support,
		       is_active, is_visible, is_popular, sort_order, target_role,
		       created_at, updated_at
		FROM subscription_plans
		WHERE is_active = true
		ORDER BY sort_order ASC
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query plans: %w", err)
	}
	defer rows.Close()

	var plans []models.SubscriptionPlan
	for rows.Next() {
		var plan models.SubscriptionPlan
		err := rows.Scan(
			&plan.ID,
			&plan.Name,
			&plan.DisplayName,
			&plan.Description,
			&plan.MonthlyPrice,
			&plan.AnnualPrice,
			&plan.Currency,
			&plan.SmsCredits,
			&plan.SmsRate,
			&plan.MaxProperties,
			&plan.MaxClients,
			&plan.MaxAppointmentsPerMonth,
			&plan.MaxWhatsappMessagesPerMonth,
			&plan.MaxSmsMessagesPerMonth,
			&plan.MaxBrokerConnections,
			&plan.MaxBusinessPostsPerMonth,
			&plan.MaxTeamMembers,
			&plan.HasAnalytics,
			&plan.HasAdvancedAnalytics,
			&plan.HasAPIAccess,
			&plan.HasCustomTemplates,
			&plan.HasPrioritySupport,
			&plan.IsActive,
			&plan.IsVisible,
			&plan.IsPopular,
			&plan.SortOrder,
			&plan.TargetRole,
			&plan.CreatedAt,
			&plan.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan plan: %w", err)
		}
		plans = append(plans, plan)
	}

	return plans, nil
}

// GetPlanByID retrieves a subscription plan by ID
func (r *SubscriptionRepository) GetPlanByID(planID string) (*models.SubscriptionPlan, error) {
	query := `
		SELECT id, name, display_name, description, monthly_price, annual_price, currency,
		       sms_credits, sms_rate,
		       max_properties, max_clients, max_appointments_per_month,
		       max_whatsapp_messages_per_month, max_sms_messages_per_month,
		       max_broker_connections, max_business_posts_per_month, max_team_members,
		       has_analytics, has_advanced_analytics, has_api_access,
		       has_custom_templates, has_priority_support,
		       is_active, is_visible, is_popular, sort_order, target_role,
		       created_at, updated_at
		FROM subscription_plans
		WHERE id = $1 AND is_active = true
	`

	var plan models.SubscriptionPlan
	err := r.db.QueryRow(query, planID).Scan(
		&plan.ID,
		&plan.Name,
		&plan.DisplayName,
		&plan.Description,
		&plan.MonthlyPrice,
		&plan.AnnualPrice,
		&plan.Currency,
		&plan.SmsCredits,
		&plan.SmsRate,
		&plan.MaxProperties,
		&plan.MaxClients,
		&plan.MaxAppointmentsPerMonth,
		&plan.MaxWhatsappMessagesPerMonth,
		&plan.MaxSmsMessagesPerMonth,
		&plan.MaxBrokerConnections,
		&plan.MaxBusinessPostsPerMonth,
		&plan.MaxTeamMembers,
		&plan.HasAnalytics,
		&plan.HasAdvancedAnalytics,
		&plan.HasAPIAccess,
		&plan.HasCustomTemplates,
		&plan.HasPrioritySupport,
		&plan.IsActive,
		&plan.IsVisible,
		&plan.IsPopular,
		&plan.SortOrder,
		&plan.TargetRole,
		&plan.CreatedAt,
		&plan.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("plan not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get plan: %w", err)
	}

	return &plan, nil
}

// GetPlanBySlug retrieves a subscription plan by name (slug)
func (r *SubscriptionRepository) GetPlanBySlug(slug string) (*models.SubscriptionPlan, error) {
	query := `
		SELECT id, name, display_name, description, monthly_price, annual_price, currency,
		       sms_credits, sms_rate,
		       max_properties, max_clients, max_appointments_per_month,
		       max_whatsapp_messages_per_month, max_sms_messages_per_month,
		       max_broker_connections, max_business_posts_per_month, max_team_members,
		       has_analytics, has_advanced_analytics, has_api_access,
		       has_custom_templates, has_priority_support,
		       is_active, is_visible, is_popular, sort_order, target_role,
		       created_at, updated_at
		FROM subscription_plans
		WHERE name = $1 AND is_active = true
	`

	var plan models.SubscriptionPlan
	err := r.db.QueryRow(query, slug).Scan(
		&plan.ID,
		&plan.Name,
		&plan.DisplayName,
		&plan.Description,
		&plan.MonthlyPrice,
		&plan.AnnualPrice,
		&plan.Currency,
		&plan.SmsCredits,
		&plan.SmsRate,
		&plan.MaxProperties,
		&plan.MaxClients,
		&plan.MaxAppointmentsPerMonth,
		&plan.MaxWhatsappMessagesPerMonth,
		&plan.MaxSmsMessagesPerMonth,
		&plan.MaxBrokerConnections,
		&plan.MaxBusinessPostsPerMonth,
		&plan.MaxTeamMembers,
		&plan.HasAnalytics,
		&plan.HasAdvancedAnalytics,
		&plan.HasAPIAccess,
		&plan.HasCustomTemplates,
		&plan.HasPrioritySupport,
		&plan.IsActive,
		&plan.IsVisible,
		&plan.IsPopular,
		&plan.SortOrder,
		&plan.TargetRole,
		&plan.CreatedAt,
		&plan.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("plan not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get plan: %w", err)
	}

	return &plan, nil
}

// ============================================================================
// User Subscriptions
// ============================================================================

// GetUserSubscription retrieves the active subscription for a user
func (r *SubscriptionRepository) GetUserSubscription(userID string) (*models.UserSubscription, error) {
	query := `
		SELECT us.id, us.user_id, us.plan_id, us.status, us.billing_cycle,
		       us.is_trial, us.trial_starts_at, us.trial_ends_at,
		       us.current_period_start, us.current_period_end,
		       us.cancel_at_period_end, us.cancelled_at, us.cancellation_reason,
		       us.razorpay_subscription_id, us.razorpay_plan_id, us.razorpay_customer_id,
		       us.current_properties_count, us.current_clients_count,
		       us.current_appointments_count, us.current_whatsapp_messages_count,
		       us.current_sms_messages_count, us.current_business_posts_count,
		       us.usage_reset_at, us.metadata, us.created_at, us.updated_at
		FROM user_subscriptions us
		WHERE us.user_id = $1
		  AND us.status IN ('active', 'trial', 'past_due')
		ORDER BY us.created_at DESC
		LIMIT 1
	`

	var sub models.UserSubscription

	err := r.db.QueryRow(query, userID).Scan(
		&sub.ID,
		&sub.UserID,
		&sub.PlanID,
		&sub.Status,
		&sub.BillingCycle,
		&sub.IsTrial,
		&sub.TrialStartsAt,
		&sub.TrialEndsAt,
		&sub.CurrentPeriodStart,
		&sub.CurrentPeriodEnd,
		&sub.CancelAtPeriodEnd,
		&sub.CancelledAt,
		&sub.CancellationReason,
		&sub.RazorpaySubscriptionID,
		&sub.RazorpayPlanID,
		&sub.RazorpayCustomerID,
		&sub.CurrentPropertiesCount,
		&sub.CurrentClientsCount,
		&sub.CurrentAppointmentsCount,
		&sub.CurrentWhatsappMessagesCount,
		&sub.CurrentSmsMessagesCount,
		&sub.CurrentBusinessPostsCount,
		&sub.UsageResetAt,
		&sub.Metadata,
		&sub.CreatedAt,
		&sub.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil // No active subscription
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user subscription: %w", err)
	}

	return &sub, nil
}

// CreateUserSubscription creates a new subscription for a user
func (r *SubscriptionRepository) CreateUserSubscription(sub *models.UserSubscription) error {
	query := `
		INSERT INTO user_subscriptions (
			user_id, plan_id, status, billing_cycle,
			is_trial, trial_starts_at, trial_ends_at,
			current_period_start, current_period_end,
			cancel_at_period_end, razorpay_subscription_id
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, created_at, updated_at
	`

	err := r.db.QueryRow(
		query,
		sub.UserID,
		sub.PlanID,
		sub.Status,
		sub.BillingCycle,
		sub.IsTrial,
		sub.TrialStartsAt,
		sub.TrialEndsAt,
		sub.CurrentPeriodStart,
		sub.CurrentPeriodEnd,
		sub.CancelAtPeriodEnd,
		sub.RazorpaySubscriptionID,
	).Scan(&sub.ID, &sub.CreatedAt, &sub.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create subscription: %w", err)
	}

	return nil
}

// UpdateSubscriptionStatus updates the status of a subscription
func (r *SubscriptionRepository) UpdateSubscriptionStatus(subID string, status string) error {
	query := `
		UPDATE user_subscriptions
		SET status = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2
	`

	result, err := r.db.Exec(query, status, subID)
	if err != nil {
		return fmt.Errorf("failed to update subscription status: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rows == 0 {
		return fmt.Errorf("subscription not found")
	}

	return nil
}

// UpdateSubscription updates a subscription record
func (r *SubscriptionRepository) UpdateSubscription(sub *models.UserSubscription) error {
	query := `
		UPDATE user_subscriptions
		SET plan_id = $1,
		    status = $2,
		    billing_cycle = $3,
		    is_trial = $4,
		    current_period_start = $5,
		    current_period_end = $6,
		    razorpay_subscription_id = $7,
		    cancel_at_period_end = $8,
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = $9
	`

	result, err := r.db.Exec(
		query,
		sub.PlanID,
		sub.Status,
		sub.BillingCycle,
		sub.IsTrial,
		sub.CurrentPeriodStart,
		sub.CurrentPeriodEnd,
		sub.RazorpaySubscriptionID,
		sub.CancelAtPeriodEnd,
		sub.ID,
	)

	if err != nil {
		return fmt.Errorf("failed to update subscription: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rows == 0 {
		return fmt.Errorf("subscription not found")
	}

	return nil
}

// CancelSubscription marks a subscription as canceled
func (r *SubscriptionRepository) CancelSubscription(subID string) error {
	query := `
		UPDATE user_subscriptions
		SET status = 'cancelled',
		    cancelled_at = CURRENT_TIMESTAMP,
		    cancel_at_period_end = true,
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`

	result, err := r.db.Exec(query, subID)
	if err != nil {
		return fmt.Errorf("failed to cancel subscription: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rows == 0 {
		return fmt.Errorf("subscription not found")
	}

	return nil
}

// UpdateSubscriptionPeriod updates the current period dates
func (r *SubscriptionRepository) UpdateSubscriptionPeriod(subID string, start, end time.Time) error {
	query := `
		UPDATE user_subscriptions
		SET current_period_start = $1,
		    current_period_end = $2,
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = $3
	`

	result, err := r.db.Exec(query, start, end, subID)
	if err != nil {
		return fmt.Errorf("failed to update subscription period: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rows == 0 {
		return fmt.Errorf("subscription not found")
	}

	return nil
}

// HasActiveSubscription checks if user has an active subscription
func (r *SubscriptionRepository) HasActiveSubscription(userID string) (bool, error) {
	query := `
		SELECT COUNT(*) > 0
		FROM user_subscriptions
		WHERE user_id = $1
		  AND status IN ('active', 'trial')
		  AND current_period_end > CURRENT_TIMESTAMP
	`

	var hasActive bool
	err := r.db.QueryRow(query, userID).Scan(&hasActive)
	if err != nil {
		return false, fmt.Errorf("failed to check active subscription: %w", err)
	}

	return hasActive, nil
}

// HasUsedTrial checks if user has already used their free trial
func (r *SubscriptionRepository) HasUsedTrial(userID string) (bool, error) {
	query := `
		SELECT COUNT(*) > 0
		FROM user_subscriptions
		WHERE user_id = $1
		  AND is_trial = true
	`

	var hasUsed bool
	err := r.db.QueryRow(query, userID).Scan(&hasUsed)
	if err != nil {
		return false, fmt.Errorf("failed to check trial usage: %w", err)
	}

	return hasUsed, nil
}

// ============================================================================
// Subscription Events (Audit Log)
// ============================================================================

// CreateSubscriptionEvent logs a subscription event
func (r *SubscriptionRepository) CreateSubscriptionEvent(event *models.SubscriptionEvent) error {
	query := `
		INSERT INTO subscription_events (
			user_id, subscription_id, event_type, event_data
		) VALUES ($1, $2, $3, $4)
		RETURNING id, created_at
	`

	err := r.db.QueryRow(
		query,
		event.UserID,
		event.SubscriptionID,
		event.EventType,
		event.EventData,
	).Scan(&event.ID, &event.CreatedAt)

	if err != nil {
		return fmt.Errorf("failed to create subscription event: %w", err)
	}

	return nil
}

// GetSubscriptionEvents retrieves events for a subscription
func (r *SubscriptionRepository) GetSubscriptionEvents(subscriptionID string, limit int) ([]models.SubscriptionEvent, error) {
	query := `
		SELECT id, user_id, subscription_id, event_type, event_data, created_at
		FROM subscription_events
		WHERE subscription_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`

	rows, err := r.db.Query(query, subscriptionID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query subscription events: %w", err)
	}
	defer rows.Close()

	var events []models.SubscriptionEvent
	for rows.Next() {
		var event models.SubscriptionEvent
		err := rows.Scan(
			&event.ID,
			&event.UserID,
			&event.SubscriptionID,
			&event.EventType,
			&event.EventData,
			&event.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan event: %w", err)
		}
		events = append(events, event)
	}

	return events, nil
}

// ============================================================================
// Feature Usage Tracking (using user_subscriptions counters)
// ============================================================================

// GetFeatureUsage retrieves current feature usage count for a user
func (r *SubscriptionRepository) GetFeatureUsage(userID string, featureName string) (int, error) {
	var column string
	switch featureName {
	case "properties":
		column = "current_properties_count"
	case "clients":
		column = "current_clients_count"
	case "appointments":
		column = "current_appointments_count"
	case "whatsapp_messages":
		column = "current_whatsapp_messages_count"
	case "sms_messages":
		column = "current_sms_messages_count"
	case "business_posts":
		column = "current_business_posts_count"
	default:
		return 0, fmt.Errorf("unknown feature: %s", featureName)
	}

	query := fmt.Sprintf(`
		SELECT COALESCE(%s, 0)
		FROM user_subscriptions
		WHERE user_id = $1
		  AND status IN ('active', 'trial')
		ORDER BY created_at DESC
		LIMIT 1
	`, column)

	var usage int
	err := r.db.QueryRow(query, userID).Scan(&usage)
	if err == sql.ErrNoRows {
		return 0, nil
	}
	if err != nil {
		return 0, fmt.Errorf("failed to get feature usage: %w", err)
	}

	return usage, nil
}

// IncrementFeatureUsage increments usage count for a feature
func (r *SubscriptionRepository) IncrementFeatureUsage(userID, featureName string, count int) error {
	var column string
	switch featureName {
	case "properties":
		column = "current_properties_count"
	case "clients":
		column = "current_clients_count"
	case "appointments":
		column = "current_appointments_count"
	case "whatsapp_messages":
		column = "current_whatsapp_messages_count"
	case "sms_messages":
		column = "current_sms_messages_count"
	case "business_posts":
		column = "current_business_posts_count"
	default:
		return fmt.Errorf("unknown feature: %s", featureName)
	}

	query := fmt.Sprintf(`
		UPDATE user_subscriptions
		SET %s = %s + $1,
		    updated_at = CURRENT_TIMESTAMP
		WHERE user_id = $2
		  AND status IN ('active', 'trial')
	`, column, column)

	_, err := r.db.Exec(query, count, userID)
	if err != nil {
		return fmt.Errorf("failed to increment feature usage: %w", err)
	}

	return nil
}

// GetAllFeatureUsage retrieves all feature usage for a user
func (r *SubscriptionRepository) GetAllFeatureUsage(userID string) (map[string]int, error) {
	query := `
		SELECT current_properties_count, current_clients_count,
		       current_appointments_count, current_whatsapp_messages_count,
		       current_sms_messages_count, current_business_posts_count
		FROM user_subscriptions
		WHERE user_id = $1
		  AND status IN ('active', 'trial')
		ORDER BY created_at DESC
		LIMIT 1
	`

	var props, clients, appts, whatsapp, sms, posts int
	err := r.db.QueryRow(query, userID).Scan(&props, &clients, &appts, &whatsapp, &sms, &posts)
	if err == sql.ErrNoRows {
		return map[string]int{}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get feature usage: %w", err)
	}

	usage := map[string]int{
		"properties":         props,
		"clients":            clients,
		"appointments":       appts,
		"whatsapp_messages":  whatsapp,
		"sms_messages":       sms,
		"business_posts":     posts,
	}

	return usage, nil
}
