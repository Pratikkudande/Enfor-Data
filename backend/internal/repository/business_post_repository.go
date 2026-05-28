package repository

import (
	"database/sql"
	"fmt"

	"enfor-data-backend/internal/database"
	"enfor-data-backend/internal/models"

	"github.com/lib/pq"
)

// BusinessPostRepository handles DB operations for business posts.
type BusinessPostRepository struct {
	db *database.DB
}

func NewBusinessPostRepository(db *database.DB) *BusinessPostRepository {
	return &BusinessPostRepository{db: db}
}

// Create inserts a new business post.
func (r *BusinessPostRepository) Create(p *models.BusinessPost) error {
	query := `
		INSERT INTO business_posts (
			user_id, title, category, subcategory, description, price, location, status,
			contact_name, contact_phone, contact_email, contact_whatsapp, contact_address,
			service_area, rating, images, resume_url
		) VALUES (
			$1,$2,$3,$4,$5,$6,$7,$8,
			$9,$10,$11,$12,$13,
			$14,$15,$16,$17
		)
		RETURNING id, poster_name, created_at, updated_at`

	return r.db.QueryRow(query,
		p.UserID, p.Title, p.Category, p.Subcategory, p.Description, p.Price, p.Location, p.Status,
		p.ContactName, p.ContactPhone, p.ContactEmail, p.ContactWhatsapp, p.ContactAddress,
		p.ServiceArea, p.Rating, pq.Array(p.Images), p.ResumeURL,
	).Scan(&p.ID, &p.PosterName, &p.CreatedAt, &p.UpdatedAt)
}

// GetAll returns all active posts (network feed), newest first.
func (r *BusinessPostRepository) GetAll(category, subcategory, location string) ([]models.BusinessPost, error) {
	query := `
		SELECT id, user_id, title, category, subcategory, description, price, location, status,
		       contact_name, contact_phone, contact_email, contact_whatsapp, contact_address,
		       service_area, rating, images, resume_url, poster_name, created_at, updated_at
		FROM business_posts
		WHERE status = 'active'`

	args := []interface{}{}
	argIdx := 1

	if category != "" {
		query += fmt.Sprintf(" AND category = $%d", argIdx)
		args = append(args, category)
		argIdx++
	}
	if subcategory != "" {
		query += fmt.Sprintf(" AND subcategory = $%d", argIdx)
		args = append(args, subcategory)
		argIdx++
	}
	if location != "" {
		query += fmt.Sprintf(" AND (location ILIKE $%d OR service_area ILIKE $%d)", argIdx, argIdx+1)
		like := "%" + location + "%"
		args = append(args, like, like)
	}

	query += " ORDER BY created_at DESC"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanPosts(rows)
}

// GetByUser returns all posts created by a specific user.
func (r *BusinessPostRepository) GetByUser(userID string) ([]models.BusinessPost, error) {
	query := `
		SELECT id, user_id, title, category, subcategory, description, price, location, status,
		       contact_name, contact_phone, contact_email, contact_whatsapp, contact_address,
		       service_area, rating, images, resume_url, poster_name, created_at, updated_at
		FROM business_posts
		WHERE user_id = $1
		ORDER BY created_at DESC`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanPosts(rows)
}

// GetByID returns a single post.
func (r *BusinessPostRepository) GetByID(id string) (*models.BusinessPost, error) {
	query := `
		SELECT id, user_id, title, category, subcategory, description, price, location, status,
		       contact_name, contact_phone, contact_email, contact_whatsapp, contact_address,
		       service_area, rating, images, resume_url, poster_name, created_at, updated_at
		FROM business_posts
		WHERE id = $1`

	p := &models.BusinessPost{}
	err := r.db.QueryRow(query, id).Scan(
		&p.ID, &p.UserID, &p.Title, &p.Category, &p.Subcategory, &p.Description,
		&p.Price, &p.Location, &p.Status,
		&p.ContactName, &p.ContactPhone, &p.ContactEmail, &p.ContactWhatsapp, &p.ContactAddress,
		&p.ServiceArea, &p.Rating, pq.Array(&p.Images), &p.ResumeURL, &p.PosterName,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("business post not found")
	}
	return p, err
}

// Update applies partial updates to a post.
func (r *BusinessPostRepository) Update(id string, title, description, location, status *string, price *float64, serviceArea *string, rating *float64) (*models.BusinessPost, error) {
	query := `
		UPDATE business_posts SET
			title       = COALESCE($2, title),
			description = COALESCE($3, description),
			location    = COALESCE($4, location),
			status      = COALESCE($5, status),
			price       = COALESCE($6, price),
			service_area = COALESCE($7, service_area),
			rating      = COALESCE($8, rating),
			updated_at  = NOW()
		WHERE id = $1
		RETURNING id, user_id, title, category, subcategory, description, price, location, status,
		          contact_name, contact_phone, contact_email, contact_whatsapp, contact_address,
		          service_area, rating, images, resume_url, poster_name, created_at, updated_at`

	p := &models.BusinessPost{}
	err := r.db.QueryRow(query, id, title, description, location, status, price, serviceArea, rating).Scan(
		&p.ID, &p.UserID, &p.Title, &p.Category, &p.Subcategory, &p.Description,
		&p.Price, &p.Location, &p.Status,
		&p.ContactName, &p.ContactPhone, &p.ContactEmail, &p.ContactWhatsapp, &p.ContactAddress,
		&p.ServiceArea, &p.Rating, pq.Array(&p.Images), &p.ResumeURL, &p.PosterName,
		&p.CreatedAt, &p.UpdatedAt,
	)
	return p, err
}

// Delete removes a post.
func (r *BusinessPostRepository) Delete(id string) error {
	_, err := r.db.Exec(`DELETE FROM business_posts WHERE id = $1`, id)
	return err
}

// scanPosts scans multiple rows into a slice.
func scanPosts(rows *sql.Rows) ([]models.BusinessPost, error) {
	var posts []models.BusinessPost
	for rows.Next() {
		var p models.BusinessPost
		if err := rows.Scan(
			&p.ID, &p.UserID, &p.Title, &p.Category, &p.Subcategory, &p.Description,
			&p.Price, &p.Location, &p.Status,
			&p.ContactName, &p.ContactPhone, &p.ContactEmail, &p.ContactWhatsapp, &p.ContactAddress,
			&p.ServiceArea, &p.Rating, pq.Array(&p.Images), &p.ResumeURL, &p.PosterName,
			&p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			return nil, err
		}
		posts = append(posts, p)
	}
	if posts == nil {
		posts = []models.BusinessPost{}
	}
	return posts, rows.Err()
}
