package handler

import (
	"net/http"
	"strings"

	"enfor-data-backend/internal/dto"
	"enfor-data-backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// BusinessPostHandler handles HTTP requests for business posts.
type BusinessPostHandler struct {
	svc       *service.BusinessPostService
	validator *validator.Validate
}

func NewBusinessPostHandler(svc *service.BusinessPostService) *BusinessPostHandler {
	return &BusinessPostHandler{svc: svc, validator: validator.New()}
}

// GetPosts handles GET /api/business-posts
// Query params: category, subcategory, location
func (h *BusinessPostHandler) GetPosts(c *gin.Context) {
	posts, err := h.svc.GetAll(
		c.Query("category"),
		c.Query("subcategory"),
		c.Query("location"),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch posts", Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": posts, "count": len(posts)})
}

// GetMyPosts handles GET /api/business-posts/my
func (h *BusinessPostHandler) GetMyPosts(c *gin.Context) {
	userID := c.GetString("user_id")
	posts, err := h.svc.GetMyPosts(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch posts", Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": posts, "count": len(posts)})
}

// GetPost handles GET /api/business-posts/:id
func (h *BusinessPostHandler) GetPost(c *gin.Context) {
	post, err := h.svc.GetByID(c.Param("id"))
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Post not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": post})
}

// CreatePost handles POST /api/business-posts
func (h *BusinessPostHandler) CreatePost(c *gin.Context) {
	userID := c.GetString("user_id")

	var req dto.CreateBusinessPostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request body", Message: err.Error()})
		return
	}
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Validation failed", Message: formatValidationErrors(err)})
		return
	}

	post, err := h.svc.Create(&req, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create post", Message: err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Post created successfully", "data": post})
}

// UpdatePost handles PUT /api/business-posts/:id
func (h *BusinessPostHandler) UpdatePost(c *gin.Context) {
	userID := c.GetString("user_id")

	var req dto.UpdateBusinessPostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request body", Message: err.Error()})
		return
	}

	post, err := h.svc.Update(c.Param("id"), &req, userID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Post not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to update post", Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Post updated successfully", "data": post})
}

// DeletePost handles DELETE /api/business-posts/:id
func (h *BusinessPostHandler) DeletePost(c *gin.Context) {
	userID := c.GetString("user_id")
	if err := h.svc.Delete(c.Param("id"), userID); err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Post not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to delete post", Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Post deleted successfully"})
}
