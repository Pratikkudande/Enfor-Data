package repository

import (
	"database/sql"
	"fmt"
	"time"

	"enfor-data-backend/internal/database"
	"enfor-data-backend/internal/models"
)

type AdminRepository struct {
	db *database.DB
}

func NewAdminRepository(db *database.DB) *AdminRepository {
	return &AdminRepository{db: db}
}

func (r *AdminRepository) GetDashboardStats() (*models.AdminDashboardStats, error) {
	stats := &models.AdminDashboardStats{}

	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	thirtyDaysAgo := now.AddDate(0, 0, -30)

	r.db.QueryRow(`SELECT COUNT(*) FROM users WHERE role IN ('broker','channel_partner') AND is_active = TRUE AND COALESCE(is_blocked, FALSE) = FALSE`).Scan(&stats.ActiveUsers)
	r.db.QueryRow(`SELECT COALESCE(SUM(amount),0) FROM payments WHERE status = 'captured'`).Scan(&stats.TotalRevenue)
	r.db.QueryRow(`SELECT COUNT(*) FROM users WHERE role IN ('broker','channel_partner') AND created_at >= $1`, startOfMonth).Scan(&stats.NewRegistrations)
	r.db.QueryRow(`SELECT COUNT(*) FROM properties WHERE created_at >= $1 AND deleted_at IS NULL`, startOfMonth).Scan(&stats.PropertiesAdded)
	r.db.QueryRow(`SELECT COUNT(*) FROM feedback WHERE status = 'new'`).Scan(&stats.FeedbackCount)
	r.db.QueryRow(`SELECT COUNT(*) FROM user_subscriptions WHERE current_period_end BETWEEN $1 AND $2 AND status = 'active'`, now, now.AddDate(0, 0, 30)).Scan(&stats.RenewalsDue)
	r.db.QueryRow(`SELECT COUNT(*) FROM users WHERE role IN ('broker','channel_partner') AND created_at >= $1`, thirtyDaysAgo).Scan(&stats.BrokerNetworkGrowth)

	// SMS usage - count from sms_campaigns
	r.db.QueryRow(`SELECT COALESCE(SUM(sent_count),0) FROM sms_campaigns WHERE created_at >= $1`, startOfMonth).Scan(&stats.SMSUsage)

	return stats, nil
}

func (r *AdminRepository) GetAnalytics() (*models.AdminAnalytics, error) {
	analytics := &models.AdminAnalytics{}

	// Last 6 months trend data
	for i := 5; i >= 0; i-- {
		now := time.Now()
		start := time.Date(now.Year(), now.Month()-time.Month(i), 1, 0, 0, 0, 0, now.Location())
		end := time.Date(now.Year(), now.Month()-time.Month(i)+1, 1, 0, 0, 0, 0, now.Location())
		label := start.Format("Jan 06")

		var regCount, propCount, smsCount float64
		r.db.QueryRow(`SELECT COUNT(*) FROM users WHERE role IN ('broker','channel_partner') AND created_at >= $1 AND created_at < $2`, start, end).Scan(&regCount)
		r.db.QueryRow(`SELECT COUNT(*) FROM properties WHERE created_at >= $1 AND created_at < $2 AND deleted_at IS NULL`, start, end).Scan(&propCount)
		r.db.QueryRow(`SELECT COALESCE(SUM(sent_count),0) FROM sms_campaigns WHERE created_at >= $1 AND created_at < $2`, start, end).Scan(&smsCount)

		var revenue float64
		r.db.QueryRow(`SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='captured' AND created_at >= $1 AND created_at < $2`, start, end).Scan(&revenue)

		var renewals float64
		r.db.QueryRow(`SELECT COUNT(*) FROM user_subscriptions WHERE current_period_end >= $1 AND current_period_end < $2`, start, end).Scan(&renewals)

		analytics.RegistrationTrend = append(analytics.RegistrationTrend, models.TrendPoint{Label: label, Value: regCount})
		analytics.RevenueTrend = append(analytics.RevenueTrend, models.TrendPoint{Label: label, Value: revenue})
		analytics.PropertyTrend = append(analytics.PropertyTrend, models.TrendPoint{Label: label, Value: propCount})
		analytics.SMSTrend = append(analytics.SMSTrend, models.TrendPoint{Label: label, Value: smsCount})
		analytics.RenewalTrend = append(analytics.RenewalTrend, models.TrendPoint{Label: label, Value: renewals})
	}

	return analytics, nil
}

func (r *AdminRepository) GetBrokers(search, status string, page, limit int) ([]models.BrokerListItem, int, error) {
	offset := (page - 1) * limit

	whereClause := `WHERE u.role IN ('broker','channel_partner')`
	args := []interface{}{}
	argIdx := 1

	if search != "" {
		whereClause += fmt.Sprintf(` AND (u.first_name ILIKE $%d OR u.last_name ILIKE $%d OR u.email ILIKE $%d OR u.firm_name ILIKE $%d)`, argIdx, argIdx, argIdx, argIdx)
		args = append(args, "%"+search+"%")
		argIdx++
	}
	if status == "active" {
		whereClause += ` AND u.is_active = TRUE AND COALESCE(u.is_blocked, FALSE) = FALSE`
	} else if status == "inactive" {
		whereClause += ` AND u.is_active = FALSE`
	} else if status == "blocked" {
		whereClause += ` AND COALESCE(u.is_blocked, FALSE) = TRUE`
	}

	countQuery := `SELECT COUNT(*) FROM users u ` + whereClause
	var total int
	if err := r.db.QueryRow(countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	args = append(args, limit, offset)
	query := fmt.Sprintf(`
		SELECT
			u.id, u.first_name, u.last_name, u.firm_name, u.whatsapp_number, u.email,
			u.city, u.location, u.created_at,
			COALESCE(sp.display_name, 'No Plan') AS package_name,
			us.current_period_end AS package_expiry,
			u.is_active,
			COALESCE(u.is_blocked, FALSE) AS is_blocked,
			u.last_login_at,
			COALESCE(u.login_count, 0) AS login_count,
			(SELECT COUNT(*) FROM properties WHERE broker_id = u.id AND deleted_at IS NULL) AS properties_count,
			(SELECT COUNT(*) FROM clients WHERE broker_id = u.id) AS clients_count,
			(SELECT COUNT(*) FROM agreements WHERE broker_id = u.id) AS agreements_count,
			COALESCE((SELECT SUM(sent_count) FROM sms_campaigns WHERE user_id = u.id), 0) AS sms_used
		FROM users u
		LEFT JOIN user_subscriptions us ON us.user_id = u.id AND us.status IN ('active','trialing')
		LEFT JOIN subscription_plans sp ON sp.id = us.plan_id
		%s
		ORDER BY u.created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIdx, argIdx+1)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var brokers []models.BrokerListItem
	for rows.Next() {
		var b models.BrokerListItem
		err := rows.Scan(
			&b.ID, &b.FirstName, &b.LastName, &b.FirmName, &b.WhatsappNumber, &b.Email,
			&b.City, &b.Location, &b.CreatedAt,
			&b.PackageName, &b.PackageExpiry,
			&b.IsActive, &b.IsBlocked, &b.LastLoginAt, &b.LoginCount,
			&b.PropertiesCount, &b.ClientsCount, &b.AgreementsCount, &b.SMSUsed,
		)
		if err != nil {
			continue
		}
		brokers = append(brokers, b)
	}
	if brokers == nil {
		brokers = []models.BrokerListItem{}
	}
	return brokers, total, nil
}

func (r *AdminRepository) GetBrokerByID(id string) (*models.BrokerListItem, error) {
	b := &models.BrokerListItem{}
	query := `
		SELECT
			u.id, u.first_name, u.last_name, u.firm_name, u.whatsapp_number, u.email,
			u.city, u.location, u.created_at,
			COALESCE(sp.display_name, 'No Plan') AS package_name,
			us.current_period_end AS package_expiry,
			u.is_active,
			COALESCE(u.is_blocked, FALSE) AS is_blocked,
			u.last_login_at,
			COALESCE(u.login_count, 0) AS login_count,
			(SELECT COUNT(*) FROM properties WHERE broker_id = u.id AND deleted_at IS NULL) AS properties_count,
			(SELECT COUNT(*) FROM clients WHERE broker_id = u.id) AS clients_count,
			(SELECT COUNT(*) FROM agreements WHERE broker_id = u.id) AS agreements_count,
			COALESCE((SELECT SUM(sent_count) FROM sms_campaigns WHERE user_id = u.id), 0) AS sms_used
		FROM users u
		LEFT JOIN user_subscriptions us ON us.user_id = u.id AND us.status IN ('active','trialing')
		LEFT JOIN subscription_plans sp ON sp.id = us.plan_id
		WHERE u.id = $1
	`
	err := r.db.QueryRow(query, id).Scan(
		&b.ID, &b.FirstName, &b.LastName, &b.FirmName, &b.WhatsappNumber, &b.Email,
		&b.City, &b.Location, &b.CreatedAt,
		&b.PackageName, &b.PackageExpiry,
		&b.IsActive, &b.IsBlocked, &b.LastLoginAt, &b.LoginCount,
		&b.PropertiesCount, &b.ClientsCount, &b.AgreementsCount, &b.SMSUsed,
	)
	if err != nil {
		return nil, err
	}
	return b, nil
}

func (r *AdminRepository) UpdateUserStatus(userID, status string) error {
	var query string
	switch status {
	case "activate":
		query = `UPDATE users SET is_active = TRUE, is_blocked = FALSE WHERE id = $1`
	case "deactivate":
		query = `UPDATE users SET is_active = FALSE WHERE id = $1`
	case "block":
		query = `UPDATE users SET is_blocked = TRUE WHERE id = $1`
	default:
		return fmt.Errorf("invalid status: %s", status)
	}
	_, err := r.db.Exec(query, userID)
	return err
}

func (r *AdminRepository) DeleteUser(userID string) error {
	_, err := r.db.Exec(`UPDATE users SET is_active = FALSE WHERE id = $1`, userID)
	return err
}

func (r *AdminRepository) GetRevenueStats() (*models.RevenueStats, error) {
	stats := &models.RevenueStats{}
	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	startOfYear := time.Date(now.Year(), 1, 1, 0, 0, 0, 0, now.Location())

	r.db.QueryRow(`SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='captured'`).Scan(&stats.TotalRevenue)
	r.db.QueryRow(`SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='captured' AND created_at >= $1`, startOfMonth).Scan(&stats.MonthlyRevenue)
	r.db.QueryRow(`SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='captured' AND created_at >= $1`, startOfYear).Scan(&stats.YearlyRevenue)
	r.db.QueryRow(`SELECT COUNT(*) FROM user_subscriptions WHERE current_period_end BETWEEN $1 AND $2 AND status='active'`, now, now.AddDate(0, 0, 30)).Scan(&stats.RenewalsDue30Days)

	// Estimate pending renewal value from active subscriptions expiring in 30 days
	r.db.QueryRow(`
		SELECT COALESCE(SUM(sp.monthly_price),0)
		FROM user_subscriptions us
		JOIN subscription_plans sp ON sp.id = us.plan_id
		WHERE us.current_period_end BETWEEN $1 AND $2 AND us.status='active'
	`, now, now.AddDate(0, 0, 30)).Scan(&stats.PendingRenewalValue)

	return stats, nil
}

func (r *AdminRepository) GetSubscriptions(page, limit int) ([]models.SubscriptionRecord, int, error) {
	offset := (page - 1) * limit
	var total int
	r.db.QueryRow(`SELECT COUNT(*) FROM payments WHERE status='captured'`).Scan(&total)

	rows, err := r.db.Query(`
		SELECT
			u.id, CONCAT(u.first_name,' ',u.last_name) AS user_name, u.email,
			sp.display_name AS package_name,
			p.amount, p.created_at AS payment_date, us.current_period_end AS renewal_date,
			COALESCE(p.razorpay_payment_id, p.id::text) AS transaction_id,
			p.status
		FROM payments p
		JOIN users u ON u.id = p.user_id
		JOIN subscription_plans sp ON sp.id = p.plan_id
		LEFT JOIN user_subscriptions us ON us.user_id = p.user_id AND us.plan_id = p.plan_id
		WHERE p.status = 'captured'
		ORDER BY p.created_at DESC
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var records []models.SubscriptionRecord
	for rows.Next() {
		var s models.SubscriptionRecord
		rows.Scan(&s.UserID, &s.UserName, &s.Email, &s.PackageName, &s.AmountPaid, &s.PaymentDate, &s.RenewalDate, &s.TransactionID, &s.Status)
		records = append(records, s)
	}
	if records == nil {
		records = []models.SubscriptionRecord{}
	}
	return records, total, nil
}

func (r *AdminRepository) GetSMSStats() (*models.SMSStats, error) {
	stats := &models.SMSStats{}

	// Allocated from subscription plans (sum across active subscriptions)
	r.db.QueryRow(`
		SELECT COALESCE(SUM(sp.max_sms_messages_per_month),0)
		FROM user_subscriptions us
		JOIN subscription_plans sp ON sp.id = us.plan_id
		WHERE us.status IN ('active','trialing')
	`).Scan(&stats.TotalPurchased)

	r.db.QueryRow(`SELECT COALESCE(SUM(sent_count),0) FROM sms_campaigns`).Scan(&stats.TotalUsed)
	stats.Remaining = stats.TotalPurchased - stats.TotalUsed
	if stats.Remaining < 0 {
		stats.Remaining = 0
	}

	rows, err := r.db.Query(`
		SELECT
			u.id, CONCAT(u.first_name,' ',u.last_name),
			COALESCE(sp.max_sms_messages_per_month, 0),
			COALESCE((SELECT SUM(sent_count) FROM sms_campaigns WHERE user_id = u.id), 0)
		FROM users u
		LEFT JOIN user_subscriptions us ON us.user_id = u.id AND us.status IN ('active','trialing')
		LEFT JOIN subscription_plans sp ON sp.id = us.plan_id
		WHERE u.role IN ('broker','channel_partner')
		ORDER BY (SELECT COALESCE(SUM(sent_count),0) FROM sms_campaigns WHERE user_id = u.id) DESC
		LIMIT 20
	`)
	if err != nil {
		return stats, nil
	}
	defer rows.Close()

	for rows.Next() {
		var bu models.BrokerSMSUsage
		rows.Scan(&bu.BrokerID, &bu.BrokerName, &bu.Allocated, &bu.Used)
		bu.Remaining = bu.Allocated - bu.Used
		if bu.Remaining < 0 {
			bu.Remaining = 0
		}
		stats.BrokerWiseUsage = append(stats.BrokerWiseUsage, bu)
	}
	if stats.BrokerWiseUsage == nil {
		stats.BrokerWiseUsage = []models.BrokerSMSUsage{}
	}
	return stats, nil
}

func (r *AdminRepository) CreateAuditLog(adminID, adminName, action, entityType, entityID, description, ip string) error {
	_, err := r.db.Exec(`
		INSERT INTO admin_audit_logs (admin_id, admin_name, action, entity_type, entity_id, description, ip_address)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
	`, adminID, adminName, action, entityType, entityID, description, ip)
	return err
}

func (r *AdminRepository) GetAuditLogs(page, limit int) ([]models.AuditLog, int, error) {
	offset := (page - 1) * limit
	var total int
	r.db.QueryRow(`SELECT COUNT(*) FROM admin_audit_logs`).Scan(&total)

	rows, err := r.db.Query(`
		SELECT id, admin_id, admin_name, action, entity_type, entity_id, description, ip_address, created_at
		FROM admin_audit_logs
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var logs []models.AuditLog
	for rows.Next() {
		var l models.AuditLog
		rows.Scan(&l.ID, &l.AdminID, &l.AdminName, &l.Action, &l.EntityType, &l.EntityID, &l.Description, &l.IPAddress, &l.CreatedAt)
		logs = append(logs, l)
	}
	if logs == nil {
		logs = []models.AuditLog{}
	}
	return logs, total, nil
}

func (r *AdminRepository) CreateAnnouncement(a *models.Announcement) error {
	return r.db.QueryRow(`
		INSERT INTO announcements (admin_id, title, message, type, target, target_value, status)
		VALUES ($1,$2,$3,$4,$5,$6,'draft')
		RETURNING id, created_at, updated_at
	`, a.AdminID, a.Title, a.Message, a.Type, a.Target, a.TargetValue).Scan(&a.ID, &a.CreatedAt, &a.UpdatedAt)
}

func (r *AdminRepository) GetAnnouncements(page, limit int) ([]models.Announcement, int, error) {
	offset := (page - 1) * limit
	var total int
	r.db.QueryRow(`SELECT COUNT(*) FROM announcements`).Scan(&total)

	rows, err := r.db.Query(`
		SELECT id, admin_id, title, message, type, target, target_value, status, sent_at, created_at, updated_at
		FROM announcements
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var list []models.Announcement
	for rows.Next() {
		var a models.Announcement
		rows.Scan(&a.ID, &a.AdminID, &a.Title, &a.Message, &a.Type, &a.Target, &a.TargetValue, &a.Status, &a.SentAt, &a.CreatedAt, &a.UpdatedAt)
		list = append(list, a)
	}
	if list == nil {
		list = []models.Announcement{}
	}
	return list, total, nil
}

func (r *AdminRepository) SendAnnouncement(id string) error {
	now := time.Now()

	// Get announcement
	var a models.Announcement
	err := r.db.QueryRow(`SELECT id, title, message, type, target, target_value FROM announcements WHERE id = $1`, id).
		Scan(&a.ID, &a.Title, &a.Message, &a.Type, &a.Target, &a.TargetValue)
	if err != nil {
		return err
	}

	// Build target user IDs
	var targetQuery string
	switch a.Target {
	case "all":
		targetQuery = `SELECT id FROM users WHERE role IN ('broker','channel_partner') AND is_active = TRUE`
	case "package":
		targetQuery = fmt.Sprintf(`SELECT u.id FROM users u JOIN user_subscriptions us ON us.user_id = u.id JOIN subscription_plans sp ON sp.id = us.plan_id WHERE sp.name = '%s'`, a.TargetValue)
	case "area":
		targetQuery = fmt.Sprintf(`SELECT id FROM users WHERE (city ILIKE '%%%s%%' OR location ILIKE '%%%s%%')`, a.TargetValue, a.TargetValue)
	default:
		targetQuery = `SELECT id FROM users WHERE role IN ('broker','channel_partner') AND is_active = TRUE`
	}

	rows, err := r.db.Query(targetQuery)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var userID string
		rows.Scan(&userID)
		r.db.Exec(`
			INSERT INTO broker_notifications (user_id, announcement_id, title, message, type)
			VALUES ($1,$2,$3,$4,'announcement')
		`, userID, id, a.Title, a.Message)
	}

	_, err = r.db.Exec(`UPDATE announcements SET status='sent', sent_at=$1, updated_at=$1 WHERE id=$2`, now, id)
	return err
}

func (r *AdminRepository) GetFeedback(status string, page, limit int) ([]models.Feedback, int, error) {
	offset := (page - 1) * limit
	whereClause := ""
	args := []interface{}{}
	argIdx := 1

	if status != "" && status != "all" {
		whereClause = fmt.Sprintf(` WHERE f.status = $%d`, argIdx)
		args = append(args, status)
		argIdx++
	}

	countQuery := `SELECT COUNT(*) FROM feedback f` + whereClause
	var total int
	r.db.QueryRow(countQuery, args...).Scan(&total)

	args = append(args, limit, offset)
	query := fmt.Sprintf(`
		SELECT f.id, f.user_id, CONCAT(u.first_name,' ',u.last_name) AS user_name,
			f.type, f.title, f.description, f.status, f.admin_notes, f.created_at, f.updated_at
		FROM feedback f
		JOIN users u ON u.id = f.user_id
		%s
		ORDER BY f.created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIdx, argIdx+1)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var list []models.Feedback
	for rows.Next() {
		var fb models.Feedback
		rows.Scan(&fb.ID, &fb.UserID, &fb.UserName, &fb.Type, &fb.Title, &fb.Description, &fb.Status, &fb.AdminNotes, &fb.CreatedAt, &fb.UpdatedAt)
		list = append(list, fb)
	}
	if list == nil {
		list = []models.Feedback{}
	}
	return list, total, nil
}

func (r *AdminRepository) UpdateFeedback(id, status, adminNotes string) error {
	_, err := r.db.Exec(`UPDATE feedback SET status=$1, admin_notes=$2, updated_at=NOW() WHERE id=$3`, status, adminNotes, id)
	return err
}

func (r *AdminRepository) GetRenewals() (map[string][]models.RenewalRecord, error) {
	result := map[string][]models.RenewalRecord{
		"30_days": {},
		"15_days": {},
		"7_days":  {},
		"expired": {},
	}
	now := time.Now()

	rows, err := r.db.Query(`
		SELECT
			u.id, CONCAT(u.first_name,' ',u.last_name), u.email, u.whatsapp_number,
			COALESCE(sp.display_name,'Unknown'), us.current_period_end
		FROM user_subscriptions us
		JOIN users u ON u.id = us.user_id
		JOIN subscription_plans sp ON sp.id = us.plan_id
		WHERE us.status = 'active'
		ORDER BY us.current_period_end ASC
	`)
	if err != nil {
		return result, err
	}
	defer rows.Close()

	for rows.Next() {
		var rec models.RenewalRecord
		rows.Scan(&rec.UserID, &rec.UserName, &rec.Email, &rec.Phone, &rec.PackageName, &rec.ExpiryDate)
		days := int(rec.ExpiryDate.Sub(now).Hours() / 24)
		rec.DaysRemaining = days

		if days < 0 {
			result["expired"] = append(result["expired"], rec)
		} else if days <= 7 {
			result["7_days"] = append(result["7_days"], rec)
		} else if days <= 15 {
			result["15_days"] = append(result["15_days"], rec)
		} else if days <= 30 {
			result["30_days"] = append(result["30_days"], rec)
		}
	}
	return result, nil
}

func (r *AdminRepository) GetActivityLog(page, limit int) ([]models.ActivityRecord, int, error) {
	offset := (page - 1) * limit
	var total int
	r.db.QueryRow(`SELECT COUNT(*) FROM admin_audit_logs`).Scan(&total)

	rows, err := r.db.Query(`
		SELECT al.entity_id, COALESCE(CONCAT(u.first_name,' ',u.last_name), al.admin_name), al.action, al.description, al.created_at
		FROM admin_audit_logs al
		LEFT JOIN users u ON u.id::text = al.entity_id
		ORDER BY al.created_at DESC
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var list []models.ActivityRecord
	for rows.Next() {
		var a models.ActivityRecord
		rows.Scan(&a.UserID, &a.UserName, &a.Action, &a.Details, &a.CreatedAt)
		list = append(list, a)
	}
	if list == nil {
		list = []models.ActivityRecord{}
	}
	return list, total, nil
}

func (r *AdminRepository) CreateDeveloperSession(devAdminID, devAdminName, brokerID, brokerName string) (string, error) {
	var sessionID string
	err := r.db.QueryRow(`
		INSERT INTO developer_admin_sessions (developer_admin_id, developer_admin_name, broker_id, broker_name)
		VALUES ($1,$2,$3,$4)
		RETURNING id
	`, devAdminID, devAdminName, brokerID, brokerName).Scan(&sessionID)
	return sessionID, err
}

func (r *AdminRepository) GetSystemConfig() ([]models.SystemConfig, error) {
	rows, err := r.db.Query(`SELECT key, value, description, updated_at FROM system_config ORDER BY key`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var configs []models.SystemConfig
	for rows.Next() {
		var c models.SystemConfig
		rows.Scan(&c.Key, &c.Value, &c.Description, &c.UpdatedAt)
		configs = append(configs, c)
	}
	if configs == nil {
		configs = []models.SystemConfig{}
	}
	return configs, nil
}

func (r *AdminRepository) UpdateSystemConfig(key, value string) error {
	_, err := r.db.Exec(`UPDATE system_config SET value=$1, updated_at=NOW() WHERE key=$2`, value, key)
	return err
}

func (r *AdminRepository) GetStorageStats() (*models.StorageStats, error) {
	stats := &models.StorageStats{}

	// Count total photos from properties
	var totalPhotos int
	r.db.QueryRow(`SELECT COALESCE(SUM(array_length(photos, 1)),0) FROM properties WHERE deleted_at IS NULL AND photos IS NOT NULL`).Scan(&totalPhotos)
	// Estimate ~0.5 MB per photo
	stats.TotalUsageMB = float64(totalPhotos) * 0.5

	rows, err := r.db.Query(`
		SELECT u.id, CONCAT(u.first_name,' ',u.last_name),
			COALESCE(SUM(array_length(p.photos,1)),0) AS photo_count
		FROM users u
		LEFT JOIN properties p ON p.broker_id = u.id AND p.deleted_at IS NULL
		WHERE u.role IN ('broker','channel_partner')
		GROUP BY u.id, u.first_name, u.last_name
		HAVING COALESCE(SUM(array_length(p.photos,1)),0) > 0
		ORDER BY photo_count DESC
		LIMIT 20
	`)
	if err != nil {
		return stats, nil
	}
	defer rows.Close()

	for rows.Next() {
		var bs models.BrokerStorage
		rows.Scan(&bs.BrokerID, &bs.BrokerName, &bs.PhotoCount)
		bs.UsageMB = float64(bs.PhotoCount) * 0.5
		stats.BrokerWise = append(stats.BrokerWise, bs)
	}
	if stats.BrokerWise == nil {
		stats.BrokerWise = []models.BrokerStorage{}
	}
	return stats, nil
}

func (r *AdminRepository) GetAllBrokersForExport() ([]map[string]interface{}, error) {
	rows, err := r.db.Query(`
		SELECT u.id, u.first_name, u.last_name, u.firm_name, u.email, u.whatsapp_number,
			u.city, u.location, u.created_at, u.is_active,
			COALESCE(sp.display_name,'No Plan'), us.current_period_end
		FROM users u
		LEFT JOIN user_subscriptions us ON us.user_id = u.id AND us.status IN ('active','trialing')
		LEFT JOIN subscription_plans sp ON sp.id = us.plan_id
		WHERE u.role IN ('broker','channel_partner')
		ORDER BY u.created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []map[string]interface{}
	for rows.Next() {
		var id, fname, lname, firm, email, phone, city, loc string
		var createdAt time.Time
		var isActive bool
		var pkg string
		var expiry sql.NullTime
		rows.Scan(&id, &fname, &lname, &firm, &email, &phone, &city, &loc, &createdAt, &isActive, &pkg, &expiry)
		row := map[string]interface{}{
			"id": id, "first_name": fname, "last_name": lname, "firm_name": firm,
			"email": email, "phone": phone, "city": city, "area": loc,
			"registered_at": createdAt.Format("2006-01-02"),
			"package":       pkg, "is_active": isActive,
		}
		if expiry.Valid {
			row["expiry"] = expiry.Time.Format("2006-01-02")
		} else {
			row["expiry"] = ""
		}
		result = append(result, row)
	}
	if result == nil {
		result = []map[string]interface{}{}
	}
	return result, nil
}

func (r *AdminRepository) ExportPropertiesData(brokerID string) ([]map[string]interface{}, error) {
	query := `SELECT id, title, type, listing_type, price, city, status, created_at FROM properties WHERE deleted_at IS NULL`
	args := []interface{}{}
	if brokerID != "" {
		query += ` AND broker_id = $1`
		args = append(args, brokerID)
	}
	query += ` ORDER BY created_at DESC`

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []map[string]interface{}
	for rows.Next() {
		var id, title, ptype, listType, city, status string
		var price float64
		var createdAt time.Time
		rows.Scan(&id, &title, &ptype, &listType, &price, &city, &status, &createdAt)
		result = append(result, map[string]interface{}{
			"id": id, "title": title, "type": ptype, "listing_type": listType,
			"price": price, "city": city, "status": status,
			"created_at": createdAt.Format("2006-01-02"),
		})
	}
	if result == nil {
		result = []map[string]interface{}{}
	}
	return result, nil
}

func (r *AdminRepository) ExportClientsData(clientType, brokerID string) ([]map[string]interface{}, error) {
	query := `SELECT id, first_name, last_name, email, phone, type, city, status, created_at FROM clients WHERE 1=1`
	args := []interface{}{}
	argIdx := 1

	if clientType != "" {
		query += fmt.Sprintf(` AND type = $%d`, argIdx)
		args = append(args, clientType)
		argIdx++
	}
	if brokerID != "" {
		query += fmt.Sprintf(` AND broker_id = $%d`, argIdx)
		args = append(args, brokerID)
		argIdx++
	}
	query += ` ORDER BY created_at DESC`

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []map[string]interface{}
	for rows.Next() {
		var id, fname, lname, email, phone, ctype, city, status string
		var createdAt time.Time
		rows.Scan(&id, &fname, &lname, &email, &phone, &ctype, &city, &status, &createdAt)
		result = append(result, map[string]interface{}{
			"id": id, "first_name": fname, "last_name": lname, "email": email,
			"phone": phone, "type": ctype, "city": city, "status": status,
			"created_at": createdAt.Format("2006-01-02"),
		})
	}
	if result == nil {
		result = []map[string]interface{}{}
	}
	return result, nil
}

func (r *AdminRepository) GetUserByID(id string) (*models.User, error) {
	user := &models.User{}
	err := r.db.QueryRow(`
		SELECT id, first_name, last_name, email, firm_name, role, whatsapp_number, city, state, is_active, created_at, updated_at
		FROM users WHERE id = $1
	`, id).Scan(&user.ID, &user.FirstName, &user.LastName, &user.Email, &user.FirmName, &user.Role, &user.WhatsappNumber, &user.City, &user.State, &user.IsActive, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *AdminRepository) IncrementLoginCount(userID string) {
	r.db.Exec(`UPDATE users SET login_count = COALESCE(login_count,0) + 1, last_login_at = NOW() WHERE id = $1`, userID)
}

