package handler

import (
	"net/http"

	"enfor-data-backend/internal/models"
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

	// Get provider info (includes initialization status)
	providerInfo := h.service.GetProviderInfo()

	account, err := h.service.GetAccountStatus(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to get account: " + err.Error(),
		})
		return
	}

	// If provider is initialized on startup and account doesn't exist, create a connected account
	if account == nil && providerInfo["initialized"].(bool) {
		// Auto-connect the account since provider is already initialized server-side
		if err := h.service.ConnectAccountWithServerConfig(userID); err == nil {
			// Reload account after auto-connection
			account, _ = h.service.GetAccountStatus(userID)
		}
	}

	if account == nil {
		c.JSON(http.StatusOK, gin.H{
			"connected": providerInfo["initialized"].(bool), // Already connected if initialized
			"account":   nil,
			"provider":  providerInfo,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"connected": account.Status == "connected",
		"account":   account,
		"provider":  providerInfo,
	})
}

// POST /api/sms-marketing/connect
func (h *SMSMarketingHandler) ConnectAccount(c *gin.Context) {
	userID := c.GetString("user_id")

	// Get provider info for response message
	providerInfo := h.service.GetProviderInfo()
	providerName := providerInfo["provider"].(string)

	// Use server-configured SMS provider credentials
	if err := h.service.ConnectAccountWithServerConfig(userID); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to connect account: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: providerName + " SMS account connected successfully",
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
// DLT Templates
// ============================================================

// POST /api/sms-marketing/dlt-templates
func (h *SMSMarketingHandler) CreateDLTTemplate(c *gin.Context) {
	userID := c.GetString("user_id")
	userRole := c.GetString("user_role")

	var req struct {
		Header          string  `json:"header" binding:"required"`
		TemplateID      *string `json:"template_id"`
		TemplateName    string  `json:"template_name" binding:"required"`
		TemplateType    string  `json:"template_type" binding:"required"`
		Category        string  `json:"category" binding:"required"`
		Provider        *string `json:"provider"`
		TemplateContent string  `json:"template_content" binding:"required"`
		SampleContent   *string `json:"sample_content"`
		Status          string  `json:"status" binding:"required"`
		VariableCount   int     `json:"variable_count"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	// For non-admin users (brokers), always set status to "Created"
	status := req.Status
	if userRole != "admin" {
		status = "Created"
	}

	template := &models.SMSDLTTemplate{
		Header:          req.Header,
		TemplateID:      req.TemplateID,
		TemplateName:    req.TemplateName,
		TemplateType:    req.TemplateType,
		Category:        req.Category,
		Provider:        req.Provider,
		TemplateContent: req.TemplateContent,
		SampleContent:   req.SampleContent,
		Status:          status,
		VariableCount:   req.VariableCount,
	}

	if err := h.service.CreateDLTTemplate(userID, template); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to create DLT template: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, SuccessResponse{
		Message: "DLT template created successfully",
		Data:    template,
	})
}

// GET /api/sms-marketing/dlt-templates
func (h *SMSMarketingHandler) GetDLTTemplates(c *gin.Context) {
	userID := c.GetString("user_id")

	templates, err := h.service.GetDLTTemplates(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to get DLT templates: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"templates": templates,
	})
}

// GET /api/sms-marketing/dlt-templates/available
// Gets active/approved templates created by admin or the broker for send message subsection
func (h *SMSMarketingHandler) GetAvailableTemplates(c *gin.Context) {
	userID := c.GetString("user_id")

	templates, err := h.service.GetAvailableTemplatesForSending(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to get available DLT templates: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"templates": templates,
	})
}

// GET /api/sms-marketing/dlt-templates/:id
func (h *SMSMarketingHandler) GetDLTTemplate(c *gin.Context) {
	userID := c.GetString("user_id")
	templateID := c.Param("id")

	template, err := h.service.GetDLTTemplateByID(templateID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to get DLT template: " + err.Error(),
		})
		return
	}

	if template == nil {
		c.JSON(http.StatusNotFound, ErrorResponse{
			Error:   "Not found",
			Message: "DLT template not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"template": template,
	})
}

// PUT /api/sms-marketing/dlt-templates/:id
func (h *SMSMarketingHandler) UpdateDLTTemplate(c *gin.Context) {
	userID := c.GetString("user_id")
	userRole := c.GetString("user_role")
	templateID := c.Param("id")

	var req struct {
		Header          string  `json:"header"`
		TemplateID      *string `json:"template_id"`
		TemplateName    string  `json:"template_name"`
		TemplateType    string  `json:"template_type"`
		Category        string  `json:"category"`
		Provider        *string `json:"provider"`
		TemplateContent string  `json:"template_content"`
		SampleContent   *string `json:"sample_content"`
		Status          string  `json:"status"`
		VariableCount   int     `json:"variable_count"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	// Get existing template
	template, err := h.service.GetDLTTemplateByID(templateID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to get template: " + err.Error(),
		})
		return
	}
	if template == nil {
		c.JSON(http.StatusNotFound, ErrorResponse{
			Error:   "Not found",
			Message: "Template not found",
		})
		return
	}

	// Verify ownership for non-admin users
	if userRole != "admin" && template.UserID != userID {
		c.JSON(http.StatusForbidden, ErrorResponse{
			Error:   "Forbidden",
			Message: "You can only update your own templates",
		})
		return
	}

	// Verify brokers can only edit templates with status "Created" or "Rejected"
	if userRole != "admin" && template.Status != "Created" && template.Status != "Rejected" {
		c.JSON(http.StatusForbidden, ErrorResponse{
			Error:   "Forbidden",
			Message: "You can only edit templates with status 'Created' or 'Rejected'",
		})
		return
	}

	// Update fields
	if req.Header != "" {
		template.Header = req.Header
	}
	if req.TemplateID != nil {
		template.TemplateID = req.TemplateID
	}
	if req.TemplateName != "" {
		template.TemplateName = req.TemplateName
	}
	if req.TemplateType != "" {
		template.TemplateType = req.TemplateType
	}
	if req.Category != "" {
		template.Category = req.Category
	}
	if req.Provider != nil {
		template.Provider = req.Provider
	}
	if req.TemplateContent != "" {
		template.TemplateContent = req.TemplateContent
	}
	if req.SampleContent != nil {
		template.SampleContent = req.SampleContent
	}
	
	// For non-admin users (brokers), always set status to "Created" when updating
	if userRole != "admin" {
		template.Status = "Created"
	} else if req.Status != "" {
		template.Status = req.Status
	}
	
	template.VariableCount = req.VariableCount
	
	// Set updated_by to current user
	template.UpdatedBy = &userID

	if err := h.service.UpdateDLTTemplate(template); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to update template: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Template updated successfully",
		Data:    template,
	})
}

// DELETE /api/sms-marketing/dlt-templates/:id
func (h *SMSMarketingHandler) DeleteDLTTemplate(c *gin.Context) {
	userID := c.GetString("user_id")
	userRole := c.GetString("user_role")
	templateID := c.Param("id")

	// Get existing template to verify ownership and status for non-admin users
	if userRole != "admin" {
		template, err := h.service.GetDLTTemplateByID(templateID, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{
				Error:   "Internal server error",
				Message: "Failed to get template: " + err.Error(),
			})
			return
		}
		if template == nil {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error:   "Not found",
				Message: "Template not found",
			})
			return
		}

		// Verify ownership
		if template.UserID != userID {
			c.JSON(http.StatusForbidden, ErrorResponse{
				Error:   "Forbidden",
				Message: "You can only delete your own templates",
			})
			return
		}

		// Verify brokers can only delete templates with status "Created" or "Rejected"
		if template.Status != "Created" && template.Status != "Rejected" {
			c.JSON(http.StatusForbidden, ErrorResponse{
				Error:   "Forbidden",
				Message: "You can only delete templates with status 'Created' or 'Rejected'",
			})
			return
		}
	}

	if err := h.service.DeleteDLTTemplate(templateID, userID); err != nil {
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

// POST /api/sms-marketing/send-dlt
func (h *SMSMarketingHandler) SendDLTMessage(c *gin.Context) {
	userID := c.GetString("user_id")

	var req struct {
		TemplateID          string            `json:"template_id" binding:"required"`
		VariableValues      map[string]string `json:"variable_values"`
		ClientIDs           []string          `json:"client_ids"`
		BuildingContactIDs  []string          `json:"building_contact_ids"` // Add building contact IDs support
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	// Ensure at least one recipient type is provided
	if len(req.ClientIDs) == 0 && len(req.BuildingContactIDs) == 0 {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request",
			Message: "At least one client_id or building_contact_id must be provided",
		})
		return
	}

	successful, failed, err := h.service.SendDLTMessage(userID, req.TemplateID, req.VariableValues, req.ClientIDs, req.BuildingContactIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to send DLT messages: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "DLT messages sent",
		Data: gin.H{
			"successful": successful,
			"failed":     failed,
			"total":      successful + failed,
		},
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

// ============================================================
// SMS Headers
// ============================================================

// POST /api/sms-marketing/headers
func (h *SMSMarketingHandler) CreateSMSHeader(c *gin.Context) {
	userID := c.GetString("user_id")
	userRole := c.GetString("user_role")

	var req struct {
		Header   string  `json:"header" binding:"required"`
		Provider *string `json:"provider"`
		Type     string  `json:"type" binding:"required"`
		Status   string  `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	// For non-admin users (brokers), always set status to "Created"
	status := req.Status
	if userRole != "admin" {
		status = "Created"
	}

	header := &models.SMSHeader{
		Header:   req.Header,
		Provider: req.Provider,
		Type:     req.Type,
		Status:   status,
	}

	if err := h.service.CreateSMSHeader(userID, header); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to create SMS header: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, SuccessResponse{
		Message: "SMS header created successfully",
		Data:    header,
	})
}

// GET /api/sms-marketing/headers
func (h *SMSMarketingHandler) GetSMSHeaders(c *gin.Context) {
	userID := c.GetString("user_id")

	headers, err := h.service.GetSMSHeaders(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to get SMS headers: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"headers": headers,
	})
}

// GET /api/sms-marketing/headers/:id
func (h *SMSMarketingHandler) GetSMSHeader(c *gin.Context) {
	userID := c.GetString("user_id")
	headerID := c.Param("id")

	header, err := h.service.GetSMSHeaderByID(headerID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to get SMS header: " + err.Error(),
		})
		return
	}

	if header == nil {
		c.JSON(http.StatusNotFound, ErrorResponse{
			Error:   "Not found",
			Message: "SMS header not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"header": header,
	})
}

// PUT /api/sms-marketing/headers/:id
func (h *SMSMarketingHandler) UpdateSMSHeader(c *gin.Context) {
	userID := c.GetString("user_id")
	userRole := c.GetString("user_role")
	headerID := c.Param("id")

	var req struct {
		Header   string  `json:"header"`
		Provider *string `json:"provider"`
		Type     string  `json:"type"`
		Status   string  `json:"status"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	// Get existing header
	header, err := h.service.GetSMSHeaderByID(headerID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to get header: " + err.Error(),
		})
		return
	}
	if header == nil {
		c.JSON(http.StatusNotFound, ErrorResponse{
			Error:   "Not found",
			Message: "Header not found",
		})
		return
	}

	// Verify ownership for non-admin users
	if userRole != "admin" && header.CreatedBy != userID {
		c.JSON(http.StatusForbidden, ErrorResponse{
			Error:   "Forbidden",
			Message: "You can only update your own headers",
		})
		return
	}

	// Verify brokers can only edit headers with status "Created" or "Rejected"
	if userRole != "admin" && header.Status != "Created" && header.Status != "Rejected" {
		c.JSON(http.StatusForbidden, ErrorResponse{
			Error:   "Forbidden",
			Message: "You can only edit headers with status 'Created' or 'Rejected'",
		})
		return
	}

	// Update fields
	if req.Header != "" {
		header.Header = req.Header
	}
	if req.Provider != nil {
		header.Provider = req.Provider
	}
	if req.Type != "" {
		header.Type = req.Type
	}

	// For non-admin users (brokers), always set status to "Created" when updating
	if userRole != "admin" {
		header.Status = "Created"
	} else if req.Status != "" {
		header.Status = req.Status
	}

	// Set updated_by to current user
	header.UpdatedBy = &userID

	if err := h.service.UpdateSMSHeader(header); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to update header: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Header updated successfully",
		Data:    header,
	})
}

// DELETE /api/sms-marketing/headers/:id
func (h *SMSMarketingHandler) DeleteSMSHeader(c *gin.Context) {
	userID := c.GetString("user_id")
	userRole := c.GetString("user_role")
	headerID := c.Param("id")

	// Get existing header to verify ownership and status for non-admin users
	if userRole != "admin" {
		header, err := h.service.GetSMSHeaderByID(headerID, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{
				Error:   "Internal server error",
				Message: "Failed to get header: " + err.Error(),
			})
			return
		}
		if header == nil {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error:   "Not found",
				Message: "Header not found",
			})
			return
		}

		// Verify ownership
		if header.CreatedBy != userID {
			c.JSON(http.StatusForbidden, ErrorResponse{
				Error:   "Forbidden",
				Message: "You can only delete your own headers",
			})
			return
		}

		// Verify brokers can only delete headers with status "Created" or "Rejected"
		if header.Status != "Created" && header.Status != "Rejected" {
			c.JSON(http.StatusForbidden, ErrorResponse{
				Error:   "Forbidden",
				Message: "You can only delete headers with status 'Created' or 'Rejected'",
			})
			return
		}
	}

	if err := h.service.DeleteSMSHeader(headerID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to delete header: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Header deleted successfully",
	})
}

// GET /api/sms-marketing/headers/available/:type
// Gets available headers for dropdown based on template type
// For admin: returns all active/approved headers of that type
// For broker: returns headers created by admin or that broker with active/approved status
func (h *SMSMarketingHandler) GetAvailableHeadersByType(c *gin.Context) {
	userID := c.GetString("user_id")
	userRole := c.GetString("user_role")
	headerType := c.Param("type")

	// Validate header type
	if headerType != "Promotional" && headerType != "Service" && headerType != "Implicit" {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request",
			Message: "Header type must be Promotional, Service, or Implicit",
		})
		return
	}

	headers, err := h.service.GetAvailableHeadersByType(userID, userRole, headerType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to get available headers: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"headers": headers,
	})
}
