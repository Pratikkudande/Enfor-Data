package models

import (
	"encoding/json"
	"time"
)

// Appointment represents a scheduled appointment in the system
type Appointment struct {
	ID          string    `json:"id" db:"id"`
	Title       string    `json:"title" db:"title"`
	Description *string   `json:"description,omitempty" db:"description"`
	Date        time.Time `json:"-" db:"date"`
	TimeVal     time.Time `json:"-" db:"time"` // scanned as time.Time from postgres TIME column

	// Relationships
	ClientID   string  `json:"client_id" db:"client_id"`
	PropertyID *string `json:"property_id,omitempty" db:"property_id"`
	BrokerID   string  `json:"broker_id" db:"broker_id"`

	// Classification
	Type   string `json:"type" db:"type"`
	Status string `json:"status" db:"status"`

	// Denormalized fields for performance
	ClientName      *string `json:"client_name,omitempty" db:"client_name"`
	ClientPhone     *string `json:"client_phone,omitempty" db:"client_phone"`
	PropertyAddress *string `json:"property_address,omitempty" db:"property_address"`
	BrokerName      *string `json:"broker_name,omitempty" db:"broker_name"`
	BrokerCity      *string `json:"broker_city,omitempty" db:"broker_city"`

	// Timestamps
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// MarshalJSON formats Date and Time as plain strings for the frontend
func (a Appointment) MarshalJSON() ([]byte, error) {
	type Alias struct {
		ID              string    `json:"id"`
		Title           string    `json:"title"`
		Description     *string   `json:"description,omitempty"`
		Date            string    `json:"date"`
		Time            string    `json:"time"`
		ClientID        string    `json:"client_id"`
		PropertyID      *string   `json:"property_id,omitempty"`
		BrokerID        string    `json:"broker_id"`
		Type            string    `json:"type"`
		Status          string    `json:"status"`
		ClientName      *string   `json:"client_name,omitempty"`
		ClientPhone     *string   `json:"client_phone,omitempty"`
		PropertyAddress *string   `json:"property_address,omitempty"`
		BrokerName      *string   `json:"broker_name,omitempty"`
		BrokerCity      *string   `json:"broker_city,omitempty"`
		CreatedAt       time.Time `json:"created_at"`
		UpdatedAt       time.Time `json:"updated_at"`
	}

	return json.Marshal(Alias{
		ID:              a.ID,
		Title:           a.Title,
		Description:     a.Description,
		Date:            a.Date.Format("2006-01-02"),
		Time:            a.TimeVal.Format("15:04"),
		ClientID:        a.ClientID,
		PropertyID:      a.PropertyID,
		BrokerID:        a.BrokerID,
		Type:            a.Type,
		Status:          a.Status,
		ClientName:      a.ClientName,
		ClientPhone:     a.ClientPhone,
		PropertyAddress: a.PropertyAddress,
		BrokerName:      a.BrokerName,
		BrokerCity:      a.BrokerCity,
		CreatedAt:       a.CreatedAt,
		UpdatedAt:       a.UpdatedAt,
	})
}

