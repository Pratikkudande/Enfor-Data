package models

import "time"

type AdminDashboardStats struct {
	ActiveUsers         int     `json:"active_users"`
	TotalRevenue        float64 `json:"total_revenue"`
	NewRegistrations    int     `json:"new_registrations"`
	PropertiesAdded     int     `json:"properties_added"`
	SMSUsage            int     `json:"sms_usage"`
	RenewalsDue         int     `json:"renewals_due"`
	FeedbackCount       int     `json:"feedback_count"`
	BrokerNetworkGrowth int     `json:"broker_network_growth"`
}

type TrendPoint struct {
	Label string  `json:"label"`
	Value float64 `json:"value"`
}

type AdminAnalytics struct {
	RegistrationTrend []TrendPoint `json:"registration_trend"`
	RevenueTrend      []TrendPoint `json:"revenue_trend"`
	PropertyTrend     []TrendPoint `json:"property_trend"`
	SMSTrend          []TrendPoint `json:"sms_trend"`
	RenewalTrend      []TrendPoint `json:"renewal_trend"`
}

type BrokerListItem struct {
	ID              string     `json:"id"`
	FirstName       string     `json:"first_name"`
	LastName        string     `json:"last_name"`
	FirmName        string     `json:"firm_name"`
	WhatsappNumber  string     `json:"whatsapp_number"`
	Email           string     `json:"email"`
	City            string     `json:"city"`
	Location        string     `json:"location"`
	CreatedAt       time.Time  `json:"created_at"`
	PackageName     string     `json:"package_name"`
	PackageExpiry   *time.Time `json:"package_expiry"`
	IsActive        bool       `json:"is_active"`
	IsBlocked       bool       `json:"is_blocked"`
	LastLoginAt     *time.Time `json:"last_login_at"`
	LoginCount      int        `json:"login_count"`
	PropertiesCount int        `json:"properties_count"`
	ClientsCount    int        `json:"clients_count"`
	AgreementsCount int        `json:"agreements_count"`
	SMSUsed         int        `json:"sms_used"`
}

type BrokerActivity struct {
	LastLoginAt     *time.Time `json:"last_login_at"`
	LoginCount      int        `json:"login_count"`
	PropertiesCount int        `json:"properties_count"`
	ClientsCount    int        `json:"clients_count"`
	AgreementsCount int        `json:"agreements_count"`
	SMSUsed         int        `json:"sms_used"`
}

type RevenueStats struct {
	TotalRevenue        float64 `json:"total_revenue"`
	MonthlyRevenue      float64 `json:"monthly_revenue"`
	YearlyRevenue       float64 `json:"yearly_revenue"`
	PendingRenewalValue float64 `json:"pending_renewal_value"`
	RenewalsDue30Days   int     `json:"renewals_due_30_days"`
}

type SubscriptionRecord struct {
	UserID        string     `json:"user_id"`
	UserName      string     `json:"user_name"`
	Email         string     `json:"email"`
	PackageName   string     `json:"package_name"`
	AmountPaid    float64    `json:"amount_paid"`
	PaymentDate   *time.Time `json:"payment_date"`
	RenewalDate   *time.Time `json:"renewal_date"`
	TransactionID string     `json:"transaction_id"`
	Status        string     `json:"status"`
}

type SMSStats struct {
	TotalPurchased   int              `json:"total_purchased"`
	TotalUsed        int              `json:"total_used"`
	Remaining        int              `json:"remaining"`
	BrokerWiseUsage  []BrokerSMSUsage `json:"broker_wise_usage"`
}

type BrokerSMSUsage struct {
	BrokerID   string `json:"broker_id"`
	BrokerName string `json:"broker_name"`
	Allocated  int    `json:"allocated"`
	Used       int    `json:"used"`
	Remaining  int    `json:"remaining"`
}

type AuditLog struct {
	ID          string    `json:"id"`
	AdminID     string    `json:"admin_id"`
	AdminName   string    `json:"admin_name"`
	Action      string    `json:"action"`
	EntityType  string    `json:"entity_type"`
	EntityID    string    `json:"entity_id"`
	Description string    `json:"description"`
	IPAddress   string    `json:"ip_address"`
	CreatedAt   time.Time `json:"created_at"`
}

type Announcement struct {
	ID          string     `json:"id"`
	AdminID     string     `json:"admin_id"`
	Title       string     `json:"title"`
	Message     string     `json:"message"`
	Type        string     `json:"type"`
	Target      string     `json:"target"`
	TargetValue string     `json:"target_value"`
	Status      string     `json:"status"`
	SentAt      *time.Time `json:"sent_at"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type Feedback struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	UserName    string    `json:"user_name"`
	Type        string    `json:"type"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	AdminNotes  string    `json:"admin_notes"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type RenewalRecord struct {
	UserID        string    `json:"user_id"`
	UserName      string    `json:"user_name"`
	Email         string    `json:"email"`
	Phone         string    `json:"phone"`
	PackageName   string    `json:"package_name"`
	ExpiryDate    time.Time `json:"expiry_date"`
	DaysRemaining int       `json:"days_remaining"`
}

type ActivityRecord struct {
	UserID    string    `json:"user_id"`
	UserName  string    `json:"user_name"`
	Action    string    `json:"action"`
	Details   string    `json:"details"`
	CreatedAt time.Time `json:"created_at"`
}

type DeveloperAdminSession struct {
	ID                 string     `json:"id"`
	DeveloperAdminID   string     `json:"developer_admin_id"`
	DeveloperAdminName string     `json:"developer_admin_name"`
	BrokerID           string     `json:"broker_id"`
	BrokerName         string     `json:"broker_name"`
	LoginAt            time.Time  `json:"login_at"`
	LogoutAt           *time.Time `json:"logout_at"`
}

type SystemConfig struct {
	Key         string    `json:"key"`
	Value       string    `json:"value"`
	Description string    `json:"description"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type StorageStats struct {
	TotalUsageMB   float64            `json:"total_usage_mb"`
	BrokerWise     []BrokerStorage    `json:"broker_wise"`
}

type BrokerStorage struct {
	BrokerID   string  `json:"broker_id"`
	BrokerName string  `json:"broker_name"`
	UsageMB    float64 `json:"usage_mb"`
	PhotoCount int     `json:"photo_count"`
}
