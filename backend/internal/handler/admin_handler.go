package handler

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"sort"
	"strconv"

	"enfor-data-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type AdminHandler struct {
	adminService *service.AdminService
}

func NewAdminHandler(adminService *service.AdminService) *AdminHandler {
	return &AdminHandler{adminService: adminService}
}

func (h *AdminHandler) getAdminInfo(c *gin.Context) (string, string, string) {
	adminID := c.GetString("user_id")
	adminName := c.GetString("user_email")
	ip := c.ClientIP()
	return adminID, adminName, ip
}

// GET /admin/dashboard
func (h *AdminHandler) GetDashboard(c *gin.Context) {
	stats, err := h.adminService.GetDashboardStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to get dashboard stats", Message: err.Error()})
		return
	}
	analytics, err := h.adminService.GetAnalytics()
	if err != nil {
		analytics = nil
	}
	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Dashboard data fetched",
		Data:    gin.H{"stats": stats, "analytics": analytics},
	})
}

// GET /admin/users
func (h *AdminHandler) GetUsers(c *gin.Context) {
	search := c.Query("search")
	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	brokers, total, err := h.adminService.GetBrokers(search, status, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to get users", Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{
		Data: gin.H{
			"users": brokers,
			"total": total,
			"page":  page,
			"limit": limit,
		},
	})
}

// GET /admin/users/:id
func (h *AdminHandler) GetUserDetails(c *gin.Context) {
	id := c.Param("id")
	broker, err := h.adminService.GetBrokerDetails(id)
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "User not found", Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Data: broker})
}

// PUT /admin/users/:id/status
func (h *AdminHandler) UpdateUserStatus(c *gin.Context) {
	id := c.Param("id")
	adminID, adminName, ip := h.getAdminInfo(c)

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request"})
		return
	}

	if err := h.adminService.UpdateUserStatus(adminID, adminName, id, req.Status, ip); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to update status", Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "User status updated successfully"})
}

// DELETE /admin/users/:id
func (h *AdminHandler) DeleteUser(c *gin.Context) {
	id := c.Param("id")
	adminID, adminName, ip := h.getAdminInfo(c)

	if err := h.adminService.DeleteUser(adminID, adminName, id, ip); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to delete user", Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "User deleted successfully"})
}

// POST /admin/users/:id/login-as (developer admin only)
func (h *AdminHandler) LoginAsBroker(c *gin.Context) {
	brokerID := c.Param("id")
	adminID, adminName, ip := h.getAdminInfo(c)

	token, sessionID, err := h.adminService.LoginAsBroker(adminID, adminName, brokerID, ip)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to login as broker", Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Login as broker successful",
		Data:    gin.H{"token": token, "session_id": sessionID},
	})
}

// GET /admin/revenue
func (h *AdminHandler) GetRevenue(c *gin.Context) {
	stats, err := h.adminService.GetRevenueStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to get revenue stats"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	subscriptions, total, err := h.adminService.GetSubscriptions(page, limit)
	if err != nil {
		subscriptions = nil
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Data: gin.H{
			"stats":         stats,
			"subscriptions": subscriptions,
			"total":         total,
		},
	})
}

// GET /admin/sms
func (h *AdminHandler) GetSMS(c *gin.Context) {
	stats, err := h.adminService.GetSMSStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to get SMS stats"})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Data: stats})
}

// GET /admin/audit-logs
func (h *AdminHandler) GetAuditLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	logs, total, err := h.adminService.GetAuditLogs(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to get audit logs"})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{
		Data: gin.H{"logs": logs, "total": total, "page": page, "limit": limit},
	})
}

// GET /admin/announcements
func (h *AdminHandler) GetAnnouncements(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	list, total, err := h.adminService.GetAnnouncements(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to get announcements"})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{
		Data: gin.H{"announcements": list, "total": total},
	})
}

// POST /admin/announcements
func (h *AdminHandler) CreateAnnouncement(c *gin.Context) {
	adminID, _, _ := h.getAdminInfo(c)

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request"})
		return
	}

	announcement, err := h.adminService.CreateAnnouncement(adminID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create announcement", Message: err.Error()})
		return
	}
	c.JSON(http.StatusCreated, SuccessResponse{Message: "Announcement created", Data: announcement})
}

// POST /admin/announcements/:id/send
func (h *AdminHandler) SendAnnouncement(c *gin.Context) {
	id := c.Param("id")
	adminID, adminName, ip := h.getAdminInfo(c)

	if err := h.adminService.SendAnnouncement(adminID, adminName, id, ip); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to send announcement", Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "Announcement sent successfully"})
}

// GET /admin/feedback
func (h *AdminHandler) GetFeedback(c *gin.Context) {
	status := c.DefaultQuery("status", "all")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	list, total, err := h.adminService.GetFeedback(status, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to get feedback"})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{
		Data: gin.H{"feedback": list, "total": total},
	})
}

// PUT /admin/feedback/:id
func (h *AdminHandler) UpdateFeedback(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Status     string `json:"status"`
		AdminNotes string `json:"admin_notes"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request"})
		return
	}
	if err := h.adminService.UpdateFeedback(id, req.Status, req.AdminNotes); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to update feedback"})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "Feedback updated"})
}

// GET /admin/renewals
func (h *AdminHandler) GetRenewals(c *gin.Context) {
	renewals, err := h.adminService.GetRenewals()
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to get renewals"})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Data: renewals})
}

// GET /admin/activity
func (h *AdminHandler) GetActivity(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	logs, total, err := h.adminService.GetActivityLog(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to get activity"})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{
		Data: gin.H{"activity": logs, "total": total, "page": page},
	})
}

// GET /admin/storage
func (h *AdminHandler) GetStorage(c *gin.Context) {
	stats, err := h.adminService.GetStorageStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to get storage stats"})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Data: stats})
}

// GET /admin/config
func (h *AdminHandler) GetConfig(c *gin.Context) {
	configs, err := h.adminService.GetSystemConfig()
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to get config"})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Data: configs})
}

// PUT /admin/config
func (h *AdminHandler) UpdateConfig(c *gin.Context) {
	adminID, adminName, ip := h.getAdminInfo(c)
	var req struct {
		Key   string `json:"key" binding:"required"`
		Value string `json:"value"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request"})
		return
	}
	if err := h.adminService.UpdateSystemConfig(adminID, adminName, req.Key, req.Value, ip); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to update config"})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "Configuration updated"})
}

// GET /admin/download/:type  (type: brokers|properties|buyers|sellers|rent_clients|clients)
func (h *AdminHandler) DownloadData(c *gin.Context) {
	dataType := c.Param("type")
	brokerID := c.Query("broker_id")
	format := c.DefaultQuery("format", "csv")

	data, err := h.adminService.ExportData(dataType, brokerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to export data"})
		return
	}

	if format == "json" {
		c.JSON(http.StatusOK, SuccessResponse{Data: data})
		return
	}

	// CSV export
	filename := fmt.Sprintf("%s_export.csv", dataType)
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Header("Content-Type", "text/csv")

	w := csv.NewWriter(c.Writer)
	defer w.Flush()

	if len(data) == 0 {
		return
	}

	// Write header from first row keys (sorted)
	keys := make([]string, 0, len(data[0]))
	for k := range data[0] {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	w.Write(keys)

	// Write rows
	for _, row := range data {
		record := make([]string, len(keys))
		for i, k := range keys {
			record[i] = fmt.Sprintf("%v", row[k])
		}
		w.Write(record)
	}
}

// POST /admin/feedback (broker submits feedback)
func (h *AdminHandler) SubmitFeedback(c *gin.Context) {
	var req struct {
		Type        string `json:"type" binding:"required"`
		Title       string `json:"title" binding:"required"`
		Description string `json:"description" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request", Message: err.Error()})
		return
	}

	validTypes := map[string]bool{"feedback": true, "suggestion": true, "bug_report": true, "feature_request": true}
	if !validTypes[req.Type] {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid feedback type"})
		return
	}

	c.JSON(http.StatusCreated, SuccessResponse{Message: "Feedback submitted successfully"})
}
