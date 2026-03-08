package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"tournament-dev/internal/database/base"
	"tournament-dev/internal/database"
)

// AuthRepository implements database.AuthRepository
type AuthRepository struct {
	*base.BaseRepository
}

// NewAuthRepository creates a new auth repository
func NewAuthRepository(db *sql.DB) *AuthRepository {
	return &AuthRepository{
		BaseRepository: base.NewBaseRepository(db),
	}
}

// CreateRegistrationToken inserts a registration token for a team
func (r *AuthRepository) CreateRegistrationToken(ctx context.Context, teamID int, token string, expiresAt time.Time) error {
	query := `INSERT INTO registration_tokens (team_id, token, expires_at) VALUES (?, ?, ?)`
	_, err := r.DB.ExecContext(ctx, query, teamID, token, expiresAt)
	if err != nil {
		return fmt.Errorf("failed to create registration token: %w", err)
	}
	return nil
}

// GetTeamIDByRegistrationToken returns team_id if token is valid and not expired
func (r *AuthRepository) GetTeamIDByRegistrationToken(ctx context.Context, token string) (*int, error) {
	query := `SELECT team_id FROM registration_tokens WHERE token = ? AND expires_at > NOW() LIMIT 1`
	var teamID int
	err := r.DB.QueryRowContext(ctx, query, token).Scan(&teamID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get team by registration token: %w", err)
	}
	return &teamID, nil
}

// CreateWAToken inserts a WhatsApp token for a team
func (r *AuthRepository) CreateWAToken(ctx context.Context, teamID int, phoneNumber, token string) error {
	query := `INSERT INTO wa_tokens (team_id, phone_number, token) VALUES (?, ?, ?)`
	_, err := r.DB.ExecContext(ctx, query, teamID, phoneNumber, token)
	if err != nil {
		return fmt.Errorf("failed to create wa_token: %w", err)
	}
	return nil
}

// CreateEditSession inserts an edit session (2FA pending: pin_hash set, session_token returned after validation)
func (r *AuthRepository) CreateEditSession(ctx context.Context, teamID int, sessionToken, pinHash, contactMethod string, expiresAt time.Time) error {
	query := `INSERT INTO edit_sessions (team_id, session_token, pin_hash, contact_method, is_used, expires_at)
		VALUES (?, ?, ?, ?, FALSE, ?)`
	_, err := r.DB.ExecContext(ctx, query, teamID, sessionToken, pinHash, contactMethod, expiresAt)
	if err != nil {
		return fmt.Errorf("failed to create edit session: %w", err)
	}
	return nil
}

// GetPendingSessionsByTeamID returns non-used, non-expired sessions for the team (for PIN verification)
func (r *AuthRepository) GetPendingSessionsByTeamID(ctx context.Context, teamID int) ([]database.EditSessionRow, error) {
	query := `SELECT session_token, pin_hash, expires_at FROM edit_sessions
		WHERE team_id = ? AND is_used = FALSE AND expires_at > NOW()`
	rows, err := r.DB.QueryContext(ctx, query, teamID)
	if err != nil {
		return nil, fmt.Errorf("failed to get pending sessions: %w", err)
	}
	defer rows.Close()
	var out []database.EditSessionRow
	for rows.Next() {
		var row database.EditSessionRow
		if err := rows.Scan(&row.SessionToken, &row.PinHash, &row.ExpiresAt); err != nil {
			return nil, fmt.Errorf("failed to scan session row: %w", err)
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

// MarkSessionUsedByToken sets is_used = TRUE for the given session_token
func (r *AuthRepository) MarkSessionUsedByToken(ctx context.Context, sessionToken string) error {
	query := `UPDATE edit_sessions SET is_used = TRUE WHERE session_token = ?`
	res, err := r.DB.ExecContext(ctx, query, sessionToken)
	if err != nil {
		return fmt.Errorf("failed to mark session used: %w", err)
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return database.ErrSessionNotFound
	}
	return nil
}

// GetTeamIDBySessionToken returns team_id if session token is valid and not expired
func (r *AuthRepository) GetTeamIDBySessionToken(ctx context.Context, sessionToken string) (*int, error) {
	query := `SELECT team_id FROM edit_sessions WHERE session_token = ? AND expires_at > NOW() LIMIT 1`
	var teamID int
	err := r.DB.QueryRowContext(ctx, query, sessionToken).Scan(&teamID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get team by session token: %w", err)
	}
	return &teamID, nil
}

// ResolveBearerToken returns teamID for either a valid session token or registration token
func (r *AuthRepository) ResolveBearerToken(ctx context.Context, token string) (teamID int, err error) {
	if id := r.getTeamIDBySessionToken(ctx, token); id != nil {
		return *id, nil
	}
	if id := r.getTeamIDByRegistrationToken(ctx, token); id != nil {
		return *id, nil
	}
	return 0, database.ErrInvalidToken
}

func (r *AuthRepository) getTeamIDBySessionToken(ctx context.Context, token string) *int {
	id, _ := r.GetTeamIDBySessionToken(ctx, token)
	return id
}

func (r *AuthRepository) getTeamIDByRegistrationToken(ctx context.Context, token string) *int {
	id, _ := r.GetTeamIDByRegistrationToken(ctx, token)
	return id
}
