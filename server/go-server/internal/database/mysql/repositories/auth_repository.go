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

// GetAdminByEmail returns the password_hash for the admin with the given email, or ErrNoRows.
func (r *AuthRepository) GetAdminByEmail(ctx context.Context, email string) (passwordHash string, err error) {
	err = r.DB.QueryRowContext(ctx, `SELECT password_hash FROM admins WHERE email = ? LIMIT 1`, email).Scan(&passwordHash)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", nil
		}
		return "", fmt.Errorf("failed to get admin by email: %w", err)
	}
	return passwordHash, nil
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

// CreateAdminSession inserts an admin session token with expiry (15 min TTL)
func (r *AuthRepository) CreateAdminSession(ctx context.Context, token string, expiresAt time.Time) error {
	query := `INSERT INTO admin_sessions (token, expires_at) VALUES (?, ?)`
	_, err := r.DB.ExecContext(ctx, query, token, expiresAt)
	if err != nil {
		return fmt.Errorf("failed to create admin session: %w", err)
	}
	return nil
}

// ValidateAdminSession returns true if token exists and is not expired
func (r *AuthRepository) ValidateAdminSession(ctx context.Context, token string) (bool, error) {
	query := `SELECT 1 FROM admin_sessions WHERE token = ? AND expires_at > NOW() LIMIT 1`
	var one int
	err := r.DB.QueryRowContext(ctx, query, token).Scan(&one)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, nil
		}
		return false, fmt.Errorf("failed to validate admin session: %w", err)
	}
	return true, nil
}

// DeleteAdminSession removes the admin session (for logout)
func (r *AuthRepository) DeleteAdminSession(ctx context.Context, token string) error {
	query := `DELETE FROM admin_sessions WHERE token = ?`
	_, err := r.DB.ExecContext(ctx, query, token)
	if err != nil {
		return fmt.Errorf("failed to delete admin session: %w", err)
	}
	return nil
}

// CreateAdminGrantedTeamSession inserts an edit_session for admin-granted access (no PIN; is_used=TRUE).
// pin_hash is a placeholder to satisfy NOT NULL; contact_method is 'admin'.
func (r *AuthRepository) CreateAdminGrantedTeamSession(ctx context.Context, teamID int, sessionToken string, expiresAt time.Time) error {
	const placeholderPinHash = "$2a$10$adminplaceholder"
	query := `INSERT INTO edit_sessions (team_id, session_token, pin_hash, contact_method, is_used, expires_at)
		VALUES (?, ?, ?, 'admin', TRUE, ?)`
	_, err := r.DB.ExecContext(ctx, query, teamID, sessionToken, placeholderPinHash, expiresAt)
	if err != nil {
		return fmt.Errorf("failed to create admin-granted team session: %w", err)
	}
	return nil
}
