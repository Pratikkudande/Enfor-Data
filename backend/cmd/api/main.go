package main

import (
	"log"
	"net/http"

	"enfor-data-backend/internal/config"
	"enfor-data-backend/internal/database"
	"enfor-data-backend/internal/handler"
	"enfor-data-backend/internal/middleware"
	"enfor-data-backend/internal/repository"
	"enfor-data-backend/internal/service"
	ws "enfor-data-backend/internal/websocket"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Set Gin mode
	gin.SetMode(cfg.Server.GinMode)

	// Initialize database connection
	db, err := database.NewConnection(cfg)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Run database migrations
	if err := db.RunMigrations(); err != nil {
		log.Fatal("Failed to run migrations:", err)
	}
	if err := db.RunNetworkMigrations(); err != nil {
		log.Fatal("Failed to run network migrations:", err)
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	propertyRepo := repository.NewPropertyRepository(db)
	clientRepo := repository.NewClientRepository(db)
	appointmentRepo := repository.NewAppointmentRepository(db)
	networkRepo := repository.NewNetworkRepository(db)

	// Initialize services
	authService := service.NewAuthService(userRepo, cfg)
	propertyService := service.NewPropertyService(propertyRepo, clientRepo, userRepo)
	clientService := service.NewClientService(clientRepo, userRepo)
	appointmentService := service.NewAppointmentService(appointmentRepo, clientRepo, propertyRepo)
	networkService := service.NewNetworkService(networkRepo, userRepo)

	// Initialize WebSocket hub
	hub := ws.NewHub()

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authService)
	uploadHandler := handler.NewUploadHandler(authService, cfg)
	propertyHandler := handler.NewPropertyHandler(propertyService)
	clientHandler := handler.NewClientHandler(clientService)
	appointmentHandler := handler.NewAppointmentHandler(appointmentService)
	networkHandler := handler.NewNetworkHandler(networkService, hub)

	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(authService)

	// Initialize Gin router
	router := gin.New()

	// Global middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(middleware.CORSMiddleware())

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"service": "enfor-data-backend",
			"version": "1.0.0",
		})
	})

	// API routes
	api := router.Group("/api")
	{
		// Authentication routes (public)
		auth := api.Group("/auth")
		{
			auth.POST("/signup", authHandler.Signup)
			auth.POST("/login", authHandler.Login)
			auth.POST("/logout", authHandler.Logout)
			// Protected auth routes
			auth.GET("/me", authMiddleware.RequireAuth(), authHandler.GetMe)
			auth.POST("/refresh", authHandler.RefreshToken)
		}

		protected := api.Group("/")
		protected.Use(authMiddleware.RequireAuth())
		{
			// File upload routes
			protected.POST("/upload/profile-photo", uploadHandler.UploadProfilePhoto)

			// Property routes (accessible to all authenticated users)
			protected.GET("/properties/all", propertyHandler.GetAllProperties)
			protected.GET("/properties/view/:id", propertyHandler.GetAnyProperty)
			protected.GET("/properties", propertyHandler.GetProperties)
			protected.POST("/properties", propertyHandler.CreateProperty)
			protected.GET("/properties/:id", propertyHandler.GetProperty)
			protected.PUT("/properties/:id", propertyHandler.UpdateProperty)
			protected.DELETE("/properties/:id", propertyHandler.DeleteProperty)

			// Client routes (accessible to all authenticated users)
			protected.GET("/clients", clientHandler.GetClients)
			protected.POST("/clients", clientHandler.CreateClient)
			protected.GET("/clients/:id", clientHandler.GetClient)
			protected.PUT("/clients/:id", clientHandler.UpdateClient)
			protected.DELETE("/clients/:id", clientHandler.DeleteClient)

			// Appointment routes (accessible to all authenticated users)
			protected.POST("/appointments", appointmentHandler.CreateAppointment)
			protected.GET("/appointments", appointmentHandler.GetAppointments)
			protected.GET("/appointments/stats", appointmentHandler.GetAppointmentStats)
			protected.GET("/appointments/:id", appointmentHandler.GetAppointment)
			protected.PUT("/appointments/:id", appointmentHandler.UpdateAppointment)
			protected.DELETE("/appointments/:id", appointmentHandler.DeleteAppointment)

			// ── Broker Network ────────────────────────────────────────────────
			network := protected.Group("/network")
			{
				// Discovery
				network.GET("/brokers", networkHandler.GetAllBrokers)

				// Connections
				network.POST("/connect/send", networkHandler.SendRequest)
				network.POST("/connect/respond", networkHandler.RespondRequest)
				network.GET("/connections", networkHandler.GetConnections)
				network.GET("/requests", networkHandler.GetPendingRequests)
				network.GET("/requests/sent", networkHandler.GetSentRequests)

				// Messaging (REST fallback)
				network.GET("/conversations", networkHandler.GetConversations)
				network.GET("/conversations/:id/messages", networkHandler.GetMessages)
				network.POST("/conversations/:id/messages", networkHandler.SendMessage)

				// WebSocket
				network.GET("/ws", networkHandler.WebSocketHandler)
			}

			// Role-specific routes
			broker := protected.Group("/broker")
			broker.Use(authMiddleware.RequireRole("broker"))
			{
				broker.GET("/dashboard", func(c *gin.Context) {
					c.JSON(http.StatusOK, gin.H{
						"message": "Broker dashboard",
						"user_id": c.GetString("user_id"),
					})
				})
			}

			channelPartner := protected.Group("/channel-partner")
			channelPartner.Use(authMiddleware.RequireRole("channel_partner"))
			{
				channelPartner.GET("/dashboard", func(c *gin.Context) {
					c.JSON(http.StatusOK, gin.H{
						"message": "Channel Partner dashboard",
						"user_id": c.GetString("user_id"),
					})
				})
			}

			admin := protected.Group("/admin")
			admin.Use(authMiddleware.RequireRole("admin"))
			{
				admin.GET("/dashboard", func(c *gin.Context) {
					c.JSON(http.StatusOK, gin.H{
						"message": "Admin dashboard",
						"user_id": c.GetString("user_id"),
					})
				})
			}
		}

		// File serving routes (public for uploaded files)
		api.GET("/uploads/:filename", uploadHandler.ServeUploadedFile)
	}

	// Start server
	log.Printf("Server starting on port %s", cfg.Server.Port)
	if cfg.Database.URL != "" {
		log.Printf("Database connected using DATABASE_URL")
	} else {
		log.Printf("Database connected to %s:%s/%s", cfg.Database.Host, cfg.Database.Port, cfg.Database.DBName)
	}
	log.Printf("Upload path: %s", cfg.Upload.Path)

	if err := router.Run(":" + cfg.Server.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
