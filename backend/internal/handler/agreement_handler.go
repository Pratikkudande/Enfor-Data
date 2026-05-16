package handler

import (
	"net/http"
	"strings"

	"enfor-data-backend/internal/dto"
	"enfor-data-backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// AgreementHandler handles HTTP requests for agreement operations
type AgreementHandler struct {
	agreementService *service.AgreementService
	validator        *validator.Validate
}

func NewAgreementHandler(agreementService *service.AgreementService) *AgreementHandler {
	return &AgreementHandler{
		agreementService: agreementService,
		validator:        validator.New(),
	}
}

// CreateAgreement handles POST /api/agreements
func (h *AgreementHandler) CreateAgreement(c *gin.Context) {
	brokerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}

	var req dto.CreateAgreementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request body", Message: err.Error()})
		return
	}
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Validation failed", Message: formatValidationErrors(err)})
		return
	}

	agreement, err := h.agreementService.Create(&req, brokerID.(string))
	if err != nil {
		if strings.Contains(err.Error(), "not found") ||
			strings.Contains(err.Error(), "does not belong") {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Bad request", Message: err.Error()})
			return
		}
		if strings.Contains(err.Error(), "invalid") ||
			strings.Contains(err.Error(), "must be after") {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Validation failed", Message: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Internal server error", Message: "Failed to create agreement"})
		return
	}

	c.JSON(http.StatusCreated, SuccessResponse{Message: "Agreement created successfully", Data: agreement})
}

// GetAgreements handles GET /api/agreements
func (h *AgreementHandler) GetAgreements(c *gin.Context) {
	brokerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}

	agreements, err := h.agreementService.GetByBroker(brokerID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Internal server error", Message: "Failed to retrieve agreements"})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{Message: "Agreements retrieved successfully", Data: agreements})
}

// GetAgreement handles GET /api/agreements/:id
func (h *AgreementHandler) GetAgreement(c *gin.Context) {
	brokerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}

	agreement, err := h.agreementService.GetByID(c.Param("id"), brokerID.(string))
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Not found", Message: "Agreement not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{Message: "Agreement retrieved successfully", Data: agreement})
}

// UpdateAgreement handles PUT /api/agreements/:id  (status update only)
func (h *AgreementHandler) UpdateAgreement(c *gin.Context) {
	brokerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}

	var req dto.UpdateAgreementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request body", Message: err.Error()})
		return
	}
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Validation failed", Message: formatValidationErrors(err)})
		return
	}

	agreement, err := h.agreementService.UpdateStatus(c.Param("id"), &req, brokerID.(string))
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Not found", Message: "Agreement not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Internal server error", Message: "Failed to update agreement"})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{Message: "Agreement updated successfully", Data: agreement})
}

// DeleteAgreement handles DELETE /api/agreements/:id
func (h *AgreementHandler) DeleteAgreement(c *gin.Context) {
	brokerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}

	if err := h.agreementService.Delete(c.Param("id"), brokerID.(string)); err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Not found", Message: "Agreement not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Internal server error", Message: "Failed to delete agreement"})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{Message: "Agreement deleted successfully"})
}
