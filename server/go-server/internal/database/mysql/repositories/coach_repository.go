package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"tournament-dev/internal/database/base"
	"tournament-dev/internal/models"
)

// CoachRepository implements database.CoachRepository
type CoachRepository struct {
	*base.BaseRepository
}

// NewCoachRepository creates a new coach repository
func NewCoachRepository(db *sql.DB) *CoachRepository {
	return &CoachRepository{
		BaseRepository: base.NewBaseRepository(db),
	}
}

// CreateCoach creates a new coach
func (r *CoachRepository) CreateCoach(ctx context.Context, coach *models.CoachCreateRequest) error {
	query := `
		INSERT INTO coaches (first_name, last_name, phone, email, team_id, is_head_coach, shirt_size, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
	`

	_, err := r.DB.ExecContext(ctx, query,
		coach.FirstName,
		coach.LastName,
		coach.Phone,
		coach.Email,
		coach.TeamID,
		coach.IsHeadCoach,
		coach.ShirtSize,
	)
	if err != nil {
		return fmt.Errorf("failed to create coach: %w", err)
	}

	return nil
}

// GetCoachByID retrieves a coach by ID
func (r *CoachRepository) GetCoachByID(ctx context.Context, id int) (*models.Coach, error) {
	query := `
		SELECT id, first_name, last_name, phone, email, team_id, is_head_coach, shirt_size, created_at, updated_at
		FROM coaches
		WHERE id = ?
	`

	coach := &models.Coach{}
	err := r.DB.QueryRowContext(ctx, query, id).Scan(
		&coach.ID,
		&coach.FirstName,
		&coach.LastName,
		&coach.Phone,
		&coach.Email,
		&coach.TeamID,
		&coach.IsHeadCoach,
		&coach.ShirtSize,
		&coach.CreatedAt,
		&coach.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("coach not found with ID: %d", id)
		}
		return nil, fmt.Errorf("failed to get coach: %w", err)
	}

	return coach, nil
}

// UpdateCoach updates an existing coach
func (r *CoachRepository) UpdateCoach(ctx context.Context, id int, coach *models.CoachUpdateRequest) error {
	query := `
		UPDATE coaches
		SET first_name = ?, last_name = ?, phone = ?, email = ?, updated_at = NOW()
	`
	args := []interface{}{coach.FirstName, coach.LastName, coach.Phone, coach.Email}

	if coach.IsHeadCoach != nil {
		query += `, is_head_coach = ?`
		args = append(args, *coach.IsHeadCoach)
	}

	if coach.ShirtSize != nil {
		query += `, shirt_size = ?`
		args = append(args, *coach.ShirtSize)
	}

	query += ` WHERE id = ?`
	args = append(args, id)

	result, err := r.DB.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to update coach: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("coach not found with ID: %d", id)
	}

	return nil
}

// DeleteCoach deletes a coach by ID
func (r *CoachRepository) DeleteCoach(ctx context.Context, id int) error {
	query := `DELETE FROM coaches WHERE id = ?`

	result, err := r.DB.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete coach: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("coach not found with ID: %d", id)
	}

	return nil
}

// ListCoaches retrieves a paginated list of coaches
func (r *CoachRepository) ListCoaches(ctx context.Context, filters models.CoachFilters) (*models.CoachListResponse, error) {
	// Build the query with filters
	query := `SELECT id, first_name, last_name, phone, email, team_id, is_head_coach, shirt_size, created_at, updated_at FROM coaches`
	args := []interface{}{}

	var conditions []string

	if filters.TeamID != nil {
		conditions = append(conditions, "team_id = ?")
		args = append(args, *filters.TeamID)
	}

	if filters.ShirtSize != nil && *filters.ShirtSize != "" {
		conditions = append(conditions, "shirt_size = ?")
		args = append(args, *filters.ShirtSize)
	}

	if filters.Search != nil && *filters.Search != "" {
		conditions = append(conditions, "(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)")
		searchTerm := "%" + *filters.Search + "%"
		args = append(args, searchTerm, searchTerm, searchTerm)
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = " WHERE " + strings.Join(conditions, " AND ")
	}

	// Add pagination
	limit := filters.PageSize
	if limit <= 0 {
		limit = 10
	}
	offset := (filters.Page - 1) * limit
	if offset < 0 {
		offset = 0
	}

	query += whereClause + " ORDER BY last_name, first_name LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	// Execute the query
	rows, err := r.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query coaches: %w", err)
	}
	defer rows.Close()

	var coaches []models.CoachResponse
	for rows.Next() {
		var coach models.Coach
		err := rows.Scan(
			&coach.ID,
			&coach.FirstName,
			&coach.LastName,
			&coach.Phone,
			&coach.Email,
			&coach.TeamID,
			&coach.IsHeadCoach,
			&coach.ShirtSize,
			&coach.CreatedAt,
			&coach.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan coach: %v", err)
		}

		coaches = append(coaches, models.CoachResponse{
			ID:          coach.ID,
			FirstName:   coach.FirstName,
			LastName:    coach.LastName,
			Phone:       coach.Phone,
			Email:       coach.Email,
			TeamID:      coach.TeamID,
			IsHeadCoach: coach.IsHeadCoach,
			ShirtSize:   coach.ShirtSize,
			CreatedAt:   coach.CreatedAt,
			UpdatedAt:   coach.UpdatedAt,
		})
	}

	// Get total count
	countQuery := `SELECT COUNT(*) FROM coaches` + whereClause
	var total int
	err = r.DB.QueryRowContext(ctx, countQuery, args[:len(args)-2]...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count coaches: %v", err)
	}

	totalPages := (total + limit - 1) / limit

	return &models.CoachListResponse{
		Coaches:    coaches,
		Total:      total,
		Page:       filters.Page,
		PageSize:   limit,
		TotalPages: totalPages,
	}, nil
}

// GetCoachesByTeamID retrieves all coaches for a specific team
func (r *CoachRepository) GetCoachesByTeamID(ctx context.Context, teamID int) ([]models.Coach, error) {
	query := `
		SELECT id, first_name, last_name, phone, email, team_id, is_head_coach, shirt_size, created_at, updated_at
		FROM coaches
		WHERE team_id = ?
		ORDER BY last_name, first_name
	`

	rows, err := r.DB.QueryContext(ctx, query, teamID)
	if err != nil {
		return nil, fmt.Errorf("failed to query coaches: %v", err)
	}
	defer rows.Close()

	var coaches []models.Coach
	for rows.Next() {
		var coach models.Coach
		err := rows.Scan(
			&coach.ID,
			&coach.FirstName,
			&coach.LastName,
			&coach.Phone,
			&coach.Email,
			&coach.TeamID,
			&coach.IsHeadCoach,
			&coach.ShirtSize,
			&coach.CreatedAt,
			&coach.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan coach: %v", err)
		}
		coaches = append(coaches, coach)
	}

	return coaches, nil
}
