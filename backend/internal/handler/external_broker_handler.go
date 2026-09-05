package handler

import (
	"net/http"
	"strings"

	"enfor-data-backend/internal/dto"
	"enfor-data-backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type ExternalBrokerHandler struct {
	svc       *service.ExternalBrokerService
	validator *validator.Validate
}

func NewExternalBrokerHandler(svc *service.ExternalBrokerService) *ExternalBrokerHandler {
	return &ExternalBrokerHandler{svc: svc, validator: validator.New()}
}

// GET /api/external-brokers?area=&location=
func (h *ExternalBrokerHandler) GetAll(c *gin.Context) {
	var area, location *string
	if a := c.Query("area"); a != "" {
		area = &a
	}
	if l := c.Query("location"); l != "" {
		location = &l
	}
	list, err := h.svc.GetAll(area, location)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "failed to get external brokers", Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "External brokers retrieved successfully", Data: list})
}

// POST /api/external-brokers
func (h *ExternalBrokerHandler) Create(c *gin.Context) {
	userID := c.GetString("user_id")
	var req dto.CreateExternalBrokerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request body", Message: err.Error()})
		return
	}
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Validation failed", Message: formatValidationErrors(err)})
		return
	}
	b, err := h.svc.Create(&req, userID)
	if err != nil {
		if strings.Contains(err.Error(), "already exists") || strings.Contains(err.Error(), "belongs to an existing") {
			c.JSON(http.StatusConflict, ErrorResponse{Error: "Duplicate", Message: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create external broker", Message: err.Error()})
		return
	}
	c.JSON(http.StatusCreated, SuccessResponse{Message: "External broker created successfully", Data: b})
}

// GET /api/external-brokers/:id
func (h *ExternalBrokerHandler) GetOne(c *gin.Context) {
	b, err := h.svc.GetByID(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "Not found", Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "ok", Data: b})
}

// PUT /api/external-brokers/:id
func (h *ExternalBrokerHandler) Update(c *gin.Context) {
	userID := c.GetString("user_id")
	var req dto.UpdateExternalBrokerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request body", Message: err.Error()})
		return
	}
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Validation failed", Message: formatValidationErrors(err)})
		return
	}
	b, err := h.svc.Update(c.Param("id"), &req, userID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Not found", Message: err.Error()})
			return
		}
		if strings.Contains(err.Error(), "access denied") {
			c.JSON(http.StatusForbidden, ErrorResponse{Error: "Forbidden", Message: err.Error()})
			return
		}
		if strings.Contains(err.Error(), "already exists") {
			c.JSON(http.StatusConflict, ErrorResponse{Error: "Duplicate", Message: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to update", Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "External broker updated successfully", Data: b})
}

// DELETE /api/external-brokers/:id
func (h *ExternalBrokerHandler) Delete(c *gin.Context) {
	userID := c.GetString("user_id")
	err := h.svc.Delete(c.Param("id"), userID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Not found", Message: err.Error()})
			return
		}
		if strings.Contains(err.Error(), "access denied") {
			c.JSON(http.StatusForbidden, ErrorResponse{Error: "Forbidden", Message: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to delete", Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "External broker deleted successfully"})
}

// DELETE /api/admin/external-brokers/:id  (admin only — no ownership check)
func (h *ExternalBrokerHandler) AdminDelete(c *gin.Context) {
	err := h.svc.AdminDelete(c.Param("id"))
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Not found", Message: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to delete", Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "External broker deleted successfully"})
}
