package repositories

import (
	"context"
	"database/sql"
	"fmt"

	"tournament-dev/internal/database/base"
	"tournament-dev/internal/models"
)

// ClubRepository implements database.ClubRepository
type ClubRepository struct {
	*base.BaseRepository
}

// NewClubRepository creates a new club repository
func NewClubRepository(db *sql.DB) *ClubRepository {
	return &ClubRepository{
		BaseRepository: base.NewBaseRepository(db),
	}
}

// CreateClub creates a new club
func (r *ClubRepository) CreateClub(ctx context.Context, club *models.ClubCreateRequest) error {
	query := `
		INSERT INTO clubs (name, logo_url, created_at, updated_at)
		VALUES (?, ?, NOW(), NOW())
	`

	_, err := r.DB.ExecContext(ctx, query, club.Name, club.LogoURL)
	if err != nil {
		return fmt.Errorf("failed to create club: %w", err)
	}

	return nil
}

// GetClubByID retrieves a club by ID
func (r *ClubRepository) GetClubByID(ctx context.Context, id int) (*models.Club, error) {
	query := `
		SELECT id, name, logo_url, created_at, updated_at
		FROM clubs
		WHERE id = ?
	`

	club := &models.Club{}
	err := r.DB.QueryRowContext(ctx, query, id).Scan(
		&club.ID,
		&club.Name,
		&club.LogoURL,
		&club.CreatedAt,
		&club.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("club with ID %d not found", id)
		}
		return nil, fmt.Errorf("failed to get club by ID: %w", err)
	}

	return club, nil
}

// GetClubByName retrieves a club by name
func (r *ClubRepository) GetClubByName(ctx context.Context, name string) (*models.Club, error) {
	query := `
		SELECT id, name, logo_url, created_at, updated_at
		FROM clubs
		WHERE name = ?
	`

	club := &models.Club{}
	err := r.DB.QueryRowContext(ctx, query, name).Scan(
		&club.ID,
		&club.Name,
		&club.LogoURL,
		&club.CreatedAt,
		&club.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get club by name: %w", err)
	}

	return club, nil
}

// UpdateClub updates an existing club
func (r *ClubRepository) UpdateClub(ctx context.Context, id int, club *models.ClubUpdateRequest) error {
	query := `
		UPDATE clubs
		SET name = ?, logo_url = ?, updated_at = NOW()
		WHERE id = ?
	`

	result, err := r.DB.ExecContext(ctx, query, club.Name, club.LogoURL, id)
	if err != nil {
		return fmt.Errorf("failed to update club: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("club with ID %d not found", id)
	}

	return nil
}

// DeleteClub deletes a club by ID
func (r *ClubRepository) DeleteClub(ctx context.Context, id int) error {
	query := `DELETE FROM clubs WHERE id = ?`

	result, err := r.DB.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete club: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("club with ID %d not found", id)
	}

	return nil
}

// ListClubs retrieves all clubs
func (r *ClubRepository) ListClubs(ctx context.Context) (*models.ClubListResponse, error) {
	query := `SELECT id, name, logo_url, created_at, updated_at FROM clubs ORDER BY name`

	rows, err := r.DB.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query clubs: %w", err)
	}
	defer rows.Close()

	var clubs []models.ClubResponse
	for rows.Next() {
		var club models.Club
		err := rows.Scan(&club.ID, &club.Name, &club.LogoURL, &club.CreatedAt, &club.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan club: %w", err)
		}

		clubs = append(clubs, models.ClubResponse{
			ID:        club.ID,
			Name:      club.Name,
			LogoURL:   club.LogoURL,
			CreatedAt: club.CreatedAt,
			UpdatedAt: club.UpdatedAt,
		})
	}

	return &models.ClubListResponse{
		Clubs: clubs,
	}, nil
}
