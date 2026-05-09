package middleware

import (
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// CORSMiddleware returns a CORS middleware configured for the application
func CORSMiddleware() gin.HandlerFunc {
	return cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:3000", // React dev server
			"http://localhost:5173", // Vite dev server
			"http://localhost:3001", // Alternative React port
			"http://127.0.0.1:3000",
			"http://127.0.0.1:5173",
			// Production frontend/backend on Render (add your actual URLs)
			"https://enfor-data-ui.onrender.com",
			"https://enfor-data.onrender.com",
		},
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
		// AllowOriginFunc permits origins not explicitly listed above —
		// this enables local-network dev hosts like http://172.18.48.1:3000
		// while keeping stricter rules for production.
		AllowOriginFunc: func(origin string) bool {
			// Allow local network origins
			if strings.HasPrefix(origin, "http://172.") || strings.HasPrefix(origin, "https://172.") {
				return true
			}

			// Allow any Render subdomain (e.g. enfor-data.onrender.com, enfor-data-ui.onrender.com)
			if strings.HasSuffix(origin, ".onrender.com") || strings.HasSuffix(origin, "onrender.com") {
				return true
			}

			return false
		},
		MaxAge:           12 * time.Hour,
	})
}
