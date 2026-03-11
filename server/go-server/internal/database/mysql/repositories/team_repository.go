package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"tournament-dev/internal/database/base"
	"tournament-dev/internal/models"
)

// TeamRepository implements database.TeamRepository
type TeamRepository struct {
	*base.BaseRepository
}

// NewTeamRepository creates a new team repository
func NewTeamRepository(db *sql.DB) *TeamRepository {
	return &TeamRepository{
		BaseRepository: base.NewBaseRepository(db),
	}
}

// CreateTeam creates a new team and returns the new team ID.
func (r *TeamRepository) CreateTeam(ctx context.Context, team *models.TeamCreateRequest) (int, error) {
	query := `
		INSERT INTO teams (name, email, category, phone, gender, club_id, observations, registration_date, updated_at, status)
		VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)
	`

	res, err := r.DB.ExecContext(ctx, query,
		team.Name,
		team.Email,
		team.Category,
		team.Phone,
		team.Gender,
		team.ClubID,
		team.Observations,
		team.Status,
	)
	if err != nil {
		return 0, fmt.Errorf("failed to create team: %w", err)
	}
	id, err := res.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("failed to get team id: %w", err)
	}
	return int(id), nil
}

// GetTeamByID retrieves a team by ID
func (r *TeamRepository) GetTeamByID(ctx context.Context, id int) (*models.Team, error) {
	query := `
		SELECT id, name, email, category, phone, gender, club_id, observations, registration_date, updated_at, status
		FROM teams
		WHERE id = ?
	`

	team := &models.Team{}
	err := r.DB.QueryRowContext(ctx, query, id).Scan(
		&team.ID,
		&team.Name,
		&team.Email,
		&team.Category,
		&team.Phone,
		&team.Gender,
		&team.ClubID,
		&team.Observations,
		&team.RegistrationDate,
		&team.UpdatedAt,
		&team.Status,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("team not found with ID: %d", id)
		}
		return nil, fmt.Errorf("failed to get team: %w", err)
	}

	return team, nil
}

// GetTeamByEmail retrieves a team by email
func (r *TeamRepository) GetTeamByEmail(ctx context.Context, email string) (*models.Team, error) {
	query := `
		SELECT id, name, email, category, phone, gender, club_id, observations, registration_date, updated_at, status
		FROM teams
		WHERE email = ?
	`

	team := &models.Team{}
	err := r.DB.QueryRowContext(ctx, query, email).Scan(
		&team.ID,
		&team.Name,
		&team.Email,
		&team.Category,
		&team.Phone,
		&team.Gender,
		&team.ClubID,
		&team.Observations,
		&team.RegistrationDate,
		&team.UpdatedAt,
		&team.Status,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("team not found with email: %s", email)
		}
		return nil, fmt.Errorf("failed to get team: %w", err)
	}

	return team, nil
}

// UpdateTeam updates an existing team
func (r *TeamRepository) UpdateTeam(ctx context.Context, id int, team *models.TeamUpdateRequest) error {
	query := `
		UPDATE teams
		SET name = ?, email = ?, category = ?, phone = ?, gender = ?, club_id = ?, observations = ?, status = ?, updated_at = NOW()
		WHERE id = ?
	`

	result, err := r.DB.ExecContext(ctx, query,
		team.Name,
		team.Email,
		team.Category,
		team.Phone,
		team.Gender,
		team.ClubID,
		team.Observations,
		team.Status,
		id,
	)
	if err != nil {
		return fmt.Errorf("failed to update team: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("team not found with ID: %d", id)
	}

	return nil
}

// UpdateTeamObservations updates only the observations column (for PUT /api/me/team).
func (r *TeamRepository) UpdateTeamObservations(ctx context.Context, id int, observations *string) error {
	query := `UPDATE teams SET observations = ?, updated_at = NOW() WHERE id = ?`
	result, err := r.DB.ExecContext(ctx, query, observations, id)
	if err != nil {
		return fmt.Errorf("failed to update team observations: %w", err)
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("team not found with ID: %d", id)
	}
	return nil
}

// DeleteTeam deletes a team by ID
func (r *TeamRepository) DeleteTeam(ctx context.Context, id int) error {
	query := `DELETE FROM teams WHERE id = ?`

	result, err := r.DB.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete team: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("team not found with ID: %d", id)
	}

	return nil
}

// ListTeams retrieves a paginated list of teams (admin). Includes a valid registration_token per team when present.
func (r *TeamRepository) ListTeams(ctx context.Context, filters models.TeamFilters) (*models.TeamListResponse, error) {
	// Subquery: one valid registration token per team (latest by created_at)
	tokenSubq := `(SELECT rt.token FROM registration_tokens rt WHERE rt.team_id = teams.id AND rt.expires_at > UTC_TIMESTAMP() ORDER BY rt.created_at DESC LIMIT 1)`
	// Build the query with filters
	query := `SELECT teams.id, teams.name, teams.email, teams.category, teams.phone, teams.gender, teams.club_id, teams.observations, teams.registration_date, teams.updated_at, teams.status, ` + tokenSubq + ` AS registration_token FROM teams`
	args := []interface{}{}

	var conditions []string

	if filters.Category != nil {
		conditions = append(conditions, "category = ?")
		args = append(args, *filters.Category)
	}

	if filters.Gender != nil {
		conditions = append(conditions, "gender = ?")
		args = append(args, *filters.Gender)
	}

	if filters.Status != nil {
		conditions = append(conditions, "status = ?")
		args = append(args, *filters.Status)
	}

	if filters.ClubID != nil {
		conditions = append(conditions, "club_id = ?")
		args = append(args, *filters.ClubID)
	}

	if filters.Search != nil && *filters.Search != "" {
		conditions = append(conditions, "(name LIKE ? OR email LIKE ?)")
		searchTerm := "%" + *filters.Search + "%"
		args = append(args, searchTerm, searchTerm)
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

	query += whereClause + " ORDER BY registration_date DESC LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	// Execute the query
	rows, err := r.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query teams: %w", err)
	}
	defer rows.Close()

	var teams []models.TeamResponse
	for rows.Next() {
		var team models.Team
		var registrationToken *string
		err := rows.Scan(
			&team.ID,
			&team.Name,
			&team.Email,
			&team.Category,
			&team.Phone,
			&team.Gender,
			&team.ClubID,
			&team.Observations,
			&team.RegistrationDate,
			&team.UpdatedAt,
			&team.Status,
			&registrationToken,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan team: %w", err)
		}

		teams = append(teams, models.TeamResponse{
			ID:                team.ID,
			Name:              team.Name,
			Email:             team.Email,
			Category:          team.Category,
			Phone:             team.Phone,
			Gender:            team.Gender,
			ClubID:            team.ClubID,
			Observations:      team.Observations,
			RegistrationDate:  team.RegistrationDate,
			UpdatedAt:         team.UpdatedAt,
			Status:            team.Status,
			RegistrationToken: registrationToken,
		})
	}

	// Get total count
	countQuery := `SELECT COUNT(*) FROM teams` + whereClause
	var total int
	err = r.DB.QueryRowContext(ctx, countQuery, args[:len(args)-2]...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count teams: %w", err)
	}

	totalPages := (total + limit - 1) / limit

	return &models.TeamListResponse{
		Teams:      teams,
		Total:      total,
		Page:       filters.Page,
		PageSize:   limit,
		TotalPages: totalPages,
	}, nil
}

// GetTeamStats retrieves team statistics
func (r *TeamRepository) GetTeamStats(ctx context.Context) (*models.TeamStats, error) {
	stats := &models.TeamStats{
		ByCategory: make(map[models.Category]int),
		ByGender:   make(map[models.Gender]int),
	}

	// Get total counts by status
	query := `
		SELECT 
			COUNT(*) as total_teams,
			SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_teams,
			SUM(CASE WHEN status = 'pending_payment' THEN 1 ELSE 0 END) as pending_payment,
			SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END) as canceled_teams
		FROM teams
	`

	err := r.DB.QueryRowContext(ctx, query).Scan(
		&stats.TotalTeams,
		&stats.ActiveTeams,
		&stats.PendingPayment,
		&stats.CanceledTeams,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get team stats: %w", err)
	}

	// Get counts by category
	categoryQuery := `SELECT category, COUNT(*) FROM teams GROUP BY category`
	rows, err := r.DB.QueryContext(ctx, categoryQuery)
	if err != nil {
		return nil, fmt.Errorf("failed to get category stats: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var category models.Category
		var count int
		err := rows.Scan(&category, &count)
		if err != nil {
			return nil, fmt.Errorf("failed to scan category stats: %w", err)
		}
		stats.ByCategory[category] = count
	}

	// Get counts by gender
	genderQuery := `SELECT gender, COUNT(*) FROM teams GROUP BY gender`
	rows, err = r.DB.QueryContext(ctx, genderQuery)
	if err != nil {
		return nil, fmt.Errorf("failed to get gender stats: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var gender models.Gender
		var count int
		err := rows.Scan(&gender, &count)
		if err != nil {
			return nil, fmt.Errorf("failed to scan gender stats: %w", err)
		}
		stats.ByGender[gender] = count
	}

	return stats, nil
}

// GetTeamWithRelations retrieves a team with all related data
func (r *TeamRepository) GetTeamWithRelations(ctx context.Context, id int) (*models.Team, error) {
	// Get the team
	team, err := r.GetTeamByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Get the club
	clubRepo := NewClubRepository(r.DB)
	club, err := clubRepo.GetClubByID(ctx, team.ClubID)
	if err != nil {
		return nil, err
	}
	team.Club = club

	// Get players
	playerRepo := NewPlayerRepository(r.DB)
	players, err := playerRepo.GetPlayersByTeamID(ctx, team.ID)
	if err != nil {
		return nil, err
	}
	team.Players = players

	// Get coaches
	coachRepo := NewCoachRepository(r.DB)
	coaches, err := coachRepo.GetCoachesByTeamID(ctx, team.ID)
	if err != nil {
		return nil, err
	}
	team.Coaches = coaches

	return team, nil
}

// TeamExists checks if a team exists by ID
func (r *TeamRepository) TeamExists(ctx context.Context, id int) (bool, error) {
	query := `SELECT 1 FROM teams WHERE id = ? LIMIT 1`

	var exists int
	err := r.DB.QueryRowContext(ctx, query, id).Scan(&exists)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, nil
		}
		return false, fmt.Errorf("failed to check team existence: %w", err)
	}

	return true, nil
}
