package dto

// CreateProjectRequest is the payload for POST /api/projects
type CreateProjectRequest struct {
	Name           string   `json:"name"            validate:"required,min=3,max=255"`
	BuilderName    string   `json:"builder_name"    validate:"required,min=2,max=255"`
	ProjectType    string   `json:"project_type"    validate:"required,oneof=residential commercial mixed"`
	Description    string   `json:"description"     validate:"required,min=20"`
	Location       string   `json:"location"        validate:"required,min=2,max=255"`
	Address        string   `json:"address"         validate:"required,min=5"`
	City           string   `json:"city"            validate:"required,min=2,max=100"`
	State          string   `json:"state"           validate:"required,min=2,max=100"`
	TotalUnits     int      `json:"total_units"     validate:"required,gt=0"`
	AvailableUnits int      `json:"available_units" validate:"gte=0"`
	PriceRangeMin  float64  `json:"price_range_min" validate:"required,gt=0"`
	PriceRangeMax  float64  `json:"price_range_max" validate:"required,gt=0"`
	Amenities      []string `json:"amenities"`
	LaunchDate     string   `json:"launch_date"     validate:"required"`
	PossessionDate string   `json:"possession_date" validate:"required"`
	Status         string   `json:"status"          validate:"required,oneof=upcoming launched under_construction ready sold_out"`
	BrochureURL    *string  `json:"brochure_url,omitempty"`
}

// UpdateProjectRequest is the payload for PUT /api/projects/:id
type UpdateProjectRequest struct {
	Name           *string  `json:"name,omitempty"            validate:"omitempty,min=3,max=255"`
	BuilderName    *string  `json:"builder_name,omitempty"    validate:"omitempty,min=2,max=255"`
	ProjectType    *string  `json:"project_type,omitempty"    validate:"omitempty,oneof=residential commercial mixed"`
	Description    *string  `json:"description,omitempty"     validate:"omitempty,min=20"`
	Location       *string  `json:"location,omitempty"        validate:"omitempty,min=2,max=255"`
	Address        *string  `json:"address,omitempty"         validate:"omitempty,min=5"`
	City           *string  `json:"city,omitempty"            validate:"omitempty,min=2,max=100"`
	State          *string  `json:"state,omitempty"           validate:"omitempty,min=2,max=100"`
	TotalUnits     *int     `json:"total_units,omitempty"     validate:"omitempty,gt=0"`
	AvailableUnits *int     `json:"available_units,omitempty" validate:"omitempty,gte=0"`
	PriceRangeMin  *float64 `json:"price_range_min,omitempty" validate:"omitempty,gt=0"`
	PriceRangeMax  *float64 `json:"price_range_max,omitempty" validate:"omitempty,gt=0"`
	Amenities      []string `json:"amenities,omitempty"`
	LaunchDate     *string  `json:"launch_date,omitempty"`
	PossessionDate *string  `json:"possession_date,omitempty"`
	Status         *string  `json:"status,omitempty"          validate:"omitempty,oneof=upcoming launched under_construction ready sold_out"`
	BrochureURL    *string  `json:"brochure_url,omitempty"`
}
