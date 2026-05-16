package repository

import (
	"database/sql"
	"fmt"

	"enfor-data-backend/internal/database"
	"enfor-data-backend/internal/models"

	"github.com/lib/pq"
)

type ProjectRepository struct {
	db *database.DB
}

func NewProjectRepository(db *database.DB) *ProjectRepository {
	return &ProjectRepository{db: db}
}

const projectSelectCols = `
	id, name, builder_name, project_type, description,
	location, address, city, state,
	total_units, available_units, price_range_min, price_range_max,
	amenities, launch_date, possession_date, status, brochure_url,
	channel_partner_id, partner_name, partner_firm,
	created_at, updated_at
`

func scanProject(row interface {
	Scan(...interface{}) error
}) (models.Project, error) {
	var p models.Project
	err := row.Scan(
		&p.ID, &p.Name, &p.BuilderName, &p.ProjectType, &p.Description,
		&p.Location, &p.Address, &p.City, &p.State,
		&p.TotalUnits, &p.AvailableUnits, &p.PriceRangeMin, &p.PriceRangeMax,
		pq.Array(&p.Amenities), &p.LaunchDate, &p.PossessionDate, &p.Status, &p.BrochureURL,
		&p.ChannelPartnerID, &p.PartnerName, &p.PartnerFirm,
		&p.CreatedAt, &p.UpdatedAt,
	)
	return p, err
}

// Create inserts a new project. Denormalized partner fields filled by trigger.
func (r *ProjectRepository) Create(p *models.Project) error {
	query := `
		INSERT INTO projects (
			name, builder_name, project_type, description,
			location, address, city, state,
			total_units, available_units, price_range_min, price_range_max,
			amenities, launch_date, possession_date, status, brochure_url,
			channel_partner_id
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
		RETURNING ` + projectSelectCols

	proj, err := scanProject(r.db.QueryRow(
		query,
		p.Name, p.BuilderName, p.ProjectType, p.Description,
		p.Location, p.Address, p.City, p.State,
		p.TotalUnits, p.AvailableUnits, p.PriceRangeMin, p.PriceRangeMax,
		pq.Array(p.Amenities), p.LaunchDate, p.PossessionDate, p.Status, p.BrochureURL,
		p.ChannelPartnerID,
	))
	if err != nil {
		return fmt.Errorf("failed to create project: %w", err)
	}
	*p = proj
	return nil
}

// GetByPartnerID returns all projects for a channel partner, newest first.
func (r *ProjectRepository) GetByPartnerID(partnerID string) ([]models.Project, error) {
	query := `SELECT ` + projectSelectCols + `
		FROM projects WHERE channel_partner_id = $1 ORDER BY created_at DESC`

	rows, err := r.db.Query(query, partnerID)
	if err != nil {
		return nil, fmt.Errorf("failed to query projects: %w", err)
	}
	defer rows.Close()

	var list []models.Project
	for rows.Next() {
		p, err := scanProject(rows)
		if err != nil {
			return nil, fmt.Errorf("failed to scan project: %w", err)
		}
		list = append(list, p)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	if list == nil {
		list = []models.Project{}
	}
	return list, nil
}

// GetAll returns all projects from all partners (read-only for brokers).
func (r *ProjectRepository) GetAll() ([]models.Project, error) {
	query := `SELECT ` + projectSelectCols + `
		FROM projects ORDER BY created_at DESC`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query all projects: %w", err)
	}
	defer rows.Close()

	var list []models.Project
	for rows.Next() {
		p, err := scanProject(rows)
		if err != nil {
			return nil, fmt.Errorf("failed to scan project: %w", err)
		}
		list = append(list, p)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	if list == nil {
		list = []models.Project{}
	}
	return list, nil
}

// GetByID returns a single project by ID.
func (r *ProjectRepository) GetByID(id string) (*models.Project, error) {
	query := `SELECT ` + projectSelectCols + ` FROM projects WHERE id = $1`
	p, err := scanProject(r.db.QueryRow(query, id))
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("project not found")
		}
		return nil, fmt.Errorf("failed to get project: %w", err)
	}
	return &p, nil
}

// Update modifies an existing project.
func (r *ProjectRepository) Update(p *models.Project) error {
	query := `
		UPDATE projects SET
			name=$1, builder_name=$2, project_type=$3, description=$4,
			location=$5, address=$6, city=$7, state=$8,
			total_units=$9, available_units=$10, price_range_min=$11, price_range_max=$12,
			amenities=$13, launch_date=$14, possession_date=$15, status=$16, brochure_url=$17
		WHERE id=$18
		RETURNING ` + projectSelectCols

	proj, err := scanProject(r.db.QueryRow(
		query,
		p.Name, p.BuilderName, p.ProjectType, p.Description,
		p.Location, p.Address, p.City, p.State,
		p.TotalUnits, p.AvailableUnits, p.PriceRangeMin, p.PriceRangeMax,
		pq.Array(p.Amenities), p.LaunchDate, p.PossessionDate, p.Status, p.BrochureURL,
		p.ID,
	))
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("project not found")
		}
		return fmt.Errorf("failed to update project: %w", err)
	}
	*p = proj
	return nil
}

// Delete permanently removes a project.
func (r *ProjectRepository) Delete(id string) error {
	result, err := r.db.Exec(`DELETE FROM projects WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("failed to delete project: %w", err)
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("project not found")
	}
	return nil
}
