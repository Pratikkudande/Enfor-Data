package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"time"

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
	if err := db.RunBuildingMigrations(); err != nil {
		log.Fatal("Failed to run Building migrations:", err)
	}
	if err := db.RunExternalBrokerMigrations(); err != nil {
		log.Fatal("Failed to run External Broker migrations:", err)
	}
	if err := db.RunBusinessPostsMigrations(); err != nil {
		log.Fatal("Failed to run Business Posts migrations:", err)
	}
	if err := db.RunAdminMigrations(); err != nil {
		log.Fatal("Failed to run Admin migrations:", err)
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	propertyRepo := repository.NewPropertyRepository(db)
	clientRepo := repository.NewClientRepository(db)
	clientRequirementRepo := repository.NewClientRequirementRepository(db)
	appointmentRepo := repository.NewAppointmentRepository(db)
	networkRepo := repository.NewNetworkRepository(db)
	notificationRepo := repository.NewNotificationRepository(db)
	whatsappRepo := repository.NewWhatsAppRepository(db)
	smsMarketingRepo := repository.NewSMSMarketingRepository(db)
	otpRepo := repository.NewOTPRepository(db)
	subscriptionRepo := repository.NewSubscriptionRepository(db)
	paymentRepo := repository.NewPaymentRepository(db)
	agreementRepo := repository.NewAgreementRepository(db)
	projectRepo := repository.NewProjectRepository(db)
	buildingRepo := repository.NewBuildingRepository(db)
	externalBrokerRepo := repository.NewExternalBrokerRepository(db)
	businessPostRepo := repository.NewBusinessPostRepository(db)
	staffRepo := repository.NewStaffRepository(db)
	adminRepo := repository.NewAdminRepository(db)

	// Initialize services
	smsService := service.NewSMSService(cfg)
	emailService := service.NewEmailService(cfg)
	passwordResetService := service.NewPasswordResetService(userRepo, emailService)
	authService := service.NewAuthService(userRepo, subscriptionRepo, cfg)
	propertyService := service.NewPropertyService(propertyRepo, clientRepo, userRepo)
	clientService := service.NewClientService(clientRepo, userRepo)
	appointmentService := service.NewAppointmentService(appointmentRepo, clientRepo, propertyRepo, userRepo, smsService)
	networkService := service.NewNetworkService(networkRepo, userRepo)
	notificationService := service.NewNotificationService(notificationRepo, networkRepo, userRepo)
	whatsappService := service.NewWhatsAppService(whatsappRepo, clientRepo)
	whatsappSetupService := service.NewMetaWhatsAppSetupService(whatsappRepo)
	smsMarketingService := service.NewSMSMarketingService(smsMarketingRepo, clientRepo, buildingRepo, propertyRepo, smsService, cfg)
	otpService := service.NewOTPService(otpRepo, userRepo, smsService)
	subscriptionService := service.NewSubscriptionService(subscriptionRepo, userRepo)
	paymentService := service.NewPaymentService(paymentRepo, subscriptionRepo, userRepo, cfg)
	agreementService := service.NewAgreementService(agreementRepo, propertyRepo, clientRepo)
	projectService := service.NewProjectService(projectRepo)
	buildingService := service.NewBuildingService(buildingRepo, userRepo)
	externalBrokerService := service.NewExternalBrokerService(externalBrokerRepo, userRepo)
	businessPostService := service.NewBusinessPostService(businessPostRepo)
	staffService := service.NewStaffService(staffRepo)
	adminService := service.NewAdminService(adminRepo, userRepo, authService)
	adminService.SetSMSMarketingRepo(smsMarketingRepo) // Set SMS marketing repo for DLT template management
	adminService.SetSMSMarketingService(smsMarketingService) // Set SMS marketing service for provider info
	
	// Initialize appointment reminder service
	reminderService := service.NewAppointmentReminderService(appointmentRepo, clientRepo, userRepo, smsService)
	reminderService.Start() // Start the background reminder scheduler

	// Initialize WebSocket hub
	hub := ws.NewHub()

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authService, passwordResetService)
	uploadHandler := handler.NewUploadHandler(authService, cfg, clientService, propertyService, buildingService, clientRequirementRepo, externalBrokerService)
	propertyHandler := handler.NewPropertyHandler(propertyService, notificationService)
	notificationHandler := handler.NewNotificationHandler(notificationService)
	clientHandler := handler.NewClientHandler(clientService)
	clientRequirementHandler := handler.NewClientRequirementHandler(clientRequirementRepo)
	appointmentHandler := handler.NewAppointmentHandler(appointmentService)
	networkHandler := handler.NewNetworkHandler(networkService, hub)
	whatsappHandler := handler.NewWhatsAppHandler(whatsappService, whatsappSetupService)
	smsMarketingHandler := handler.NewSMSMarketingHandler(smsMarketingService)
	otpHandler := handler.NewOTPHandler(otpService)
	subscriptionHandler := handler.NewSubscriptionHandler(subscriptionService)
	paymentHandler := handler.NewPaymentHandler(paymentService, subscriptionService)
	agreementHandler := handler.NewAgreementHandler(agreementService)
	projectHandler := handler.NewProjectHandler(projectService, notificationService)
	buildingHandler := handler.NewBuildingHandler(buildingService)
	externalBrokerHandler := handler.NewExternalBrokerHandler(externalBrokerService)
	businessPostHandler := handler.NewBusinessPostHandler(businessPostService)
	staffHandler := handler.NewStaffHandler(staffService)
	adminHandler := handler.NewAdminHandler(adminService)

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

		// Contact form (public — no auth required)
		api.POST("/contact", func(c *gin.Context) {
			var body struct {
				Name    string `json:"name"    binding:"required"`
				Email   string `json:"email"   binding:"required"`
				Phone   string `json:"phone"`
				Message string `json:"message" binding:"required"`
			}
			if err := c.ShouldBindJSON(&body); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "name, email and message are required"})
				return
			}
			// Persist the submission so admins can view it, then notify by email.
			if _, err := db.Exec(
				`INSERT INTO contact_messages (name, email, phone, message) VALUES ($1, $2, $3, $4)`,
				body.Name, body.Email, body.Phone, body.Message,
			); err != nil {
				log.Printf("Failed to save contact message: %v", err)
			}
			go emailService.SendContactEmail(body.Name, body.Email, body.Phone, body.Message)
			c.JSON(http.StatusOK, gin.H{"message": "Thank you! We'll be in touch shortly."})
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
			auth.POST("/forgot-password", authHandler.ForgotPassword)
			auth.POST("/reset-password", authHandler.ResetPassword)
			// Protected auth routes
			auth.GET("/me", authMiddleware.RequireAuth(), authHandler.GetMe)
			auth.POST("/refresh", authHandler.RefreshToken)
		}

		protected := api.Group("/")
		protected.Use(authMiddleware.RequireAuth())
		{
			// Profile routes
			protected.PUT("/profile/update", authHandler.UpdateProfile)
			protected.POST("/profile/change-password", authHandler.ChangePassword)

			// ── User Settings (notifications / privacy / preferences) ───────
			// Sensible defaults returned when the user hasn't saved settings yet.
			defaultSettings := func() map[string]interface{} {
				return map[string]interface{}{
					"notifications": map[string]interface{}{
						"emailNotifications": true, "smsNotifications": false, "pushNotifications": true,
						"appointmentReminders": true, "propertyUpdates": true, "projectUpdates": true,
						"marketingEmails": false, "weeklyReports": true,
					},
					"privacy": map[string]interface{}{
						"profileVisibility": "network", "showEmail": false, "showPhone": true,
						"allowDirectMessages": true, "showOnlineStatus": true,
					},
					"preferences": map[string]interface{}{
						"theme": "light", "language": "en", "timezone": "Asia/Kolkata",
						"dateFormat": "DD/MM/YYYY", "currency": "INR",
					},
				}
			}

			protected.GET("/settings", func(c *gin.Context) {
				userID := c.GetString("user_id")
				var raw sql.NullString
				db.QueryRow(`SELECT settings::text FROM users WHERE id=$1`, userID).Scan(&raw)
				settings := defaultSettings()
				if raw.Valid && raw.String != "" {
					_ = json.Unmarshal([]byte(raw.String), &settings)
				}
				c.JSON(http.StatusOK, gin.H{"success": true, "data": settings})
			})

			protected.PUT("/settings", func(c *gin.Context) {
				userID := c.GetString("user_id")
				var body map[string]interface{}
				if err := c.ShouldBindJSON(&body); err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"error": "invalid settings payload"})
					return
				}
				// Merge onto current (or default) settings so partial updates work.
				var raw sql.NullString
				db.QueryRow(`SELECT settings::text FROM users WHERE id=$1`, userID).Scan(&raw)
				settings := defaultSettings()
				if raw.Valid && raw.String != "" {
					_ = json.Unmarshal([]byte(raw.String), &settings)
				}
				for k, v := range body {
					settings[k] = v
				}
				merged, _ := json.Marshal(settings)
				if _, err := db.Exec(`UPDATE users SET settings=$1, updated_at=NOW() WHERE id=$2`, string(merged), userID); err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save settings"})
					return
				}
				c.JSON(http.StatusOK, gin.H{"success": true, "data": settings})
			})

			// Lightweight aggregate counts for the broker dashboard (avoids
			// fetching the full /properties/all and /clients lists just to count).
			protected.GET("/dashboard/stats", func(c *gin.Context) {
				userID := c.GetString("user_id")
				var p struct {
					Total, Available, Sold, Rented, Hold, Closed, UnderDiscussion int
				}
				// Property status breakdown across all brokers (matches the
				// dashboard's "all brokers" active-listings card).
				db.QueryRow(`
					SELECT COUNT(*),
					       COUNT(*) FILTER (WHERE status='available'),
					       COUNT(*) FILTER (WHERE status='sold'),
					       COUNT(*) FILTER (WHERE status='rented'),
					       COUNT(*) FILTER (WHERE status='hold'),
					       COUNT(*) FILTER (WHERE status='closed'),
					       COUNT(*) FILTER (WHERE status IN ('under_discussion','under_negotiation'))
					FROM properties WHERE deleted_at IS NULL
				`).Scan(&p.Total, &p.Available, &p.Sold, &p.Rented, &p.Hold, &p.Closed, &p.UnderDiscussion)

				var clientsTotal int
				db.QueryRow(`SELECT COUNT(*) FROM clients WHERE broker_id=$1`, userID).Scan(&clientsTotal)

				c.JSON(http.StatusOK, gin.H{
					"properties": gin.H{
						"total": p.Total, "available": p.Available, "sold": p.Sold,
						"rented": p.Rented, "hold": p.Hold, "closed": p.Closed,
						"under_discussion": p.UnderDiscussion,
					},
					"clients_total": clientsTotal,
				})
			})

			// Lightweight counts for the profile page (avoids fetching full lists)
			protected.GET("/profile/stats", func(c *gin.Context) {
				userID := c.GetString("user_id")
				var propertiesCount, clientsCount, projectsCount int
				db.QueryRow(`SELECT COUNT(*) FROM properties WHERE broker_id=$1 AND deleted_at IS NULL`, userID).Scan(&propertiesCount)
				db.QueryRow(`SELECT COUNT(*) FROM clients WHERE broker_id=$1`, userID).Scan(&clientsCount)
				db.QueryRow(`SELECT COUNT(*) FROM projects WHERE channel_partner_id=$1`, userID).Scan(&projectsCount)
				c.JSON(http.StatusOK, gin.H{
					"properties_count": propertiesCount,
					"clients_count":    clientsCount,
					"projects_count":   projectsCount,
				})
			})

			// File upload routes
			protected.POST("/upload/profile-photo", uploadHandler.UploadProfilePhoto)
			protected.POST("/upload/clients-excel", uploadHandler.UploadClientsExcel)
			protected.POST("/upload/properties-excel", uploadHandler.UploadPropertiesExcel)
			protected.POST("/upload/client-requirements-excel", uploadHandler.UploadClientRequirementsExcel)
			protected.POST("/upload/building-contacts-excel", uploadHandler.UploadBuildingContactsExcel)
			protected.POST("/upload/property-photos/:id", uploadHandler.UploadPropertyPhotos)
			protected.DELETE("/upload/property-photos/:id/:filename", uploadHandler.DeletePropertyPhoto)

			// Notification routes
			protected.GET("/notifications", notificationHandler.List)
			protected.GET("/notifications/stats", notificationHandler.Stats)
			protected.PUT("/notifications/read-all", notificationHandler.MarkAllRead)
			protected.PUT("/notifications/:id/read", notificationHandler.MarkRead)
			protected.DELETE("/notifications/:id", notificationHandler.Delete)

			// Property routes (accessible to all authenticated users)
			protected.GET("/properties/all", propertyHandler.GetAllProperties)
			protected.GET("/properties/options", propertyHandler.GetPropertyOptions)
			protected.GET("/properties/view/:id", propertyHandler.GetAnyProperty)
			protected.GET("/properties", propertyHandler.GetProperties)
			protected.POST("/properties", propertyHandler.CreateProperty)
			protected.GET("/properties/:id", propertyHandler.GetProperty)
			protected.PUT("/properties/:id", propertyHandler.UpdateProperty)
			protected.DELETE("/properties/:id", propertyHandler.DeleteProperty)

			// Client routes (accessible to all authenticated users)
			protected.GET("/clients", clientHandler.GetClients)
			protected.GET("/clients/options", clientHandler.GetClientOptions)
			protected.POST("/clients", clientHandler.CreateClient)
			protected.GET("/clients/:id", clientHandler.GetClient)
			protected.PUT("/clients/:id", clientHandler.UpdateClient)
			protected.DELETE("/clients/:id", clientHandler.DeleteClient)

			// Client Requirement routes
			protected.GET("/client-requirements", clientRequirementHandler.GetRequirements)
			protected.POST("/client-requirements", clientRequirementHandler.CreateRequirement)
			protected.GET("/client-requirements/:id", clientRequirementHandler.GetRequirement)
			protected.GET("/client-requirements/client/:clientId", clientRequirementHandler.GetRequirementsByClient)
			protected.PUT("/client-requirements/:id", clientRequirementHandler.UpdateRequirement)
			protected.DELETE("/client-requirements/:id", clientRequirementHandler.DeleteRequirement)

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

			// External Broker routes (non-EnforData brokers)
			protected.GET("/external-brokers", externalBrokerHandler.GetAll)
			protected.POST("/external-brokers", externalBrokerHandler.Create)
			protected.GET("/external-brokers/:id", externalBrokerHandler.GetOne)
			protected.PUT("/external-brokers/:id", externalBrokerHandler.Update)
			protected.DELETE("/external-brokers/:id", externalBrokerHandler.Delete)

			// External broker Excel upload (any authenticated user)
			protected.POST("/upload/external-brokers-excel", uploadHandler.UploadExternalBrokersExcel)
			protected.GET("/upload/external-brokers-sample", uploadHandler.DownloadExternalBrokersSample)
			// Building Contact routes
			protected.GET("/building-contacts", buildingHandler.GetBuildingContacts)
			protected.POST("/building-contacts", buildingHandler.CreateBuildingContact)
			protected.GET("/building-contacts/:id", buildingHandler.GetBuildingContact)
			protected.PUT("/building-contacts/:id", buildingHandler.UpdateBuildingContact)
			protected.DELETE("/building-contacts/:id", buildingHandler.DeleteBuildingContact)

			// Project routes
			protected.GET("/projects/all", projectHandler.GetAllProjects)
			protected.GET("/projects", projectHandler.GetMyProjects)
			protected.POST("/projects", projectHandler.CreateProject)
			protected.GET("/projects/:id", projectHandler.GetProject)
			protected.PUT("/projects/:id", projectHandler.UpdateProject)
			protected.DELETE("/projects/:id", projectHandler.DeleteProject)

			// ── Business Posts ────────────────────────────────────────────────
			protected.GET("/business-posts", businessPostHandler.GetPosts)
			protected.GET("/business-posts/my", businessPostHandler.GetMyPosts)
			protected.POST("/business-posts", businessPostHandler.CreatePost)
			protected.GET("/business-posts/:id", businessPostHandler.GetPost)
			protected.PUT("/business-posts/:id", businessPostHandler.UpdatePost)
			protected.DELETE("/business-posts/:id", businessPostHandler.DeletePost)

			// ── Staff Listings ────────────────────────────────────────────────
			protected.GET("/staff", staffHandler.GetStaff)
			protected.GET("/staff/my", staffHandler.GetMyStaff)
			protected.POST("/staff", staffHandler.CreateStaff)
			protected.GET("/staff/:id", staffHandler.GetStaffMember)
			protected.PUT("/staff/:id", staffHandler.UpdateStaff)
			protected.DELETE("/staff/:id", staffHandler.DeleteStaff)

			// ── Broker Network ────────────────────────────────────────────────
			network := protected.Group("/network")
			{
				// Discovery
				network.GET("/brokers", networkHandler.GetAllBrokers)
				network.GET("/brokers/:id/connection-status", networkHandler.GetConnectionStatus)

				// Channel Partner follows
				network.GET("/channel-partners", networkHandler.GetChannelPartners)
				network.POST("/channel-partners/:id/follow", networkHandler.FollowPartner)
				network.DELETE("/channel-partners/:id/follow", networkHandler.UnfollowPartner)
				network.GET("/followers", networkHandler.GetFollowers)

				// Connections
				network.POST("/connect/send", networkHandler.SendRequest)
				network.POST("/connect/respond", networkHandler.RespondRequest)
				network.GET("/connections", networkHandler.GetConnections)
				network.GET("/requests", networkHandler.GetPendingRequests)
				network.GET("/requests/sent", networkHandler.GetSentRequests)

				// Messaging (REST fallback)
				network.POST("/conversations/ensure", networkHandler.EnsureConversation)
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
				smsMarketing.POST("/send-dlt", smsMarketingHandler.SendDLTMessage)

				// Campaign Management
				smsMarketing.POST("/campaigns", smsMarketingHandler.CreateCampaign)
				smsMarketing.GET("/campaigns", smsMarketingHandler.GetCampaigns)
				smsMarketing.GET("/campaigns/:id", smsMarketingHandler.GetCampaignDetails)
				smsMarketing.POST("/campaigns/:id/send", smsMarketingHandler.SendCampaign)

				// DLT Templates (Regulatory Compliance)
				smsMarketing.GET("/dlt-templates", smsMarketingHandler.GetDLTTemplates)
				smsMarketing.GET("/dlt-templates/available", smsMarketingHandler.GetAvailableTemplates) // For send message tab
				smsMarketing.POST("/dlt-templates", smsMarketingHandler.CreateDLTTemplate)
				smsMarketing.GET("/dlt-templates/:id", smsMarketingHandler.GetDLTTemplate)
				smsMarketing.PUT("/dlt-templates/:id", smsMarketingHandler.UpdateDLTTemplate)
				smsMarketing.DELETE("/dlt-templates/:id", smsMarketingHandler.DeleteDLTTemplate)

				// SMS Headers
				smsMarketing.GET("/headers", smsMarketingHandler.GetSMSHeaders)
				smsMarketing.GET("/headers/available/:type", smsMarketingHandler.GetAvailableHeadersByType) // For dropdown
				smsMarketing.POST("/headers", smsMarketingHandler.CreateSMSHeader)
				smsMarketing.GET("/headers/:id", smsMarketingHandler.GetSMSHeader)
				smsMarketing.PUT("/headers/:id", smsMarketingHandler.UpdateSMSHeader)
				smsMarketing.DELETE("/headers/:id", smsMarketingHandler.DeleteSMSHeader)

				// Analytics
				smsMarketing.GET("/logs", smsMarketingHandler.GetMessageLogs)
				smsMarketing.POST("/logs/:id/refresh-delivery", smsMarketingHandler.RefreshDeliveryStatus)
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
				// SMS top-ups
				payments.GET("/sms-topup/price", paymentHandler.PreviewSmsTopupPrice)
				payments.POST("/sms-topup/create-order", paymentHandler.CreateSmsTopupOrder)
				payments.POST("/sms-topup/verify", paymentHandler.VerifySmsTopup)
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
				admin.GET("/dashboard", adminHandler.GetDashboard)
				admin.GET("/users", adminHandler.GetUsers)
				admin.GET("/users/:id", adminHandler.GetUserDetails)
				admin.PUT("/users/:id/status", adminHandler.UpdateUserStatus)
				admin.DELETE("/users/:id", adminHandler.DeleteUser)
				admin.POST("/users/:id/login-as", adminHandler.LoginAsBroker)
				admin.GET("/revenue", adminHandler.GetRevenue)
				admin.GET("/sms", adminHandler.GetSMS)
				admin.GET("/sms/provider-status", adminHandler.GetSMSProviderStatus)
				admin.GET("/audit-logs", adminHandler.GetAuditLogs)
				admin.GET("/announcements", adminHandler.GetAnnouncements)
				admin.POST("/announcements", adminHandler.CreateAnnouncement)
				admin.POST("/announcements/:id/send", adminHandler.SendAnnouncement)
				admin.GET("/feedback", adminHandler.GetFeedback)
				admin.PUT("/feedback/:id", adminHandler.UpdateFeedback)

				// TeleMarketer Management - DLT Templates
				admin.GET("/dlt-templates", adminHandler.GetAllDLTTemplates)
				admin.GET("/dlt-templates/:id", adminHandler.GetDLTTemplate)
				admin.PUT("/dlt-templates/:id", adminHandler.UpdateDLTTemplate)
				admin.DELETE("/dlt-templates/:id", adminHandler.DeleteDLTTemplate)

				// TeleMarketer Management - SMS Headers
				admin.POST("/sms-headers", adminHandler.CreateSMSHeader)
				admin.GET("/sms-headers", adminHandler.GetAllSMSHeaders)
				admin.GET("/sms-headers/:id", adminHandler.GetSMSHeader)
				admin.PUT("/sms-headers/:id", adminHandler.UpdateSMSHeader)
				admin.DELETE("/sms-headers/:id", adminHandler.DeleteSMSHeader)

				// Admin External Broker management
				admin.DELETE("/external-brokers/:id", externalBrokerHandler.AdminDelete)

				// Contact form submissions from the public landing page
				admin.GET("/contact-messages", func(c *gin.Context) {
					rows, err := db.Query(`SELECT id, name, email, COALESCE(phone,''), message, is_read, created_at
						FROM contact_messages ORDER BY created_at DESC`)
					if err != nil {
						c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load contact messages"})
						return
					}
					defer rows.Close()
					messages := []gin.H{}
					for rows.Next() {
						var id, name, email, phone, message string
						var isRead bool
						var createdAt time.Time
						if err := rows.Scan(&id, &name, &email, &phone, &message, &isRead, &createdAt); err != nil {
							continue
						}
						messages = append(messages, gin.H{
							"id": id, "name": name, "email": email, "phone": phone,
							"message": message, "is_read": isRead, "created_at": createdAt,
						})
					}
					c.JSON(http.StatusOK, gin.H{"message": "ok", "data": messages})
				})
				admin.GET("/renewals", adminHandler.GetRenewals)
				admin.GET("/activity", adminHandler.GetActivity)
				admin.GET("/storage", adminHandler.GetStorage)
				admin.GET("/config", adminHandler.GetConfig)
				admin.PUT("/config", adminHandler.UpdateConfig)
				admin.GET("/download/:type", adminHandler.DownloadData)
			}
			// Broker feedback submission (accessible to all authenticated users)
			protected.POST("/feedback", adminHandler.SubmitFeedback)
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
		api.GET("/download/client-requirements-sample", uploadHandler.DownloadClientRequirementsSample)
		api.GET("/download/building-contacts-sample", uploadHandler.DownloadBuildingContactsSample)
		api.GET("/download/external-brokers-sample", uploadHandler.DownloadExternalBrokersSample)
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
