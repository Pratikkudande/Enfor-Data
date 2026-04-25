package dto

// CreateAppointmentRequest represents the data required for creating an appointment
type CreateAppointmentRequest struct {
	Title       string  `json:"title" validate:"required,min=5,max=255"`
	Description *string `json:"description,omitempty"`
	Date        string  `json:"date" validate:"required,datetime=2006-01-02"`
	Time        string  `json:"time" validate:"required,datetime=15:04"`
	ClientID    string  `json:"client_id" validate:"required,uuid"`
	PropertyID  *string `json:"property_id,omitempty" validate:"omitempty,uuid"`
	Type        string  `json:"type" validate:"required,oneof=site_visit meeting call"`
}

// UpdateAppointmentRequest represents the data that can be updated
type UpdateAppointmentRequest struct {
	Title       *string `json:"title,omitempty" validate:"omitempty,min=5,max=255"`
	Description *string `json:"description,omitempty"`
	Date        *string `json:"date,omitempty" validate:"omitempty,datetime=2006-01-02"`
	Time        *string `json:"time,omitempty" validate:"omitempty,datetime=15:04"`
	ClientID    *string `json:"client_id,omitempty" validate:"omitempty,uuid"`
	PropertyID  *string `json:"property_id,omitempty" validate:"omitempty,uuid"`
	Type        *string `json:"type,omitempty" validate:"omitempty,oneof=site_visit meeting call"`
	Status      *string `json:"status,omitempty" validate:"omitempty,oneof=scheduled completed cancelled"`
}

// AppointmentStats represents appointment statistics for a broker
type AppointmentStats struct {
	Total                 int            `json:"total"`
	Scheduled             int            `json:"scheduled"`
	Completed             int            `json:"completed"`
	Cancelled             int            `json:"cancelled"`
	Today                 int            `json:"today"`
	Upcoming              int            `json:"upcoming"`
	TotalThisMonth        int            `json:"total_this_month"`
	TodayAppointments     int            `json:"today_appointments"`
	ScheduledAppointments int            `json:"scheduled_appointments"`
	CompletedAppointments int            `json:"completed_appointments"`
	CancelledAppointments int            `json:"cancelled_appointments"`
	AppointmentsByType    map[string]int `json:"appointments_by_type"`
}

// AppointmentFilters represents query filters for appointments
type AppointmentFilters struct {
	Status    *string
	Date      *string
	Type      *string
	ClientID  *string
	StartDate *string
	EndDate   *string
}
