package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"tournament-dev/internal/database/base"
	"tournament-dev/internal/models"
	"tournament-dev/internal/errors"
)

// PlayerRepository implements database.PlayerRepository
type PlayerRepository struct {
	*base.BaseRepository
}

// NewPlayerRepository creates a new player repository
func NewPlayerRepository(db *sql.DB) *PlayerRepository {
	return &PlayerRepository{
		BaseRepository: base.NewBaseRepository(db),
	}
}

// CreatePlayer creates a new player
func (r *PlayerRepository) CreatePlayer(ctx context.Context, player *models.PlayerCreateRequest) error {
	// TODO: Add team validation back when we implement proper dependency injection
	teamRepo := NewTeamRepository(r.DB)
	exists, err := teamRepo.TeamExists(ctx, player.TeamID)
	if err != nil {
		return fmt.Errorf("failed to validate team existence: %w", err)
	}
	if !exists {
		return &errors.TeamNotFoundError{TeamID: player.TeamID}
	}

	query := `
		INSERT INTO players (first_name, last_name, shirt_size, team_id, created_at, updated_at)
		VALUES (?, ?, ?, ?, NOW(), NOW())
	`

	_ , err = r.DB.ExecContext(ctx, query,
		player.FirstName,
		player.LastName,
		player.ShirtSize,
		player.TeamID,
	)
	if err != nil {
		return fmt.Errorf("failed to create player: %w", err)
	}

	return nil
}

// GetPlayerByID retrieves a player by ID
func (r *PlayerRepository) GetPlayerByID(ctx context.Context, id int) (*models.Player, error) {
	query := `
		SELECT id, first_name, last_name, shirt_size, team_id, created_at, updated_at
		FROM players
		WHERE id = ?
	`

	player := &models.Player{}
	err := r.DB.QueryRowContext(ctx, query, id).Scan(
		&player.ID,
		&player.FirstName,
		&player.LastName,
		&player.ShirtSize,
		&player.TeamID,
		&player.CreatedAt,
		&player.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("player with ID %d not found", id)
		}
		return nil, fmt.Errorf("failed to get player: %w", err)
	}

	return player, nil
}

// UpdatePlayer updates an existing player
func (r *PlayerRepository) UpdatePlayer(ctx context.Context, id int, player *models.PlayerUpdateRequest) error {
	query := `
		UPDATE players
		SET first_name = ?, last_name = ?, shirt_size = ?, updated_at = NOW()
		WHERE id = ?
	`

	result, err := r.DB.ExecContext(ctx, query,
		player.FirstName,
		player.LastName,
		player.ShirtSize,
		id,
	)
	if err != nil {
		return fmt.Errorf("failed to update player: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("player with ID %d not found", id)
	}

	return nil
}

// DeletePlayer deletes a player by ID
func (r *PlayerRepository) DeletePlayer(ctx context.Context, id int) error {
	query := `DELETE FROM players WHERE id = ?`

	result, err := r.DB.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete player: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("player with ID %d not found", id)
	}

	return nil
}

// ListPlayers retrieves a paginated list of players
func (r *PlayerRepository) ListPlayers(ctx context.Context, filters models.PlayerFilters) (*models.PlayerListResponse, error) {
	query := `SELECT id, first_name, last_name, shirt_size, team_id, created_at, updated_at FROM players`
	args := []interface{}{}

	var conditions []string

	if filters.TeamID != nil {
		conditions = append(conditions, "team_id = ?")
		args = append(args, *filters.TeamID)
	}

	if filters.ShirtSize != nil {
		conditions = append(conditions, "shirt_size = ?")
		args = append(args, *filters.ShirtSize)
	}

	if filters.Search != nil && *filters.Search != "" {
		conditions = append(conditions, "(first_name LIKE ? OR last_name LIKE ?)")
		searchTerm := "%" + *filters.Search + "%"
		args = append(args, searchTerm, searchTerm)
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = " WHERE " + strings.Join(conditions, " AND ")
	}

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

	rows, err := r.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query players: %w", err)
	}
	defer rows.Close()

	var players []models.PlayerResponse
	for rows.Next() {
		var player models.Player
		err := rows.Scan(
			&player.ID,
			&player.FirstName,
			&player.LastName,
			&player.ShirtSize,
			&player.TeamID,
			&player.CreatedAt,
			&player.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan player: %w", err)
		}

		players = append(players, models.PlayerResponse{
			ID:        player.ID,
			FirstName: player.FirstName,
			LastName:  player.LastName,
			ShirtSize: player.ShirtSize,
			TeamID:    player.TeamID,
			CreatedAt: player.CreatedAt,
			UpdatedAt: player.UpdatedAt,
		})
	}

	countQuery := `SELECT COUNT(*) FROM players` + whereClause
	var total int
	err = r.DB.QueryRowContext(ctx, countQuery, args[:len(args)-2]...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count players: %w", err)
	}

	totalPages := (total + limit - 1) / limit

	return &models.PlayerListResponse{
		Players:    players,
		Total:      total,
		Page:       filters.Page,
		PageSize:   limit,
		TotalPages: totalPages,
	}, nil
}

// GetPlayersByTeamID retrieves all players for a specific team
func (r *PlayerRepository) GetPlayersByTeamID(ctx context.Context, teamID int) ([]models.Player, error) {
	query := `
		SELECT id, first_name, last_name, shirt_size, team_id, created_at, updated_at
		FROM players
		WHERE team_id = ?
		ORDER BY last_name, first_name
	`

	rows, err := r.DB.QueryContext(ctx, query, teamID)
	if err != nil {
		return nil, fmt.Errorf("failed to query players: %w", err)
	}
	defer rows.Close()

	var players []models.Player
	for rows.Next() {
		var player models.Player
		err := rows.Scan(
			&player.ID,
			&player.FirstName,
			&player.LastName,
			&player.ShirtSize,
			&player.TeamID,
			&player.CreatedAt,
			&player.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan player: %w", err)
		}
		players = append(players, player)
	}

	return players, nil
}
