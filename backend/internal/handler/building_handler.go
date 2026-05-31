package handler

import (
	"net/http"
	"strings"

	"enfor-data-backend/internal/dto"
	"enfor-data-backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type BuildingHandler struct {
	buildingService *service.BuildingService
	validator       *validator.Validate
}

func NewBuildingHandler(buildingService *service.BuildingService) *BuildingHandler {
	return &BuildingHandler{
		buildingService: buildingService,
		validator:       validator.New(),
	}
}

func (h *BuildingHandler) GetBuildingContacts(c *gin.Context) {
	brokerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized", Message: "Authentication required"})
		return
	}

	var area, building *string
	if a := c.Query("area"); a != "" {
		area = &a
	}
	if b := c.Query("building"); b != "" {
		building = &b
	}

	contacts, err := h.buildingService.GetBuildingContacts(brokerID.(string), area, building)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Internal server error", Message: "Failed to retrieve building contacts: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "Building contacts retrieved successfully", Data: contacts})
}

func (h *BuildingHandler) CreateBuildingContact(c *gin.Context) {
	brokerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized", Message: "Authentication required"})
		return
	}

	var req dto.CreateBuildingContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request body", Message: err.Error()})
		return
	}
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Validation failed", Message: formatValidationErrors(err)})
		return
	}

	contact, err := h.buildingService.CreateBuildingContact(&req, brokerID.(string))
	if err != nil {
		if strings.Contains(err.Error(), "already exists") {
			c.JSON(http.StatusConflict, ErrorResponse{Error: "Duplicate mobile number", Message: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Internal server error", Message: "Failed to create building contact"})
		return
	}
	c.JSON(http.StatusCreated, SuccessResponse{Message: "Building contact created successfully", Data: contact})
}

func (h *BuildingHandler) GetBuildingContact(c *gin.Context) {
	brokerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized", Message: "Authentication required"})
		return
	}

	contactID := c.Param("id")
	contact, err := h.buildingService.GetBuildingContactByID(contactID, brokerID.(string))
	if err != nil {
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "access denied") {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Not found", Message: "Building contact not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Internal server error", Message: "Failed to retrieve building contact"})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "Building contact retrieved successfully", Data: contact})
}

func (h *BuildingHandler) UpdateBuildingContact(c *gin.Context) {
	brokerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized", Message: "Authentication required"})
		return
	}

	contactID := c.Param("id")
	var req dto.UpdateBuildingContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request body", Message: err.Error()})
		return
	}
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Validation failed", Message: formatValidationErrors(err)})
		return
	}

	contact, err := h.buildingService.UpdateBuildingContact(contactID, &req, brokerID.(string))
	if err != nil {
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "access denied") {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Not found", Message: "Building contact not found"})
			return
		}
		if strings.Contains(err.Error(), "already exists") {
			c.JSON(http.StatusConflict, ErrorResponse{Error: "Duplicate mobile number", Message: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Internal server error", Message: "Failed to update building contact"})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "Building contact updated successfully", Data: contact})
}

func (h *BuildingHandler) DeleteBuildingContact(c *gin.Context) {
	brokerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized", Message: "Authentication required"})
		return
	}

	contactID := c.Param("id")
	err := h.buildingService.DeleteBuildingContact(contactID, brokerID.(string))
	if err != nil {
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "access denied") {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Not found", Message: "Building contact not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Internal server error", Message: "Failed to delete building contact"})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "Building contact deleted successfully"})
}
