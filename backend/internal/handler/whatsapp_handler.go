package handler

import (
	"enfor-data-backend/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type WhatsAppHandler struct {
	service      *service.WhatsAppService
	setupService *service.MetaWhatsAppSetupService
}

func NewWhatsAppHandler(service *service.WhatsAppService, setupService *service.MetaWhatsAppSetupService) *WhatsAppHandler {
	return &WhatsAppHandler{
		service:      service,
		setupService: setupService,
	}
}

// ============================================================
// Account Management
// ============================================================

// GET /api/whatsapp/account
func (h *WhatsAppHandler) GetAccount(c *gin.Context) {
	userID := c.GetString("user_id")

	account, err := h.service.GetAccountStatus(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to get account: " + err.Error(),
		})
		return
	}

	if account == nil {
		c.JSON(http.StatusOK, gin.H{
			"connected": false,
			"account":   nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"connected": account.Status == "connected",
		"account":   account,
	})
}

// POST /api/whatsapp/connect
func (h *WhatsAppHandler) ConnectAccount(c *gin.Context) {
	userID := c.GetString("user_id")

	var req struct {
		PhoneNumber string `json:"phone_number" binding:"required"`
		DisplayName string `json:"display_name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	if err := h.service.ConnectAccount(userID, req.PhoneNumber, req.DisplayName); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to connect account: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Account connected successfully",
	})
}

// POST /api/whatsapp/disconnect
func (h *WhatsAppHandler) DisconnectAccount(c *gin.Context) {
	userID := c.GetString("user_id")

	if err := h.service.DisconnectAccount(userID); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to disconnect account: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Account disconnected successfully",
	})
}

// ============================================================
// Message Sending
// ============================================================

// POST /api/whatsapp/send
func (h *WhatsAppHandler) SendMessage(c *gin.Context) {
	userID := c.GetString("user_id")

	var req struct {
		ClientID string `json:"client_id" binding:"required"`
		Message  string `json:"message" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	if err := h.service.SendIndividualMessage(userID, req.ClientID, req.Message); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to send message: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Message sent successfully",
	})
}

// ============================================================
// Campaign Management
// ============================================================

// POST /api/whatsapp/campaigns
func (h *WhatsAppHandler) CreateCampaign(c *gin.Context) {
	userID := c.GetString("user_id")

	var req struct {
		Name      string   `json:"name" binding:"required"`
		Message   string   `json:"message" binding:"required"`
		ClientIDs []string `json:"client_ids" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	campaign, err := h.service.CreateCampaign(userID, req.Name, req.Message, req.ClientIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to create campaign: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, SuccessResponse{
		Message: "Campaign created successfully",
		Data:    campaign,
	})
}

// GET /api/whatsapp/campaigns
func (h *WhatsAppHandler) GetCampaigns(c *gin.Context) {
	userID := c.GetString("user_id")

	campaigns, err := h.service.GetCampaigns(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to get campaigns: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"campaigns": campaigns,
	})
}

// GET /api/whatsapp/campaigns/:id
func (h *WhatsAppHandler) GetCampaignDetails(c *gin.Context) {
	userID := c.GetString("user_id")
	campaignID := c.Param("id")

	campaign, recipients, err := h.service.GetCampaignDetails(campaignID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to get campaign details: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"campaign":   campaign,
		"recipients": recipients,
	})
}

// POST /api/whatsapp/campaigns/:id/send
func (h *WhatsAppHandler) SendCampaign(c *gin.Context) {
	userID := c.GetString("user_id")
	campaignID := c.Param("id")

	// Send campaign asynchronously (in production, use a queue)
	go func() {
		if err := h.service.SendCampaign(campaignID, userID); err != nil {
			// Log error
			println("Failed to send campaign:", err.Error())
		}
	}()

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Campaign sending started",
	})
}

// ============================================================
// Templates
// ============================================================

// GET /api/whatsapp/templates
func (h *WhatsAppHandler) GetTemplates(c *gin.Context) {
	userID := c.GetString("user_id")

	templates, err := h.service.GetTemplates(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to get templates: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"templates": templates,
	})
}

// POST /api/whatsapp/templates
func (h *WhatsAppHandler) CreateTemplate(c *gin.Context) {
	userID := c.GetString("user_id")

	var req struct {
		Name         string   `json:"name" binding:"required"`
		Category     string   `json:"category" binding:"required"`
		TemplateText string   `json:"template_text" binding:"required"`
		Variables    []string `json:"variables"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	if err := h.service.CreateTemplate(userID, req.Name, req.Category, req.TemplateText, req.Variables); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to create template: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, SuccessResponse{
		Message: "Template created successfully",
	})
}

// DELETE /api/whatsapp/templates/:id
func (h *WhatsAppHandler) DeleteTemplate(c *gin.Context) {
	userID := c.GetString("user_id")
	templateID := c.Param("id")

	if err := h.service.DeleteTemplate(templateID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to delete template: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Template deleted successfully",
	})
}

// ============================================================
// Analytics
// ============================================================

// GET /api/whatsapp/logs
func (h *WhatsAppHandler) GetMessageLogs(c *gin.Context) {
	userID := c.GetString("user_id")

	logs, err := h.service.GetMessageLogs(userID, 50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to get message logs: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"logs": logs,
	})
}


// ============================================================
// Meta WhatsApp Setup & Onboarding
// ============================================================

// POST /api/whatsapp/setup/business
func (h *WhatsAppHandler) InitializeBusinessSetup(c *gin.Context) {
	userID := c.GetString("user_id")

	var req struct {
		PhoneNumber         string `json:"phone_number" binding:"required"`
		BusinessName        string `json:"business_name" binding:"required"`
		BusinessDescription string `json:"business_description"`
		BusinessCategory    string `json:"business_category" binding:"required"`
		BusinessWebsite     string `json:"business_website"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	setupReq := &service.BusinessSetupRequest{
		PhoneNumber:         req.PhoneNumber,
		BusinessName:        req.BusinessName,
		BusinessDescription: req.BusinessDescription,
		BusinessCategory:    req.BusinessCategory,
		BusinessWebsite:     req.BusinessWebsite,
	}

	account, err := h.setupService.InitializeBusinessSetup(userID, setupReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to initialize business setup: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Business setup initialized successfully",
		Data:    account,
	})
}

// POST /api/whatsapp/setup/request-verification
func (h *WhatsAppHandler) RequestVerificationCode(c *gin.Context) {
	userID := c.GetString("user_id")

	code, err := h.setupService.RequestVerificationCode(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to request verification code: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Verification code sent successfully",
		Data: gin.H{
			"code": code, // In production, don't return this - send via SMS/WhatsApp
			"message": "Verification code has been sent to your phone",
		},
	})
}

// POST /api/whatsapp/setup/verify-phone
func (h *WhatsAppHandler) VerifyPhoneNumber(c *gin.Context) {
	userID := c.GetString("user_id")

	var req struct {
		Code string `json:"code" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	if err := h.setupService.VerifyPhoneNumber(userID, req.Code); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Verification failed",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Phone number verified successfully",
	})
}

// POST /api/whatsapp/setup/connect-meta-api
func (h *WhatsAppHandler) ConnectMetaAPI(c *gin.Context) {
	userID := c.GetString("user_id")

	var req struct {
		AccessToken       string `json:"access_token" binding:"required"`
		PhoneNumberID     string `json:"phone_number_id" binding:"required"`
		BusinessAccountID string `json:"business_account_id" binding:"required"`
		WABAID            string `json:"waba_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	creds := &service.MetaAPICredentials{
		AccessToken:       req.AccessToken,
		PhoneNumberID:     req.PhoneNumberID,
		BusinessAccountID: req.BusinessAccountID,
		WABAID:            req.WABAID,
	}

	if err := h.setupService.ConnectMetaAPI(userID, creds); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Connection failed",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Meta WhatsApp API connected successfully",
	})
}

// GET /api/whatsapp/setup/status
func (h *WhatsAppHandler) GetSetupStatus(c *gin.Context) {
	userID := c.GetString("user_id")

	status, err := h.setupService.GetSetupStatus(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to get setup status: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": status,
	})
}

// POST /api/whatsapp/setup/resend-code
func (h *WhatsAppHandler) ResendVerificationCode(c *gin.Context) {
	userID := c.GetString("user_id")

	code, err := h.setupService.ResendVerificationCode(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to resend verification code: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Verification code resent successfully",
		Data: gin.H{
			"code": code, // In production, don't return this
			"message": "Verification code has been resent to your phone",
		},
	})
}
