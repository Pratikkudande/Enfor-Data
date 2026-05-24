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
	if err := db.RunWhatsAppMigrations(); err != nil {
		log.Fatal("Failed to run WhatsApp migrations:", err)
	}
	if err := db.RunSMSMarketingMigrations(); err != nil {
		log.Fatal("Failed to run SMS Marketing migrations:", err)
	}
	if err := db.RunSubscriptionMigrations(); err != nil {
		log.Fatal("Failed to run Subscription migrations:", err)
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	propertyRepo := repository.NewPropertyRepository(db)
	clientRepo := repository.NewClientRepository(db)
	appointmentRepo := repository.NewAppointmentRepository(db)
	networkRepo := repository.NewNetworkRepository(db)
	whatsappRepo := repository.NewWhatsAppRepository(db)
	smsMarketingRepo := repository.NewSMSMarketingRepository(db)
	otpRepo := repository.NewOTPRepository(db)
	subscriptionRepo := repository.NewSubscriptionRepository(db)
	paymentRepo := repository.NewPaymentRepository(db)
	agreementRepo := repository.NewAgreementRepository(db)
	projectRepo := repository.NewProjectRepository(db)

	// Initialize services
	smsService := service.NewSMSService(cfg)
	authService := service.NewAuthService(userRepo, cfg)
	propertyService := service.NewPropertyService(propertyRepo, clientRepo, userRepo)
	clientService := service.NewClientService(clientRepo, userRepo)
	appointmentService := service.NewAppointmentService(appointmentRepo, clientRepo, propertyRepo, userRepo, smsService)
	networkService := service.NewNetworkService(networkRepo, userRepo)
	whatsappService := service.NewWhatsAppService(whatsappRepo, clientRepo)
	whatsappSetupService := service.NewMetaWhatsAppSetupService(whatsappRepo)
	smsMarketingService := service.NewSMSMarketingService(smsMarketingRepo, clientRepo, smsService)
	otpService := service.NewOTPService(otpRepo, userRepo, smsService)
	subscriptionService := service.NewSubscriptionService(subscriptionRepo, userRepo)
	paymentService := service.NewPaymentService(paymentRepo, subscriptionRepo, userRepo, cfg)
	agreementService := service.NewAgreementService(agreementRepo, propertyRepo, clientRepo)
	projectService := service.NewProjectService(projectRepo)
	
	// Initialize appointment reminder service
	reminderService := service.NewAppointmentReminderService(appointmentRepo, clientRepo, userRepo, smsService)
	reminderService.Start() // Start the background reminder scheduler

	// Initialize WebSocket hub
	hub := ws.NewHub()

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authService)
	uploadHandler := handler.NewUploadHandler(authService, cfg, clientService, propertyService)
	propertyHandler := handler.NewPropertyHandler(propertyService)
	clientHandler := handler.NewClientHandler(clientService)
	appointmentHandler := handler.NewAppointmentHandler(appointmentService)
	networkHandler := handler.NewNetworkHandler(networkService, hub)
	whatsappHandler := handler.NewWhatsAppHandler(whatsappService, whatsappSetupService)
	smsMarketingHandler := handler.NewSMSMarketingHandler(smsMarketingService)
	otpHandler := handler.NewOTPHandler(otpService)
	subscriptionHandler := handler.NewSubscriptionHandler(subscriptionService)
	paymentHandler := handler.NewPaymentHandler(paymentService, subscriptionService)
	agreementHandler := handler.NewAgreementHandler(agreementService)
	projectHandler := handler.NewProjectHandler(projectService)

	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(authService)
	// subscriptionMiddleware := middleware.NewSubscriptionMiddleware(subscriptionService) // For future feature gating

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
		// Public platform stats (used by landing page — no auth required)
		api.GET("/stats", func(c *gin.Context) {
			var brokerCount, propertyCount, clientCount int
			db.QueryRow(`SELECT COUNT(*) FROM users WHERE role IN ('broker','channel_partner') AND is_active = TRUE`).Scan(&brokerCount)
			db.QueryRow(`SELECT COUNT(*) FROM properties WHERE deleted_at IS NULL`).Scan(&propertyCount)
			db.QueryRow(`SELECT COUNT(*) FROM clients`).Scan(&clientCount)
			c.JSON(http.StatusOK, gin.H{
				"brokers":    brokerCount,
				"properties": propertyCount,
				"clients":    clientCount,
			})
		})

		// Authentication routes (public)
		auth := api.Group("/auth")
		{
			auth.POST("/signup", authHandler.Signup)
			auth.POST("/login", authHandler.Login)
			auth.POST("/logout", authHandler.Logout)
			// OTP routes (public)
			auth.POST("/send-otp", otpHandler.SendOTP)
			auth.POST("/verify-otp", otpHandler.VerifyOTP)
			auth.POST("/resend-otp", otpHandler.ResendOTP)
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

			// ── WhatsApp Marketing ────────────────────────────────────────────
			whatsapp := protected.Group("/whatsapp")
			{
				// Setup & Onboarding
				whatsapp.POST("/setup/business", whatsappHandler.InitializeBusinessSetup)
				whatsapp.POST("/setup/request-verification", whatsappHandler.RequestVerificationCode)
				whatsapp.POST("/setup/verify-phone", whatsappHandler.VerifyPhoneNumber)
				whatsapp.POST("/setup/connect-meta-api", whatsappHandler.ConnectMetaAPI)
				whatsapp.GET("/setup/status", whatsappHandler.GetSetupStatus)
				whatsapp.POST("/setup/resend-code", whatsappHandler.ResendVerificationCode)

				// Account Management
				whatsapp.GET("/account", whatsappHandler.GetAccount)
				whatsapp.POST("/connect", whatsappHandler.ConnectAccount)
				whatsapp.POST("/disconnect", whatsappHandler.DisconnectAccount)

				// Message Sending
				whatsapp.POST("/send", whatsappHandler.SendMessage)

				// Campaign Management
				whatsapp.POST("/campaigns", whatsappHandler.CreateCampaign)
				whatsapp.GET("/campaigns", whatsappHandler.GetCampaigns)
				whatsapp.GET("/campaigns/:id", whatsappHandler.GetCampaignDetails)
				whatsapp.POST("/campaigns/:id/send", whatsappHandler.SendCampaign)

				// Templates
				whatsapp.GET("/templates", whatsappHandler.GetTemplates)
				whatsapp.POST("/templates", whatsappHandler.CreateTemplate)
				whatsapp.DELETE("/templates/:id", whatsappHandler.DeleteTemplate)

				// Analytics
				whatsapp.GET("/logs", whatsappHandler.GetMessageLogs)
			}

			// ── SMS Marketing ────────────────────────────────────────────
			smsMarketing := protected.Group("/sms-marketing")
			{
				// Account Management
				smsMarketing.GET("/account", smsMarketingHandler.GetAccount)
				smsMarketing.POST("/connect", smsMarketingHandler.ConnectAccount)
				smsMarketing.POST("/disconnect", smsMarketingHandler.DisconnectAccount)

				// Message Sending
				smsMarketing.POST("/send", smsMarketingHandler.SendMessage)
				smsMarketing.POST("/send-bulk", smsMarketingHandler.SendBulkMessage)

				// Campaign Management
				smsMarketing.POST("/campaigns", smsMarketingHandler.CreateCampaign)
				smsMarketing.GET("/campaigns", smsMarketingHandler.GetCampaigns)
				smsMarketing.GET("/campaigns/:id", smsMarketingHandler.GetCampaignDetails)
				smsMarketing.POST("/campaigns/:id/send", smsMarketingHandler.SendCampaign)

				// Templates
				smsMarketing.GET("/templates", smsMarketingHandler.GetTemplates)
				smsMarketing.POST("/templates", smsMarketingHandler.CreateTemplate)
				smsMarketing.DELETE("/templates/:id", smsMarketingHandler.DeleteTemplate)

				// Analytics
				smsMarketing.GET("/logs", smsMarketingHandler.GetMessageLogs)
				smsMarketing.GET("/stats", smsMarketingHandler.GetStats)
			}

			// ── Subscriptions ────────────────────────────────────────────
			subscriptions := protected.Group("/subscriptions")
			{
				// User Subscription (protected)
				subscriptions.GET("/current", subscriptionHandler.GetCurrentSubscription)
				subscriptions.GET("/status", subscriptionHandler.GetSubscriptionStatus)
				subscriptions.POST("/activate-trial", subscriptionHandler.ActivateTrial)
				subscriptions.POST("/cancel", subscriptionHandler.CancelSubscription)

				// Feature Access (protected)
				subscriptions.GET("/features/:feature/access", subscriptionHandler.CheckFeatureAccess)
				subscriptions.GET("/features/:feature/limit", subscriptionHandler.CheckFeatureLimit)
				subscriptions.GET("/usage", subscriptionHandler.GetFeatureUsage)
			}

			// ── Payments ────────────────────────────────────────────
			payments := protected.Group("/payments")
			{
				payments.POST("/create-order", paymentHandler.CreateSubscriptionOrder)
				payments.POST("/verify", paymentHandler.VerifyPayment)
				payments.GET("/history", paymentHandler.GetPaymentHistory)
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

		// Razorpay webhook (public)
		api.POST("/payments/webhook", paymentHandler.RazorpayWebhook)

		// ── Public Subscription Plans ────────────────────────────────────────────
		// These endpoints are public so users can view pricing without authentication
		publicSubscriptions := api.Group("/subscriptions")
		{
			// Plans (public access)
			publicSubscriptions.GET("/plans", subscriptionHandler.GetAllPlans)
			publicSubscriptions.GET("/plans/compare", subscriptionHandler.ComparePlans)
			publicSubscriptions.GET("/plans/:id", subscriptionHandler.GetPlanByID)
			publicSubscriptions.GET("/plans/slug/:slug", subscriptionHandler.GetPlanBySlug)
		}

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
