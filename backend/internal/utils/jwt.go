package utils

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID    string `json:"user_id"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	TokenType string `json:"token_type"`
	jwt.RegisteredClaims
}

type JWTUtil struct {
	secretKey        []byte
	accessExpiresIn  time.Duration
	refreshExpiresIn time.Duration
}

func NewJWTUtil(secret string, accessExpiresIn, refreshExpiresIn time.Duration) *JWTUtil {
	return &JWTUtil{
		secretKey:        []byte(secret),
		accessExpiresIn:  accessExpiresIn,
		refreshExpiresIn: refreshExpiresIn,
	}
}

func (j *JWTUtil) generateToken(userID, email, role, tokenType string, expiresIn time.Duration) (string, error) {
	claims := &Claims{
		UserID:    userID,
		Email:     email,
		Role:      role,
		TokenType: tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiresIn)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "enfor-data-backend",
			Subject:   userID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(j.secretKey)
}

// GenerateToken creates a new access JWT token for a user
func (j *JWTUtil) GenerateToken(userID, email, role string) (string, error) {
	return j.generateToken(userID, email, role, "access", j.accessExpiresIn)
}

// GenerateRefreshToken creates a new refresh JWT token for a user
func (j *JWTUtil) GenerateRefreshToken(userID, email, role string) (string, error) {
	return j.generateToken(userID, email, role, "refresh", j.refreshExpiresIn)
}

// ValidateToken validates a JWT token and returns the claims
func (j *JWTUtil) ValidateToken(tokenString, expectedType string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate the signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return j.secretKey, nil
	})

	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		if expectedType != "" && claims.TokenType != expectedType {
			return nil, fmt.Errorf("invalid token type: expected %s", expectedType)
		}
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token claims")
}

func (j *JWTUtil) ValidateAccessToken(tokenString string) (*Claims, error) {
	return j.ValidateToken(tokenString, "access")
}

func (j *JWTUtil) ValidateRefreshToken(tokenString string) (*Claims, error) {
	return j.ValidateToken(tokenString, "refresh")
}

// RefreshToken generates a new access token with updated expiration time
func (j *JWTUtil) RefreshToken(claims *Claims) (string, error) {
	return j.generateToken(claims.UserID, claims.Email, claims.Role, "access", j.accessExpiresIn)
}
