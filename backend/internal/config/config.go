package config

import (
	"log"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Database   DatabaseConfig
	JWT        JWTConfig
	Server     ServerConfig
	Upload     UploadConfig
	SMS        SMSConfig
	MSG91      MSG91Config
	Fast2SMS   Fast2SMSConfig
	Razorpay   RazorpayConfig
	Resend     ResendConfig
}

type ResendConfig struct {
	APIKey string
	From   string
}

type DatabaseConfig struct {
	URL      string
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

type JWTConfig struct {
	Secret           string
	ExpiresIn       time.Duration
	RefreshExpiresIn time.Duration
}

type ServerConfig struct {
	Port    string
	GinMode string
}

type UploadConfig struct {
	Path        string
	MaxFileSize int64
}

type SMSConfig struct {
	Provider string // "msg91" or "fast2sms"
}

type MSG91Config struct {
	AuthKey    string
	SenderID   string
	Route      string
	TemplateID string
	Enabled    bool
}

type Fast2SMSConfig struct {
	AuthKey    string
	SenderID   string
	Route      string
	TemplateID string
	Enabled    bool
}

type RazorpayConfig struct {
	KeyID         string
	KeySecret     string
	WebhookSecret string
	Enabled       bool
}

func Load() *Config {
	// Load .env file if it exists
	if err := godotenv.Load("config.env"); err != nil {
		log.Printf("Warning: Could not load config.env file: %v", err)
	}

	// Log key config presence for debugging
	if getEnv("RESEND_API_KEY", "") == "" {
		log.Printf("Warning: RESEND_API_KEY is not set — emails will not be sent")
	} else {
		log.Printf("Info: RESEND_API_KEY loaded, FROM=%s", getEnv("RESEND_FROM", ""))
	}

	// Parse JWT expires duration
	jwtExpiresStr := getEnv("JWT_EXPIRES_IN", "24h")
	jwtExpires, err := time.ParseDuration(jwtExpiresStr)
	if err != nil {
		log.Printf("Invalid JWT_EXPIRES_IN format, using default 24h: %v", err)
		jwtExpires = 24 * time.Hour
	}

	// Parse refresh token expiry duration
	refreshExpiresStr := getEnv("JWT_REFRESH_EXPIRES_IN", "168h") // 7 days default
	refreshExpires, err := time.ParseDuration(refreshExpiresStr)
	if err != nil {
		log.Printf("Invalid JWT_REFRESH_EXPIRES_IN format, using default 7 days: %v", err)
		refreshExpires = 168 * time.Hour
	}

	// Parse max file size
	maxFileSizeStr := getEnv("MAX_FILE_SIZE", "5242880") // 5MB default
	maxFileSize, err := strconv.ParseInt(maxFileSizeStr, 10, 64)
	if err != nil {
		log.Printf("Invalid MAX_FILE_SIZE format, using default 5MB: %v", err)
		maxFileSize = 5242880
	}

	return &Config{
		Database: DatabaseConfig{
			URL:      getEnv("DATABASE_URL", ""),
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "backend"),
			Password: getEnv("DB_PASSWORD", "enfor_data"),
			DBName:   getEnv("DB_NAME", "enfor_data"),
			SSLMode:  getEnv("DB_SSL_MODE", "disable"),
		},
		JWT: JWTConfig{
			Secret:           getEnv("JWT_SECRET", "your-super-secret-jwt-key"),
			ExpiresIn:        jwtExpires,
			RefreshExpiresIn: refreshExpires,
		},
		Server: ServerConfig{
			Port:    getEnv("PORT", "8080"),
			GinMode: getEnv("GIN_MODE", "debug"),
		},
		Upload: UploadConfig{
			Path:        getEnv("UPLOAD_PATH", "./uploads"),
			MaxFileSize: maxFileSize,
		},
		SMS: SMSConfig{
			Provider: getEnv("SMS_PROVIDER", "msg91"), // Default to msg91
		},
		MSG91: MSG91Config{
			AuthKey:    getEnv("MSG91_AUTH_KEY", ""),
			SenderID:   getEnv("MSG91_SENDER_ID", ""),
			Route:      getEnv("MSG91_ROUTE", "4"),
			TemplateID: getEnv("MSG91_TEMPLATE_ID", ""),
			Enabled:    getEnv("MSG91_ENABLED", "false") == "true",
		},
		Fast2SMS: Fast2SMSConfig{
			AuthKey:    getEnv("FAST2SMS_AUTH_KEY", ""),
			SenderID:   getEnv("FAST2SMS_SENDER_ID", ""),
			Route:      getEnv("FAST2SMS_ROUTE", "dlt"),
			TemplateID: getEnv("FAST2SMS_TEMPLATE_ID", ""),
			Enabled:    getEnv("FAST2SMS_ENABLED", "false") == "true",
		},
		Razorpay: RazorpayConfig{
			KeyID:         getEnv("RAZORPAY_KEY_ID", ""),
			KeySecret:     getEnv("RAZORPAY_KEY_SECRET", ""),
			WebhookSecret: getEnv("RAZORPAY_WEBHOOK_SECRET", ""),
			Enabled:       getEnv("RAZORPAY_ENABLED", "false") == "true",
		},
		Resend: ResendConfig{
			APIKey: getEnv("RESEND_API_KEY", ""),
			From:   getEnv("RESEND_FROM", "info@enfordata.com"),
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
