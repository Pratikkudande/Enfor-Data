package handler

import (
	"net/http"
	"strconv"

	"enfor-data-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type NotificationHandler struct {
	svc *service.NotificationService
}

func NewNotificationHandler(svc *service.NotificationService) *NotificationHandler {
	return &NotificationHandler{svc: svc}
}

// GET /api/notifications?page=&limit=
func (h *NotificationHandler) List(c *gin.Context) {
	userID := c.GetString("user_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	items, err := h.svc.List(userID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to load notifications", Message: err.Error()})
		return
	}
	total, _ := h.svc.Count(userID)
	c.JSON(http.StatusOK, SuccessResponse{
		Message: "ok",
		Data: gin.H{
			"notifications": items,
			"pagination": gin.H{
				"page": page, "limit": limit, "total": total,
				"total_pages": (total + limit - 1) / limit,
			},
		},
	})
}

// GET /api/notifications/stats
func (h *NotificationHandler) Stats(c *gin.Context) {
	userID := c.GetString("user_id")
	total, _ := h.svc.Count(userID)
	unread, _ := h.svc.Unread(userID)
	byType, _ := h.svc.ByType(userID)
	c.JSON(http.StatusOK, SuccessResponse{
		Message: "ok",
		Data:    gin.H{"total": total, "unread": unread, "by_type": byType},
	})
}

// PUT /api/notifications/:id/read
func (h *NotificationHandler) MarkRead(c *gin.Context) {
	userID := c.GetString("user_id")
	if err := h.svc.MarkRead(userID, c.Param("id")); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to update notification"})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "Notification marked as read"})
}

// PUT /api/notifications/read-all
func (h *NotificationHandler) MarkAllRead(c *gin.Context) {
	userID := c.GetString("user_id")
	if err := h.svc.MarkAllRead(userID); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to update notifications"})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "All notifications marked as read"})
}

// DELETE /api/notifications/:id
func (h *NotificationHandler) Delete(c *gin.Context) {
	userID := c.GetString("user_id")
	if err := h.svc.Delete(userID, c.Param("id")); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to delete notification"})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "Notification deleted"})
}
