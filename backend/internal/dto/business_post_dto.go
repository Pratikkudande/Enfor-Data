package dto

// CreateBusinessPostRequest is the payload for creating a business post.
type CreateBusinessPostRequest struct {
	Title       string   `json:"title" validate:"required,min=3,max=255"`
	Category    string   `json:"category" validate:"required,oneof=furniture_office furniture_house vendor staff"`
	Subcategory string   `json:"subcategory" validate:"required"`
	Description string   `json:"description" validate:"required,min=10"`
	Price       *float64 `json:"price,omitempty" validate:"omitempty,gt=0"`
	Location    string   `json:"location" validate:"required,min=2,max=255"`
	Status      string   `json:"status,omitempty" validate:"omitempty,oneof=active sold closed"`

	ContactName     string   `json:"contact_name" validate:"required,min=2,max=200"`
	ContactPhone    string   `json:"contact_phone" validate:"required,min=10,max=20"`
	ContactEmail    *string  `json:"contact_email,omitempty" validate:"omitempty,email"`
	ContactWhatsapp *string  `json:"contact_whatsapp,omitempty"`
	ContactAddress  *string  `json:"contact_address,omitempty"`

	ServiceArea *string  `json:"service_area,omitempty"`
	Rating      *float64 `json:"rating,omitempty" validate:"omitempty,min=1,max=5"`

	Images    []string `json:"images,omitempty"`
	ResumeURL *string  `json:"resume_url,omitempty"`
}

// UpdateBusinessPostRequest allows partial updates.
type UpdateBusinessPostRequest struct {
	Title       *string  `json:"title,omitempty" validate:"omitempty,min=3,max=255"`
	Description *string  `json:"description,omitempty" validate:"omitempty,min=10"`
	Price       *float64 `json:"price,omitempty" validate:"omitempty,gt=0"`
	Location    *string  `json:"location,omitempty" validate:"omitempty,min=2,max=255"`
	Status      *string  `json:"status,omitempty" validate:"omitempty,oneof=active sold closed"`
	ServiceArea *string  `json:"service_area,omitempty"`
	Rating      *float64 `json:"rating,omitempty" validate:"omitempty,min=1,max=5"`
}
