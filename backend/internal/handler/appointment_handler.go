package handler

import (
	"net/http"
	"strings"

	"enfor-data-backend/internal/models"
	"enfor-data-backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// AppointmentHandler handles HTTP requests for appointment operations
type AppointmentHandler struct {
	appointmentService *service.AppointmentService
	validator          *validator.Validate
}

// NewAppointmentHandler creates a new AppointmentHandler instance
func NewAppointmentHandler(appointmentService *service.AppointmentService) *AppointmentHandler {
	return &AppointmentHandler{
		appointmentService: appointmentService,
		validator:          validator.New(),
	}
}

// CreateAppointment handles POST /api/appointments - creates a new appointment
func (h *AppointmentHandler) CreateAppointment(c *gin.Context) {
	// Extract broker_id from gin context (set by auth middleware)
	brokerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "Unauthorized",
			Message: "Authentication required",
		})
		return
	}

	// Parse and bind JSON request body to CreateAppointmentRequest
	var req models.CreateAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request body",
			Message: err.Error(),
		})
		return
	}

	// Validate request using validator.Struct
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Validation failed",
			Message: formatValidationErrors(err),
		})
		return
	}

	// Call service CreateAppointment method
	appointment, err := h.appointmentService.CreateAppointment(&req, brokerID.(string))
	if err != nil {
		// Return 400 for business logic errors (invalid client_id, property_id, ownership)
		if strings.Contains(err.Error(), "invalid client_id") ||
			strings.Contains(err.Error(), "invalid property_id") ||
			strings.Contains(err.Error(), "does not belong") {
			c.JSON(http.StatusBadRequest, ErrorResponse{
				Error:   "Validation failed",
				Message: err.Error(),
			})
			return
		}

		// Return 500 for server errors
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to create appointment",
		})
		return
	}

	// Return 201 with created appointment on success
	c.JSON(http.StatusCreated, SuccessResponse{
		Message: "Appointment created successfully",
		Data:    appointment,
	})
}

// GetAppointments handles GET /api/appointments - retrieves all appointments for authenticated broker
func (h *AppointmentHandler) GetAppointments(c *gin.Context) {
	// Extract broker_id from gin context (set by auth middleware)
	brokerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "Unauthorized",
			Message: "Authentication required",
		})
		return
	}

	// Parse query parameters for filters
	filters := models.AppointmentFilters{}
	
	if status := c.Query("status"); status != "" {
		filters.Status = &status
	}
	
	if date := c.Query("date"); date != "" {
		filters.Date = &date
	}
	
	if appointmentType := c.Query("type"); appointmentType != "" {
		filters.Type = &appointmentType
	}
	
	if clientID := c.Query("client_id"); clientID != "" {
		filters.ClientID = &clientID
	}
	
	if startDate := c.Query("start_date"); startDate != "" {
		filters.StartDate = &startDate
	}
	
	if endDate := c.Query("end_date"); endDate != "" {
		filters.EndDate = &endDate
	}

	// Call service GetBrokerAppointments with filters
	appointments, err := h.appointmentService.GetBrokerAppointments(brokerID.(string), filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to retrieve appointments",
		})
		return
	}

	// Return 200 with appointments array
	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Appointments retrieved successfully",
		Data:    appointments,
	})
}

// GetAppointmentStats handles GET /api/appointments/stats - retrieves appointment statistics
func (h *AppointmentHandler) GetAppointmentStats(c *gin.Context) {
	// Extract broker_id from gin context (set by auth middleware)
	brokerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "Unauthorized",
			Message: "Authentication required",
		})
		return
	}

	// Call service GetAppointmentStats method
	stats, err := h.appointmentService.GetAppointmentStats(brokerID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to retrieve appointment statistics",
		})
		return
	}

	// Return 200 with statistics object
	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Appointment statistics retrieved successfully",
		Data:    stats,
	})
}

// GetAppointment handles GET /api/appointments/:id - retrieves a specific appointment
func (h *AppointmentHandler) GetAppointment(c *gin.Context) {
	// Extract broker_id from gin context (set by auth middleware)
	brokerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "Unauthorized",
			Message: "Authentication required",
		})
		return
	}

	// Extract appointment id from URL parameter
	appointmentID := c.Param("id")

	// Call service GetAppointmentByID method
	appointment, err := h.appointmentService.GetAppointmentByID(appointmentID, brokerID.(string))
	if err != nil {
		// Return 404 if not found or access denied
		if strings.Contains(err.Error(), "not found") ||
			strings.Contains(err.Error(), "access denied") {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error:   "Not found",
				Message: "Appointment not found",
			})
			return
		}

		// Return 500 for server errors
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to retrieve appointment",
		})
		return
	}

	// Return 200 with appointment
	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Appointment retrieved successfully",
		Data:    appointment,
	})
}

// UpdateAppointment handles PUT /api/appointments/:id - updates a specific appointment
func (h *AppointmentHandler) UpdateAppointment(c *gin.Context) {
	// Extract broker_id from gin context (set by auth middleware)
	brokerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "Unauthorized",
			Message: "Authentication required",
		})
		return
	}

	// Extract appointment id from URL parameter
	appointmentID := c.Param("id")

	// Parse and bind JSON request body to UpdateAppointmentRequest
	var req models.UpdateAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request body",
			Message: err.Error(),
		})
		return
	}

	// Validate request using validator.Struct
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Validation failed",
			Message: formatValidationErrors(err),
		})
		return
	}

	// Call service UpdateAppointment method
	appointment, err := h.appointmentService.UpdateAppointment(appointmentID, &req, brokerID.(string))
	if err != nil {
		// Return 404 if not found or access denied
		if strings.Contains(err.Error(), "not found") ||
			strings.Contains(err.Error(), "access denied") {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error:   "Not found",
				Message: "Appointment not found",
			})
			return
		}

		// Return 400 for business logic errors (invalid client_id, property_id, ownership)
		if strings.Contains(err.Error(), "invalid client_id") ||
			strings.Contains(err.Error(), "invalid property_id") ||
			strings.Contains(err.Error(), "does not belong") {
			c.JSON(http.StatusBadRequest, ErrorResponse{
				Error:   "Validation failed",
				Message: err.Error(),
			})
			return
		}

		// Return 500 for server errors
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to update appointment",
		})
		return
	}

	// Return 200 with updated appointment
	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Appointment updated successfully",
		Data:    appointment,
	})
}

// DeleteAppointment handles DELETE /api/appointments/:id - deletes a specific appointment
func (h *AppointmentHandler) DeleteAppointment(c *gin.Context) {
	// Extract broker_id from gin context (set by auth middleware)
	brokerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "Unauthorized",
			Message: "Authentication required",
		})
		return
	}

	// Extract appointment id from URL parameter
	appointmentID := c.Param("id")

	// Call service DeleteAppointment method
	err := h.appointmentService.DeleteAppointment(appointmentID, brokerID.(string))
	if err != nil {
		// Return 404 if not found or access denied
		if strings.Contains(err.Error(), "not found") ||
			strings.Contains(err.Error(), "access denied") {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error:   "Not found",
				Message: "Appointment not found",
			})
			return
		}

		// Return 500 for server errors
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to delete appointment",
		})
		return
	}

	// Return 200 with success message
	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Appointment deleted successfully",
	})
}
