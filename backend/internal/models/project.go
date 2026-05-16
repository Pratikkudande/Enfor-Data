package models

import "time"

// Project represents a real estate development project listed by a channel partner
type Project struct {
	ID                string    `json:"id" db:"id"`
	Name              string    `json:"name" db:"name"`
	BuilderName       string    `json:"builder_name" db:"builder_name"`
	ProjectType       string    `json:"project_type" db:"project_type"` // residential | commercial | mixed
	Description       string    `json:"description" db:"description"`
	Location          string    `json:"location" db:"location"`
	Address           string    `json:"address" db:"address"`
	City              string    `json:"city" db:"city"`
	State             string    `json:"state" db:"state"`
	TotalUnits        int       `json:"total_units" db:"total_units"`
	AvailableUnits    int       `json:"available_units" db:"available_units"`
	PriceRangeMin     float64   `json:"price_range_min" db:"price_range_min"`
	PriceRangeMax     float64   `json:"price_range_max" db:"price_range_max"`
	Amenities         []string  `json:"amenities" db:"amenities"`
	LaunchDate        time.Time `json:"launch_date" db:"launch_date"`
	PossessionDate    time.Time `json:"possession_date" db:"possession_date"`
	Status            string    `json:"status" db:"status"` // upcoming | launched | under_construction | ready | sold_out
	BrochureURL       *string   `json:"brochure_url,omitempty" db:"brochure_url"`
	ChannelPartnerID  string    `json:"channel_partner_id" db:"channel_partner_id"`
	PartnerName       *string   `json:"partner_name,omitempty" db:"partner_name"`
	PartnerFirm       *string   `json:"partner_firm,omitempty" db:"partner_firm"`
	CreatedAt         time.Time `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time `json:"updated_at" db:"updated_at"`
}
