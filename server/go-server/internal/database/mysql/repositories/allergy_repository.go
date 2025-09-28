package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"tournament-dev/internal/database/base"
	"tournament-dev/internal/models"
)

// AllergyRepository implements database.AllergyRepository
type AllergyRepository struct {
	*base.BaseRepository
}

// NewAllergyRepository creates a new allergy repository
func NewAllergyRepository(db *sql.DB) *AllergyRepository {
	return &AllergyRepository{
		BaseRepository: base.NewBaseRepository(db),
	}
}

// CreateAllergy creates a new allergy
func (r *AllergyRepository) CreateAllergy(ctx context.Context, allergy *models.AllergyCreateRequest) error {
	query := `
		INSERT INTO allergies (player_id, description, created_at, updated_at)
		VALUES (?, ?, ?, ?, NOW(), NOW())
	`

	_, err := r.DB.ExecContext(ctx, query,
		allergy.PlayerID,
		allergy.Description,
	)
	if err != nil {
		return fmt.Errorf("failed to create allergy: %w", err)
	}

	return nil
}

// GetAllergyByID retrieves an allergy by ID
func (r *AllergyRepository) GetAllergyByID(ctx context.Context, id int) (*models.Allergy, error) {
	query := `
		SELECT id, player_id, description, created_at, updated_at
		FROM allergies
		WHERE id = ?
	`

	allergy := &models.Allergy{}
	err := r.DB.QueryRowContext(ctx, query, id).Scan(
		&allergy.ID,
		&allergy.PlayerID,
		&allergy.Description,
		&allergy.CreatedAt,
		&allergy.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("allergy not found with ID: %d", id)
		}
		return nil, fmt.Errorf("failed to get allergy: %w", err)
	}

	return allergy, nil
}

// DeleteAllergy deletes an allergy by ID
func (r *AllergyRepository) DeleteAllergy(ctx context.Context, id int) error {
	query := `DELETE FROM allergies WHERE id = ?`

	result, err := r.DB.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete allergy: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("allergy not found with ID: %d", id)
	}

	return nil
}

// ListAllergies retrieves a paginated list of allergies
func (r *AllergyRepository) ListAllergies(ctx context.Context, filters models.AllergyFilters) (*models.AllergyListResponse, error) {
	query := `SELECT id, player_id, description, created_at, updated_at FROM allergies`
	args := []interface{}{}

	var conditions []string

	if filters.PlayerID != nil {
		conditions = append(conditions, "player_id = ?")
		args = append(args, *filters.PlayerID)
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

	query += whereClause + " ORDER BY created_at DESC LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	// Execute the query
	rows, err := r.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query allergies: %w", err)
	}
	defer rows.Close()

	var allergies []models.AllergyResponse
	for rows.Next() {
		var allergy models.Allergy
		err := rows.Scan(
			&allergy.ID,
			&allergy.PlayerID,
			&allergy.Description,
			&allergy.CreatedAt,
			&allergy.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan allergy: %w", err)
		}

		allergies = append(allergies, models.AllergyResponse{
			ID:          allergy.ID,
			PlayerID:    allergy.PlayerID,
			Description: allergy.Description,
			CreatedAt:   allergy.CreatedAt,
			UpdatedAt:   allergy.UpdatedAt,
		})
	}

	// Get total count
	countQuery := `SELECT COUNT(*) FROM allergies` + whereClause
	var total int
	err = r.DB.QueryRowContext(ctx, countQuery, args[:len(args)-2]...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count allergies: %w", err)
	}

	totalPages := (total + limit - 1) / limit

	return &models.AllergyListResponse{
		Allergies:  allergies,
		Total:      total,
		Page:       filters.Page,
		PageSize:   limit,
		TotalPages: totalPages,
	}, nil
}

// GetAllergiesByTeamID retrieves all allergies for a specific team
func (r *AllergyRepository) GetAllergiesByTeamID(ctx context.Context, teamID int) ([]models.Allergy, error) {
	query := `
		SELECT id, player_id, description, created_at, updated_at
		FROM allergies
		WHERE team_id = ?
		ORDER BY created_at DESC
	`

	rows, err := r.DB.QueryContext(ctx, query, teamID)
	if err != nil {
		return nil, fmt.Errorf("failed to query allergies: %w", err)
	}
	defer rows.Close()

	var allergies []models.Allergy
	for rows.Next() {
		var allergy models.Allergy
		err := rows.Scan(
			&allergy.ID,
			&allergy.PlayerID,
			&allergy.Description,
			&allergy.CreatedAt,
			&allergy.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan allergy: %w", err)
		}
		allergies = append(allergies, allergy)
	}

	return allergies, nil
}
