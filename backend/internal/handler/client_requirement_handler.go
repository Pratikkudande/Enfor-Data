package handler

import (
	"net/http"

	"enfor-data-backend/internal/dto"
	"enfor-data-backend/internal/models"
	"enfor-data-backend/internal/repository"

	"github.com/gin-gonic/gin"
)

type ClientRequirementHandler struct {
	repo *repository.ClientRequirementRepository
}

func NewClientRequirementHandler(repo *repository.ClientRequirementRepository) *ClientRequirementHandler {
	return &ClientRequirementHandler{repo: repo}
}

// POST /api/client-requirements
func (h *ClientRequirementHandler) CreateRequirement(c *gin.Context) {
	userID := c.GetString("user_id")
	
	var req dto.CreateClientRequirementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	requirement := &models.ClientRequirement{
		ClientID:          req.ClientID,
		RequirementType:   req.RequirementType,
		BuildupArea:       req.BuildupArea,
		CarpetArea:        req.CarpetArea,
		MeasurementUnit:   req.MeasurementUnit,
		MinBudget:         req.MinBudget,
		MaxBudget:         req.MaxBudget,
		DepositBudget:     req.DepositBudget,
		PreferredLocation: req.PreferredLocation,
		City:              req.City,
		State:             req.State,
		PostalCode:        req.PostalCode,
		Enquiry:           req.Enquiry,
		Notes:             req.Notes,
		Status:            req.Status,
		CreatedBy:         &userID,
	}

	if err := h.repo.CreateRequirement(requirement); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to create requirement: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, SuccessResponse{
		Message: "Requirement created successfully",
		Data:    requirement,
	})
}

// GET /api/client-requirements
func (h *ClientRequirementHandler) GetRequirements(c *gin.Context) {
	userID := c.GetString("user_id")

	requirements, err := h.repo.GetRequirementsByBrokerID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to get requirements: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"requirements": requirements,
	})
}

// GET /api/client-requirements/:id
func (h *ClientRequirementHandler) GetRequirement(c *gin.Context) {
	userID := c.GetString("user_id")
	requirementID := c.Param("id")

	requirement, err := h.repo.GetRequirementByID(requirementID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to get requirement: " + err.Error(),
		})
		return
	}

	if requirement == nil {
		c.JSON(http.StatusNotFound, ErrorResponse{
			Error:   "Not found",
			Message: "Requirement not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"requirement": requirement,
	})
}

// GET /api/client-requirements/client/:clientId
func (h *ClientRequirementHandler) GetRequirementsByClient(c *gin.Context) {
	userID := c.GetString("user_id")
	clientID := c.Param("clientId")

	requirements, err := h.repo.GetRequirementsByClientID(clientID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to get requirements: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"requirements": requirements,
	})
}

// PUT /api/client-requirements/:id
func (h *ClientRequirementHandler) UpdateRequirement(c *gin.Context) {
	userID := c.GetString("user_id")
	requirementID := c.Param("id")

	var req dto.UpdateClientRequirementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	// Get existing requirement
	existing, err := h.repo.GetRequirementByID(requirementID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to get requirement: " + err.Error(),
		})
		return
	}

	if existing == nil {
		c.JSON(http.StatusNotFound, ErrorResponse{
			Error:   "Not found",
			Message: "Requirement not found",
		})
		return
	}

	// Update fields
	existing.RequirementType = req.RequirementType
	existing.BuildupArea = req.BuildupArea
	existing.CarpetArea = req.CarpetArea
	existing.MeasurementUnit = req.MeasurementUnit
	existing.MinBudget = req.MinBudget
	existing.MaxBudget = req.MaxBudget
	existing.DepositBudget = req.DepositBudget
	existing.PreferredLocation = req.PreferredLocation
	existing.City = req.City
	existing.State = req.State
	existing.PostalCode = req.PostalCode
	existing.Enquiry = req.Enquiry
	existing.Notes = req.Notes
	existing.Status = req.Status

	if err := h.repo.UpdateRequirement(existing); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to update requirement: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Requirement updated successfully",
		Data:    existing,
	})
}

// DELETE /api/client-requirements/:id
func (h *ClientRequirementHandler) DeleteRequirement(c *gin.Context) {
	userID := c.GetString("user_id")
	requirementID := c.Param("id")

	if err := h.repo.DeleteRequirement(requirementID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to delete requirement: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Requirement deleted successfully",
	})
}
