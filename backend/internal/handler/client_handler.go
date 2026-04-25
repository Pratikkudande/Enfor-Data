package handler

import (
	"enfor-data-backend/internal/dto"
	"net/http"
	"strings"

	"enfor-data-backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// ClientHandler handles HTTP requests for client operations
type ClientHandler struct {
	clientService *service.ClientService
	validator     *validator.Validate
}

// NewClientHandler creates a new ClientHandler instance
func NewClientHandler(clientService *service.ClientService) *ClientHandler {
	return &ClientHandler{
		clientService: clientService,
		validator:     validator.New(),
	}
}

// GetClients handles GET /api/clients - retrieves all clients for authenticated broker
func (h *ClientHandler) GetClients(c *gin.Context) {
	// Extract broker_id from gin context (set by auth middleware)
	brokerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "Unauthorized",
			Message: "Authentication required",
		})
		return
	}

	// Call clientService.GetBrokerClients
	clients, err := h.clientService.GetBrokerClients(brokerID.(string))
	if err != nil {
		// Return 500 if service call fails
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to retrieve clients: " + err.Error(),
		})
		return
	}

	// Return 200 with clients array in SuccessResponse format
	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Clients retrieved successfully",
		Data:    clients,
	})
}

// CreateClient handles POST /api/clients - creates a new client
func (h *ClientHandler) CreateClient(c *gin.Context) {
	// Extract broker_id from gin context
	brokerID, exists := c.Get("user_id")
	if !exists {
		// Return 401 if broker_id not found
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "Unauthorized",
			Message: "Authentication required",
		})
		return
	}

	// Parse request body into CreateClientRequest
	var req dto.CreateClientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// Return 400 if JSON parsing fails
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request body",
			Message: err.Error(),
		})
		return
	}

	// Validate request using validator.Struct
	if err := h.validator.Struct(&req); err != nil {
		// Return 400 with formatted validation errors if validation fails
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Validation failed",
			Message: formatValidationErrors(err),
		})
		return
	}

	// Call clientService.CreateClient
	client, err := h.clientService.CreateClient(&req, brokerID.(string))
	if err != nil {
		// Return 400 for business logic errors (budget validation)
		if strings.Contains(err.Error(), "budget_min") ||
			strings.Contains(err.Error(), "budget_max") {
			c.JSON(http.StatusBadRequest, ErrorResponse{
				Error:   "Validation failed",
				Message: err.Error(),
			})
			return
		}

		// Return 500 for server errors
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to create client",
		})
		return
	}

	// Return 201 with created client in SuccessResponse format
	c.JSON(http.StatusCreated, SuccessResponse{
		Message: "Client created successfully",
		Data:    client,
	})
}

// GetClient handles GET /api/clients/:id - retrieves a specific client
func (h *ClientHandler) GetClient(c *gin.Context) {
	// Extract broker_id from gin context
	brokerID, exists := c.Get("user_id")
	if !exists {
		// Return 401 if broker_id not found
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "Unauthorized",
			Message: "Authentication required",
		})
		return
	}

	// Extract client id from URL parameter
	clientID := c.Param("id")

	// Call clientService.GetClientByID with id and broker_id
	client, err := h.clientService.GetClientByID(clientID, brokerID.(string))
	if err != nil {
		// Return 404 if client not found or ownership verification fails
		if strings.Contains(err.Error(), "not found") ||
			strings.Contains(err.Error(), "access denied") ||
			strings.Contains(err.Error(), "does not belong") {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error:   "Not found",
				Message: "Client not found",
			})
			return
		}

		// Return 500 for server errors
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to retrieve client",
		})
		return
	}

	// Return 200 with client in SuccessResponse format
	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Client retrieved successfully",
		Data:    client,
	})
}

// UpdateClient handles PUT /api/clients/:id - updates a specific client
func (h *ClientHandler) UpdateClient(c *gin.Context) {
	// Extract broker_id from gin context
	brokerID, exists := c.Get("user_id")
	if !exists {
		// Return 401 if broker_id not found
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "Unauthorized",
			Message: "Authentication required",
		})
		return
	}

	// Extract client id from URL parameter
	clientID := c.Param("id")

	// Parse request body into UpdateClientRequest
	var req dto.UpdateClientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// Return 400 if JSON parsing fails
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request body",
			Message: err.Error(),
		})
		return
	}

	// Validate request using validator.Struct
	if err := h.validator.Struct(&req); err != nil {
		// Return 400 with formatted validation errors if validation fails
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Validation failed",
			Message: formatValidationErrors(err),
		})
		return
	}

	// Call clientService.UpdateClient
	client, err := h.clientService.UpdateClient(clientID, &req, brokerID.(string))
	if err != nil {
		// Return 404 if client not found or ownership verification fails
		if strings.Contains(err.Error(), "not found") ||
			strings.Contains(err.Error(), "access denied") ||
			strings.Contains(err.Error(), "does not belong") {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error:   "Not found",
				Message: "Client not found",
			})
			return
		}

		// Return 400 for business logic errors
		if strings.Contains(err.Error(), "budget_min") ||
			strings.Contains(err.Error(), "budget_max") {
			c.JSON(http.StatusBadRequest, ErrorResponse{
				Error:   "Validation failed",
				Message: err.Error(),
			})
			return
		}

		// Return 500 for server errors
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to update client",
		})
		return
	}

	// Return 200 with updated client in SuccessResponse format
	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Client updated successfully",
		Data:    client,
	})
}

// DeleteClient handles DELETE /api/clients/:id - deletes a specific client
func (h *ClientHandler) DeleteClient(c *gin.Context) {
	// Extract broker_id from gin context
	brokerID, exists := c.Get("user_id")
	if !exists {
		// Return 401 if broker_id not found
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "Unauthorized",
			Message: "Authentication required",
		})
		return
	}

	// Extract client id from URL parameter
	clientID := c.Param("id")

	// Call clientService.DeleteClient with id and broker_id
	err := h.clientService.DeleteClient(clientID, brokerID.(string))
	if err != nil {
		// Return 404 if client not found or ownership verification fails
		if strings.Contains(err.Error(), "not found") ||
			strings.Contains(err.Error(), "access denied") ||
			strings.Contains(err.Error(), "does not belong") {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error:   "Not found",
				Message: "Client not found",
			})
			return
		}

		// Return 500 for server errors
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to delete client",
		})
		return
	}

	// Return 200 with success message
	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Client deleted successfully",
	})
}
