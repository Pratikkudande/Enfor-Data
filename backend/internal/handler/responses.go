package handler

import "github.com/go-playground/validator/v10"

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
}

// SuccessResponse represents a success response
type SuccessResponse struct {
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// formatValidationErrors formats validator errors into a readable message
func formatValidationErrors(err error) string {
	if validationErrors, ok := err.(validator.ValidationErrors); ok {
		// Extract first validation error from validator.ValidationErrors
		if len(validationErrors) > 0 {
			field := validationErrors[0].Field()
			tag := validationErrors[0].Tag()

			// Format error based on tag (required, min, max, gt, oneof, email)
			switch tag {
			case "required":
				return field + " is required"
			case "min":
				return field + " must be at least " + validationErrors[0].Param() + " characters"
			case "max":
				return field + " must be at most " + validationErrors[0].Param() + " characters"
			case "gt":
				return field + " must be greater than " + validationErrors[0].Param()
			case "gte":
				return field + " must be greater than or equal to " + validationErrors[0].Param()
			case "oneof":
				return field + " must be one of: " + validationErrors[0].Param()
			case "email":
				return field + " must be a valid email address"
			default:
				return field + " validation failed"
			}
		}
	}
	// Return user-friendly error message
	return err.Error()
}
