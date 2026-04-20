package handler

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"enfor-data-backend/internal/config"
	"enfor-data-backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UploadHandler struct {
	authService *service.AuthService
	config      *config.Config
}

func NewUploadHandler(authService *service.AuthService, cfg *config.Config) *UploadHandler {
	return &UploadHandler{
		authService: authService,
		config:      cfg,
	}
}

// UploadProfilePhoto handles profile photo upload
func (h *UploadHandler) UploadProfilePhoto(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error: "Unauthorized",
		})
		return
	}

	// Parse multipart form
	file, header, err := c.Request.FormFile("profile_photo")
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "No file provided",
			Message: "Please provide a profile photo",
		})
		return
	}
	defer file.Close()

	// Validate file size
	if header.Size > h.config.Upload.MaxFileSize {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "File too large",
			Message: fmt.Sprintf("File size must be less than %d MB", h.config.Upload.MaxFileSize/1024/1024),
		})
		return
	}

	// Validate file type
	if !isValidImageType(header.Filename) {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Invalid file type",
			Message: "Only JPEG, PNG, GIF, and WebP images are allowed",
		})
		return
	}

	// Create uploads directory if it doesn't exist
	uploadDir := h.config.Upload.Path
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to create upload directory",
			Message: err.Error(),
		})
		return
	}

	// Generate unique filename
	ext := filepath.Ext(header.Filename)
	fileName := fmt.Sprintf("%s_%d%s", uuid.New().String(), time.Now().Unix(), ext)
	filePath := filepath.Join(uploadDir, fileName)

	// Create destination file
	dst, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to create file",
			Message: err.Error(),
		})
		return
	}
	defer dst.Close()

	// Copy uploaded file to destination
	if _, err := io.Copy(dst, file); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to save file",
			Message: err.Error(),
		})
		return
	}

	// Generate file URL (you might want to use your domain here)
	fileURL := fmt.Sprintf("/uploads/%s", fileName)

	// Update user's profile image in database
	err = h.authService.UpdateProfileImage(userID.(string), fileURL)
	if err != nil {
		// Clean up uploaded file if database update fails
		os.Remove(filePath)
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Failed to update profile",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Message: "Profile photo uploaded successfully",
		Data: gin.H{
			"profile_image": fileURL,
		},
	})
}

// ServeUploadedFile serves uploaded files
func (h *UploadHandler) ServeUploadedFile(c *gin.Context) {
	filename := c.Param("filename")

	// Security check: prevent directory traversal
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") || strings.Contains(filename, "\\") {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: "Invalid filename",
		})
		return
	}

	filePath := filepath.Join(h.config.Upload.Path, filename)

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, ErrorResponse{
			Error: "File not found",
		})
		return
	}

	c.File(filePath)
}

// isValidImageType checks if the file extension is a valid image type
func isValidImageType(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	validExtensions := []string{".jpg", ".jpeg", ".png", ".gif", ".webp"}

	for _, validExt := range validExtensions {
		if ext == validExt {
			return true
		}
	}
	return false
}
