package dto

// CreateDLTTemplateRequest represents the request to create a DLT template
type CreateDLTTemplateRequest struct {
	Header          string  `json:"header" binding:"required"`
	TemplateID      *string `json:"template_id"`
	TemplateName    string  `json:"template_name" binding:"required"`
	TemplateType    string  `json:"template_type" binding:"required"` // "Promotional" or "Service"
	Category        string  `json:"category" binding:"required"`      // "FOR_SALE", "FOR_RENT", "FOR_BUY", "LIST_FOR_RENT", "SERVICES"
	Provider        *string `json:"provider"`
	TemplateContent string  `json:"template_content" binding:"required"`
	SampleContent   *string `json:"sample_content"`
	Status          string  `json:"status" binding:"required"` // "Registered", "Approved", "Active", "Inactive", "Rejected"
	VariableCount   int     `json:"variable_count"`
}

// UpdateDLTTemplateRequest represents the request to update a DLT template
type UpdateDLTTemplateRequest struct {
	Header          string  `json:"header"`
	TemplateID      *string `json:"template_id"`
	TemplateName    string  `json:"template_name"`
	TemplateType    string  `json:"template_type"`
	Category        string  `json:"category"`
	Provider        *string `json:"provider"`
	TemplateContent string  `json:"template_content"`
	SampleContent   *string `json:"sample_content"`
	Status          string  `json:"status"`
	VariableCount   int     `json:"variable_count"`
}

// SendDLTMessageRequest represents the request to send SMS using DLT template
type SendDLTMessageRequest struct {
	TemplateID     string            `json:"template_id" binding:"required"` // DLT template ID from our database
	VariableValues map[string]string `json:"variable_values"`                // Variable name -> value mapping
	ClientIDs      []string          `json:"client_ids" binding:"required"`  // List of client IDs to send to
}
