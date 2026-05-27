package middleware

import (
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// CORSMiddleware returns a CORS middleware configured for the application.
// Add extra allowed origins via the ALLOWED_ORIGINS env var (comma-separated).
func CORSMiddleware() gin.HandlerFunc {
	// Base origins always allowed
	allowedOrigins := []string{
		// Local development
		"http://localhost:3000",
		"http://localhost:5173",
		"http://localhost:3001",
		"http://127.0.0.1:3000",
		"http://127.0.0.1:5173",
		// Render subdomains
		"https://enfor-data-ui.onrender.com",
		"https://enfor-data.onrender.com",
		// Custom domain
		"https://enfordata.com",
		"https://www.enfordata.com",
	}

	// Append any extra origins from environment variable
	// e.g. ALLOWED_ORIGINS=https://enfordata.com,https://www.enfordata.com
	if extra := os.Getenv("ALLOWED_ORIGINS"); extra != "" {
		for _, o := range strings.Split(extra, ",") {
			o = strings.TrimSpace(o)
			if o != "" {
				allowedOrigins = append(allowedOrigins, o)
			}
		}
	}

	return cors.New(cors.Config{
		AllowOrigins: allowedOrigins,
		AllowMethods: []string{
			"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS",
		},
		AllowHeaders: []string{
			"Origin",
			"Content-Length",
			"Content-Type",
			"Authorization",
			"X-Requested-With",
			"Accept",
			"Accept-Encoding",
			"Accept-Language",
			"Connection",
			"Host",
		},
		ExposeHeaders: []string{
			"Content-Length",
			"Content-Type",
		},
		AllowCredentials: true,
		AllowOriginFunc: func(origin string) bool {
			// Allow local network origins (dev)
			if strings.HasPrefix(origin, "http://172.") || strings.HasPrefix(origin, "https://172.") {
				return true
			}
			// Allow any Render subdomain
			if strings.HasSuffix(origin, ".onrender.com") {
				return true
			}
			// Allow custom domain and any subdomains
			if origin == "https://enfordata.com" ||
				strings.HasSuffix(origin, ".enfordata.com") {
				return true
			}
			return false
		},
		MaxAge: 12 * time.Hour,
	})
}
