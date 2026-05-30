package handler

import (
	"net/http"
	"strings"

	"enfor-data-backend/internal/dto"
	"enfor-data-backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// StaffHandler handles HTTP requests for staff listings.
type StaffHandler struct {
	svc       *service.StaffService
	validator *validator.Validate
}

func NewStaffHandler(svc *service.StaffService) *StaffHandler {
	return &StaffHandler{svc: svc, validator: validator.New()}
}

// GetStaff handles GET /api/staff
// Query params: type (available|required), location
func (h *StaffHandler) GetStaff(c *gin.Context) {
	list, err := h.svc.GetAll(c.Query("type"), c.Query("location"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch staff listings", Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": list, "count": len(list)})
}

// GetMyStaff handles GET /api/staff/my
func (h *StaffHandler) GetMyStaff(c *gin.Context) {
	userID := c.GetString("user_id")
	list, err := h.svc.GetMyListings(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch staff listings", Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": list, "count": len(list)})
}

// GetStaffMember handles GET /api/staff/:id
func (h *StaffHandler) GetStaffMember(c *gin.Context) {
	member, err := h.svc.GetByID(c.Param("id"))
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Staff listing not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": member})
}

// CreateStaff handles POST /api/staff
func (h *StaffHandler) CreateStaff(c *gin.Context) {
	userID := c.GetString("user_id")

	var req dto.CreateStaffRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request body", Message: err.Error()})
		return
	}
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Validation failed", Message: formatValidationErrors(err)})
		return
	}

	member, err := h.svc.Create(&req, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create staff listing", Message: err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Staff listing created successfully", "data": member})
}

// UpdateStaff handles PUT /api/staff/:id
func (h *StaffHandler) UpdateStaff(c *gin.Context) {
	userID := c.GetString("user_id")

	var req dto.UpdateStaffRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request body", Message: err.Error()})
		return
	}

	member, err := h.svc.Update(c.Param("id"), &req, userID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Staff listing not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to update staff listing", Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Staff listing updated successfully", "data": member})
}

// DeleteStaff handles DELETE /api/staff/:id
func (h *StaffHandler) DeleteStaff(c *gin.Context) {
	userID := c.GetString("user_id")
	if err := h.svc.Delete(c.Param("id"), userID); err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Staff listing not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to delete staff listing", Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Staff listing deleted successfully"})
}
