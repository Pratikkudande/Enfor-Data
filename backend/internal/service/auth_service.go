package service

import (
	"enfor-data-backend/internal/dto"
	"fmt"
	"time"

	"enfor-data-backend/internal/config"
	"enfor-data-backend/internal/models"
	"enfor-data-backend/internal/repository"
	"enfor-data-backend/internal/utils"

	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo *repository.UserRepository
	jwtUtil  *utils.JWTUtil
}

func NewAuthService(userRepo *repository.UserRepository, cfg *config.Config) *AuthService {
	jwtUtil := utils.NewJWTUtil(cfg.JWT.Secret, cfg.JWT.ExpiresIn)
	return &AuthService{
		userRepo: userRepo,
		jwtUtil:  jwtUtil,
	}
}

// Signup creates a new user account
func (s *AuthService) Signup(req *dto.SignupRequest) (*dto.LoginResponse, error) {
	// Check if email already exists
	exists, err := s.userRepo.EmailExists(req.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to check email existence: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("email already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Parse date of birth
	dateOfBirth, err := time.Parse("2006-01-02", req.DateOfBirth)
	if err != nil {
		return nil, fmt.Errorf("invalid date of birth format, use YYYY-MM-DD: %w", err)
	}

	// Create user model
	user := &models.User{
		FirstName:      req.FirstName,
		LastName:       req.LastName,
		Email:          req.Email,
		PasswordHash:   string(hashedPassword),
		DateOfBirth:    &dateOfBirth,
		FirmName:       req.FirmName,
		Role:           req.Role,
		WhatsappNumber: req.WhatsappNumber,
		Address:        req.Address,
		Location:       req.Location,
		City:           req.City,
		State:          req.State,
		PostalCode:     req.PostalCode,
	}

	// Set optional fields
	if req.AlternativeNumber != "" {
		user.AlternativeNumber = &req.AlternativeNumber
	}
	if req.ForeignNumber != "" {
		user.ForeignNumber = &req.ForeignNumber
	}

	// Save user to database
	if err := s.userRepo.CreateUser(user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Generate JWT token
	token, err := s.jwtUtil.GenerateToken(user.ID, user.Email, user.Role)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &dto.LoginResponse{
		Token: token,
		User:  dto.ToPublicUser(user),
	}, nil
}

// Login authenticates a user and returns a JWT token
func (s *AuthService) Login(req *dto.LoginRequest) (*dto.LoginResponse, error) {
	// Get user by email
	user, err := s.userRepo.GetUserByEmail(req.Email)
	if err != nil {
		return nil, fmt.Errorf("invalid email or password")
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, fmt.Errorf("invalid email or password")
	}

	// Generate JWT token
	token, err := s.jwtUtil.GenerateToken(user.ID, user.Email, user.Role)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &dto.LoginResponse{
		Token: token,
		User:  dto.ToPublicUser(user),
	}, nil
}

// GetUserByID retrieves a user by ID
func (s *AuthService) GetUserByID(userID string) (*models.User, error) {
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}
	return user, nil
}

// ValidateToken validates a JWT token and returns user information
func (s *AuthService) ValidateToken(tokenString string) (*utils.Claims, error) {
	return s.jwtUtil.ValidateToken(tokenString)
}

// UpdateProfileImage updates the user's profile image
func (s *AuthService) UpdateProfileImage(userID, imagePath string) error {
	return s.userRepo.UpdateUserProfileImage(userID, imagePath)
}

// GenerateToken generates a new JWT token for a user
func (s *AuthService) GenerateToken(userID, email, role string) (string, error) {
	return s.jwtUtil.GenerateToken(userID, email, role)
}
