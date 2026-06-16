package handler

import (
	"net/http"
	"strings"

	"enfor-data-backend/internal/dto"
	"enfor-data-backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type ProjectHandler struct {
	projectService      *service.ProjectService
	notificationService *service.NotificationService
	validator           *validator.Validate
}

func NewProjectHandler(projectService *service.ProjectService, notificationService *service.NotificationService) *ProjectHandler {
	return &ProjectHandler{
		projectService:      projectService,
		notificationService: notificationService,
		validator:           validator.New(),
	}
}

// CreateProject handles POST /api/projects
func (h *ProjectHandler) CreateProject(c *gin.Context) {
	partnerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}
	var req dto.CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request body", Message: err.Error()})
		return
	}
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Validation failed", Message: formatValidationErrors(err)})
		return
	}
	project, err := h.projectService.Create(&req, partnerID.(string))
	if err != nil {
		if strings.Contains(err.Error(), "invalid") || strings.Contains(err.Error(), "cannot exceed") || strings.Contains(err.Error(), "must be") {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Validation failed", Message: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Internal server error", Message: "Failed to create project"})
		return
	}
	// Notify the partner's connections (preference-gated) in the background.
	if h.notificationService != nil {
		go h.notificationService.NotifyProjectAdded(partnerID.(string), project.ID, project.Name)
	}

	c.JSON(http.StatusCreated, SuccessResponse{Message: "Project created successfully", Data: project})
}

// GetMyProjects handles GET /api/projects — returns only the partner's own projects
func (h *ProjectHandler) GetMyProjects(c *gin.Context) {
	partnerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}
	projects, err := h.projectService.GetByPartner(partnerID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Internal server error", Message: "Failed to retrieve projects"})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "Projects retrieved successfully", Data: projects})
}

// GetAllProjects handles GET /api/projects/all — read-only for all authenticated users (brokers)
func (h *ProjectHandler) GetAllProjects(c *gin.Context) {
	projects, err := h.projectService.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Internal server error", Message: "Failed to retrieve projects"})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "Projects retrieved successfully", Data: projects})
}

// GetProject handles GET /api/projects/:id
func (h *ProjectHandler) GetProject(c *gin.Context) {
	partnerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}
	project, err := h.projectService.GetByID(c.Param("id"), partnerID.(string))
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Not found", Message: "Project not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Internal server error"})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "Project retrieved successfully", Data: project})
}

// UpdateProject handles PUT /api/projects/:id
func (h *ProjectHandler) UpdateProject(c *gin.Context) {
	partnerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}
	var req dto.UpdateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request body", Message: err.Error()})
		return
	}
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Validation failed", Message: formatValidationErrors(err)})
		return
	}
	project, err := h.projectService.Update(c.Param("id"), &req, partnerID.(string))
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Not found", Message: "Project not found"})
			return
		}
		if strings.Contains(err.Error(), "invalid") || strings.Contains(err.Error(), "cannot exceed") || strings.Contains(err.Error(), "must be") {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Validation failed", Message: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Internal server error", Message: "Failed to update project"})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "Project updated successfully", Data: project})
}

// DeleteProject handles DELETE /api/projects/:id
func (h *ProjectHandler) DeleteProject(c *gin.Context) {
	partnerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}
	if err := h.projectService.Delete(c.Param("id"), partnerID.(string)); err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Not found", Message: "Project not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Internal server error", Message: "Failed to delete project"})
		return
	}
	c.JSON(http.StatusOK, SuccessResponse{Message: "Project deleted successfully"})
}
