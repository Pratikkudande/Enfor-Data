package handler

import (
	"enfor-data-backend/internal/dto"
	"net/http"
	"strings"

	"enfor-data-backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type AuthHandler struct {
	authService *service.AuthService
	validator   *validator.Validate
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		validator:   validator.New(),
	}
}

// Signup handles user registration
func (h *AuthHandler) Signup(c *gin.Context) {
	var req dto.SignupRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request body",
			Message: err.Error(),
		})
		return
	}

	// Validate request
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Validation failed",
			Message: err.Error(),
		})
		return
	}

	// Create user
	response, err := h.authService.Signup(&req)
	if err != nil {
		if strings.Contains(err.Error(), "email already exists") {
			c.JSON(http.StatusConflict, ErrorResponse{
				Error:   "Email already exists",
				Message: "A user with this email already exists",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Registration failed",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, SuccessResponse{
		Message: "User registered successfully",
		Data: gin.H{
			"token": response.Token,
			"user":  response.User,
		},
	})
}

// Login handles user authentication
func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request body",
			Message: err.Error(),
		})
		return
	}

	// Validate request
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Validation failed",
			Message: err.Error(),
		})
		return
	}

	// Authenticate user
	response, err := h.authService.Login(&req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "Authentication failed",
			Message: "Invalid email or password",
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Login successful",
		Data: gin.H{
			"token": response.Token,
			"user":  response.User,
		},
	})
}

// GetMe returns the current authenticated user's information
func (h *AuthHandler) GetMe(c *gin.Context) {
	// Get user ID from context (set by middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	user, err := h.authService.GetUserByID(userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{
			Error:   "User not found",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "User profile retrieved successfully",
		Data:    dto.ToPublicUser(user),
	})
}

// Logout handles user logout (optional - mainly for client-side token removal)
func (h *AuthHandler) Logout(c *gin.Context) {
	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Logout successful",
	})
}

// RefreshToken generates a new JWT token
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	// Get token from header
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error: "Authorization header missing",
		})
		return
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	if tokenString == authHeader {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error: "Invalid token format",
		})
		return
	}

	// Validate current token
	claims, err := h.authService.ValidateToken(tokenString)
	if err != nil {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "Invalid token",
			Message: err.Error(),
		})
		return
	}

	// Get user to ensure they still exist
	user, err := h.authService.GetUserByID(claims.UserID)
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{
			Error: "User not found",
		})
		return
	}

	// Generate new token
	jwtUtil := h.authService.ValidateToken // Note: This needs to be refactored to access JWTUtil directly
	_ = jwtUtil                            // TODO: Fix this implementation

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Token refreshed successfully",
		Data: gin.H{
			"user": dto.ToPublicUser(user),
		},
	})
}
