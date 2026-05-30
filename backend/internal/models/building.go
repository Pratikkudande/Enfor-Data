package models

import "time"

// BuildingContact represents a building owner's contact stored for marketing/lead generation.
type BuildingContact struct {
	ID           string  `json:"id" db:"id"`
	OwnerName    *string `json:"owner_name,omitempty" db:"owner_name"`
	MobileNumber string  `json:"mobile_number" db:"mobile_number"`
	BuildingName *string `json:"building_name,omitempty" db:"building_name"`
	Area         *string `json:"area,omitempty" db:"area"`
	Notes        *string `json:"notes,omitempty" db:"notes"`

	BrokerID   string  `json:"broker_id" db:"broker_id"`
	BrokerName *string `json:"broker_name,omitempty" db:"broker_name"`
	BrokerCity *string `json:"broker_city,omitempty" db:"broker_city"`

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}
