package dto

// CreatePropertyRequest represents the data required for creating a new property
type CreatePropertyRequest struct {
	// Basic Property Information
	Title       string `json:"title" validate:"required,min=5,max=255"`
	Type        string `json:"type" validate:"required,oneof=apartment house commercial plot row_house shop pg bungalow"`
	ListingType string `json:"listing_type" validate:"required,oneof=sale rent"`

	// Pricing and Size
	Price float64 `json:"price" validate:"required,gt=0"`
	Area  float64 `json:"area" validate:"required,gt=0"`

	// Property Details (optional for commercial/plot)
	Bedrooms  *int `json:"bedrooms,omitempty" validate:"omitempty,gte=0"`
	Bathrooms *int `json:"bathrooms,omitempty" validate:"omitempty,gte=0"`

	// Location Information
	Location string `json:"location" validate:"required,min=2,max=255"`
	Address  string `json:"address" validate:"required,min=10"`
	City     string `json:"city" validate:"required,min=2,max=100"`
	State    string `json:"state" validate:"required,min=2,max=100"`

	// Description and Features
	Description string   `json:"description" validate:"required,min=20"`
	Amenities   []string `json:"amenities"`
	Photos      []string `json:"photos,omitempty"`

	// Optional linked client
	ClientID *string `json:"client_id,omitempty" validate:"omitempty"`
}

// UpdatePropertyRequest represents the data that can be updated for an existing property
type UpdatePropertyRequest struct {
	// Basic Property Information
	Title       *string `json:"title,omitempty" validate:"omitempty,min=5,max=255"`
	Type        *string `json:"type,omitempty" validate:"omitempty,oneof=apartment house commercial plot row_house shop pg bungalow"`
	ListingType *string `json:"listing_type,omitempty" validate:"omitempty,oneof=sale rent"`

	// Pricing and Size
	Price *float64 `json:"price,omitempty" validate:"omitempty,gt=0"`
	Area  *float64 `json:"area,omitempty" validate:"omitempty,gt=0"`

	// Property Details
	Bedrooms  *int `json:"bedrooms,omitempty" validate:"omitempty,gte=0"`
	Bathrooms *int `json:"bathrooms,omitempty" validate:"omitempty,gte=0"`

	// Location Information
	Location *string `json:"location,omitempty" validate:"omitempty,min=2,max=255"`
	Address  *string `json:"address,omitempty" validate:"omitempty,min=10"`
	City     *string `json:"city,omitempty" validate:"omitempty,min=2,max=100"`
	State    *string `json:"state,omitempty" validate:"omitempty,min=2,max=100"`

	// Description and Features
	Description *string  `json:"description,omitempty" validate:"omitempty,min=20"`
	Amenities   []string `json:"amenities,omitempty"`
	Photos      []string `json:"photos,omitempty"`

	// Optional linked client
	ClientID *string `json:"client_id,omitempty" validate:"omitempty"`

	// Status
	Status *string `json:"status,omitempty" validate:"omitempty,oneof=available sold rented hold closed under_discussion"`
}
