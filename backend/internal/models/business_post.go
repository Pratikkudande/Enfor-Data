package models

import "time"

// BusinessPost represents a business post in the network feed.
type BusinessPost struct {
	ID          string  `json:"id" db:"id"`
	UserID      string  `json:"user_id" db:"user_id"`
	Title       string  `json:"title" db:"title"`
	Category    string  `json:"category" db:"category"`   // furniture_office | furniture_house | vendor | staff
	Subcategory string  `json:"subcategory" db:"subcategory"` // sale | rent | requirement | rent_agreement | house_service | flat_cleaner | pest_controller
	Description string  `json:"description" db:"description"`
	Price       *float64 `json:"price,omitempty" db:"price"`
	Location    string  `json:"location" db:"location"`
	Status      string  `json:"status" db:"status"` // active | sold | closed

	// Contact info (stored as flat columns for simplicity)
	ContactName    string  `json:"contact_name" db:"contact_name"`
	ContactPhone   string  `json:"contact_phone" db:"contact_phone"`
	ContactEmail   *string `json:"contact_email,omitempty" db:"contact_email"`
	ContactWhatsapp *string `json:"contact_whatsapp,omitempty" db:"contact_whatsapp"`
	ContactAddress *string `json:"contact_address,omitempty" db:"contact_address"`

	// Vendor-specific
	ServiceArea *string  `json:"service_area,omitempty" db:"service_area"`
	Rating      *float64 `json:"rating,omitempty" db:"rating"`

	// Images stored as array
	Images []string `json:"images" db:"images"`

	// Resume URL (staff posts)
	ResumeURL *string `json:"resume_url,omitempty" db:"resume_url"`

	// Denormalized poster info
	PosterName *string `json:"poster_name,omitempty" db:"poster_name"`

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}
