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

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	propertyRepo := repository.NewPropertyRepository(db)
	clientRepo := repository.NewClientRepository(db)
	appointmentRepo := repository.NewAppointmentRepository(db)
	agreementRepo := repository.NewAgreementRepository(db)
	projectRepo := repository.NewProjectRepository(db)

	// Initialize services
	authService := service.NewAuthService(userRepo, cfg)
	propertyService := service.NewPropertyService(propertyRepo, clientRepo, userRepo)
	clientService := service.NewClientService(clientRepo, userRepo)
	appointmentService := service.NewAppointmentService(appointmentRepo, clientRepo, propertyRepo)
	agreementService := service.NewAgreementService(agreementRepo, propertyRepo, clientRepo)
	projectService := service.NewProjectService(projectRepo)

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authService)
	uploadHandler := handler.NewUploadHandler(authService, cfg, clientService, propertyService)
	propertyHandler := handler.NewPropertyHandler(propertyService)
	clientHandler := handler.NewClientHandler(clientService)
	appointmentHandler := handler.NewAppointmentHandler(appointmentService)
	agreementHandler := handler.NewAgreementHandler(agreementService)
	projectHandler := handler.NewProjectHandler(projectService)

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
			protected.POST("/upload/clients-excel", uploadHandler.UploadClientsExcel)
			protected.POST("/upload/properties-excel", uploadHandler.UploadPropertiesExcel)

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

			// Agreement routes (accessible to all authenticated users)
			protected.POST("/agreements", agreementHandler.CreateAgreement)
			protected.GET("/agreements", agreementHandler.GetAgreements)
			protected.GET("/agreements/:id", agreementHandler.GetAgreement)
			protected.PUT("/agreements/:id", agreementHandler.UpdateAgreement)
			protected.DELETE("/agreements/:id", agreementHandler.DeleteAgreement)

			// Project routes
			protected.GET("/projects/all", projectHandler.GetAllProjects)
			protected.GET("/projects", projectHandler.GetMyProjects)
			protected.POST("/projects", projectHandler.CreateProject)
			protected.GET("/projects/:id", projectHandler.GetProject)
			protected.PUT("/projects/:id", projectHandler.UpdateProject)
			protected.DELETE("/projects/:id", projectHandler.DeleteProject)

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
		// Sample download templates
		api.GET("/download/clients-sample", uploadHandler.DownloadClientsSample)
		api.GET("/download/properties-sample", uploadHandler.DownloadPropertiesSample)
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
