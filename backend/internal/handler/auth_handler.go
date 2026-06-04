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
	authService          *service.AuthService
	passwordResetService *service.PasswordResetService
	validator            *validator.Validate
}

func NewAuthHandler(authService *service.AuthService, passwordResetService *service.PasswordResetService) *AuthHandler {
	return &AuthHandler{
		authService:          authService,
		passwordResetService: passwordResetService,
		validator:            validator.New(),
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
			"token":         response.Token,
			"refresh_token": response.RefreshToken,
			"user":          response.User,
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
			"token":         response.Token,
			"refresh_token": response.RefreshToken,
			"user":          response.User,
		},
	})
}

// ForgotPassword sends a 6-digit OTP to the user's registered email
// POST /api/auth/forgot-password
func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request", Message: err.Error()})
		return
	}
	if err := h.passwordResetService.SendOTP(req.Email); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Email failed", Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "OTP sent to your registered email."})
}

// ResetPassword verifies the email OTP and updates the password
// POST /api/auth/reset-password
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req struct {
		Email       string `json:"email" binding:"required,email"`
		OTP         string `json:"otp" binding:"required,len=6"`
		NewPassword string `json:"new_password" binding:"required,min=6"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request", Message: err.Error()})
		return
	}

	if err := h.passwordResetService.ConsumeOTP(req.Email, req.OTP); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid OTP", Message: err.Error()})
		return
	}

	if err := h.authService.ResetPassword(req.Email, req.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Reset failed", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{Message: "Password reset successfully"})
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

// RefreshToken exchanges a valid refresh token for a new access token and refresh token
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req dto.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request body",
			Message: err.Error(),
		})
		return
	}

	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Validation failed",
			Message: err.Error(),
		})
		return
	}

	response, err := h.authService.RefreshTokens(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "Refresh token invalid",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Token refreshed successfully",
		Data: gin.H{
			"token":         response.Token,
			"refresh_token": response.RefreshToken,
			"user":          response.User,
		},
	})
}
// UpdateProfile handles profile update requests
func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	var req dto.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request body",
			Message: err.Error(),
		})
		return
	}

	if err := h.authService.UpdateProfile(userID.(string), &req); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Update failed",
			Message: err.Error(),
		})
		return
	}

	// Get updated user data
	user, err := h.authService.GetUserByID(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to retrieve updated profile",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Profile updated successfully",
		Data:    dto.ToPublicUser(user),
	})
}

// ChangePassword handles password change requests
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	var req dto.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request body",
			Message: err.Error(),
		})
		return
	}

	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Validation failed",
			Message: formatValidationErrors(err),
		})
		return
	}

	if err := h.authService.ChangePassword(userID.(string), &req); err != nil {
		if strings.Contains(err.Error(), "current password is incorrect") {
			c.JSON(http.StatusBadRequest, ErrorResponse{
				Error:   "Invalid current password",
				Message: "The current password you entered is incorrect",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Password change failed",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Password changed successfully",
	})
}