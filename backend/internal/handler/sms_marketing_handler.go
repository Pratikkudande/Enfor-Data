package handler

import (
	"net/http"

	"enfor-data-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type SMSMarketingHandler struct {
	service *service.SMSMarketingService
}

func NewSMSMarketingHandler(service *service.SMSMarketingService) *SMSMarketingHandler {
	return &SMSMarketingHandler{service: service}
}

// ============================================================
// Account Management
// ============================================================

// GET /api/sms-marketing/account
func (h *SMSMarketingHandler) GetAccount(c *gin.Context) {
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

// POST /api/sms-marketing/connect
func (h *SMSMarketingHandler) ConnectAccount(c *gin.Context) {
	userID := c.GetString("user_id")

	var req struct {
		AuthKey  string `json:"auth_key" binding:"required"`
		SenderID string `json:"sender_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	if err := h.service.ConnectAccount(userID, req.AuthKey, req.SenderID); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to connect account: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "MSG91 SMS account connected successfully",
	})
}

// POST /api/sms-marketing/disconnect
func (h *SMSMarketingHandler) DisconnectAccount(c *gin.Context) {
	userID := c.GetString("user_id")

	if err := h.service.DisconnectAccount(userID); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to disconnect account: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "SMS account disconnected successfully",
	})
}

// ============================================================
// Message Sending
// ============================================================

// POST /api/sms-marketing/send
func (h *SMSMarketingHandler) SendMessage(c *gin.Context) {
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
			Message: "Failed to send SMS: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "SMS sent successfully",
	})
}

// POST /api/sms-marketing/send-bulk
func (h *SMSMarketingHandler) SendBulkMessage(c *gin.Context) {
	userID := c.GetString("user_id")

	var req struct {
		ClientIDs []string `json:"client_ids" binding:"required"`
		Message   string   `json:"message" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	successful, failed, err := h.service.SendBulkMessage(userID, req.ClientIDs, req.Message)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to send bulk SMS: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Bulk SMS sent",
		Data: gin.H{
			"successful": successful,
			"failed":     failed,
			"total":      successful + failed,
		},
	})
}

// ============================================================
// Campaign Management
// ============================================================

// POST /api/sms-marketing/campaigns
func (h *SMSMarketingHandler) CreateCampaign(c *gin.Context) {
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

// GET /api/sms-marketing/campaigns
func (h *SMSMarketingHandler) GetCampaigns(c *gin.Context) {
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

// GET /api/sms-marketing/campaigns/:id
func (h *SMSMarketingHandler) GetCampaignDetails(c *gin.Context) {
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

// POST /api/sms-marketing/campaigns/:id/send
func (h *SMSMarketingHandler) SendCampaign(c *gin.Context) {
	userID := c.GetString("user_id")
	campaignID := c.Param("id")

	// Send campaign asynchronously
	go func() {
		if err := h.service.SendCampaign(campaignID, userID); err != nil {
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

// GET /api/sms-marketing/templates
func (h *SMSMarketingHandler) GetTemplates(c *gin.Context) {
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

// POST /api/sms-marketing/templates
func (h *SMSMarketingHandler) CreateTemplate(c *gin.Context) {
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

// DELETE /api/sms-marketing/templates/:id
func (h *SMSMarketingHandler) DeleteTemplate(c *gin.Context) {
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

// GET /api/sms-marketing/logs
func (h *SMSMarketingHandler) GetMessageLogs(c *gin.Context) {
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

// GET /api/sms-marketing/stats
func (h *SMSMarketingHandler) GetStats(c *gin.Context) {
	userID := c.GetString("user_id")

	stats, err := h.service.GetStats(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to get stats: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"stats": stats,
	})
}
