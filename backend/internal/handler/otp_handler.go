package handler

import (
	"net/http"

	"enfor-data-backend/internal/models"
	"enfor-data-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type OTPHandler struct {
	otpService *service.OTPService
}

func NewOTPHandler(otpService *service.OTPService) *OTPHandler {
	return &OTPHandler{
		otpService: otpService,
	}
}

// SendOTP handles OTP generation and sending
// POST /api/auth/send-otp
func (h *OTPHandler) SendOTP(c *gin.Context) {
	var req models.SendOTPRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	// Get client IP and user agent
	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	// Send OTP
	response, err := h.otpService.SendOTP(req.MobileNumber, req.Purpose, ipAddress, userAgent)
	if err != nil {
		// Check for rate limiting errors
		if err.Error() == "too many OTP requests. Please try again after 15 minutes" {
			c.JSON(http.StatusTooManyRequests, ErrorResponse{
				Error:   "Rate limit exceeded",
				Message: err.Error(),
			})
			return
		}

		// Check for cooldown errors
		if len(err.Error()) > 11 && err.Error()[:11] == "please wait" {
			c.JSON(http.StatusTooManyRequests, ErrorResponse{
				Error:   "Too soon to resend",
				Message: err.Error(),
			})
			return
		}

		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to send OTP",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "OTP sent successfully",
		Data:    response,
	})
}

// VerifyOTP handles OTP verification
// POST /api/auth/verify-otp
func (h *OTPHandler) VerifyOTP(c *gin.Context) {
	var req models.VerifyOTPRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	// Verify OTP
	response, err := h.otpService.VerifyOTP(req.OTPID, req.MobileNumber, req.OTPCode)
	if err != nil {
		// Check for specific error types
		errorMsg := err.Error()
		
		switch errorMsg {
		case "invalid OTP ID", "mobile number mismatch":
			c.JSON(http.StatusBadRequest, ErrorResponse{
				Error:   "Invalid request",
				Message: errorMsg,
			})
			return
		case "OTP already used":
			c.JSON(http.StatusConflict, ErrorResponse{
				Error:   "OTP already used",
				Message: "This OTP has already been verified",
			})
			return
		case "OTP has expired":
			c.JSON(http.StatusGone, ErrorResponse{
				Error:   "OTP expired",
				Message: "This OTP has expired. Please request a new one",
			})
			return
		case "maximum verification attempts exceeded":
			c.JSON(http.StatusTooManyRequests, ErrorResponse{
				Error:   "Too many attempts",
				Message: "Maximum verification attempts exceeded. Please request a new OTP",
			})
			return
		default:
			// Invalid OTP code
			c.JSON(http.StatusUnauthorized, ErrorResponse{
				Error:   "Verification failed",
				Message: errorMsg,
			})
			return
		}
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Mobile number verified successfully",
		Data:    response,
	})
}

// ResendOTP handles OTP resending
// POST /api/auth/resend-otp
func (h *OTPHandler) ResendOTP(c *gin.Context) {
	var req models.ResendOTPRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	// Resend OTP
	response, err := h.otpService.ResendOTP(req.OTPID, req.MobileNumber)
	if err != nil {
		// Check for rate limiting errors
		if err.Error() == "too many OTP requests. Please try again after 15 minutes" {
			c.JSON(http.StatusTooManyRequests, ErrorResponse{
				Error:   "Rate limit exceeded",
				Message: err.Error(),
			})
			return
		}

		// Check for cooldown errors
		if len(err.Error()) > 11 && err.Error()[:11] == "please wait" {
			c.JSON(http.StatusTooManyRequests, ErrorResponse{
				Error:   "Too soon to resend",
				Message: err.Error(),
			})
			return
		}

		// Check for already verified
		if err.Error() == "OTP already verified" {
			c.JSON(http.StatusConflict, ErrorResponse{
				Error:   "OTP already verified",
				Message: "This OTP has already been verified",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to resend OTP",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "OTP resent successfully",
		Data:    response,
	})
}
