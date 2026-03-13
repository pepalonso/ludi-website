package repositories

import (
	"context"
	"database/sql"
	"fmt"

	"tournament-dev/internal/database/base"
	"tournament-dev/internal/models"
)

type ChangesLogRepository struct {
	*base.BaseRepository
}

func NewChangesLogRepository(db *sql.DB) *ChangesLogRepository {
	return &ChangesLogRepository{BaseRepository: base.NewBaseRepository(db)}
}

// LogChange inserts an audit log entry. TeamID may be nil (e.g. for clubs).
func (r *ChangesLogRepository) LogChange(ctx context.Context, entry *models.ChangeLogEntry) error {
	query := `
		INSERT INTO changes_log (table_name, record_id, action, old_values, new_values, changed_by, team_id)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`
	_, err := r.DB.ExecContext(ctx, query,
		entry.TableName,
		entry.RecordID,
		string(entry.Action),
		nullJSON(entry.OldValues),
		nullJSON(entry.NewValues),
		entry.ChangedBy,
		entry.TeamID,
	)
	if err != nil {
		return fmt.Errorf("changes_log insert: %w", err)
	}
	return nil
}

func nullJSON(b []byte) interface{} {
	if b == nil || len(b) == 0 {
		return nil
	}
	return b
}

// ListChangesByTeamID returns paginated changes for the given team (team_id = ? or record on that team).
func (r *ChangesLogRepository) ListChangesByTeamID(ctx context.Context, teamID int, page, pageSize int) (*models.ChangeLogListResponse, error) {
	if pageSize <= 0 {
		pageSize = 20
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * pageSize

	query := `
		SELECT id, table_name, record_id, action, old_values, new_values, changed_by, team_id, changed_at
		FROM changes_log
		WHERE team_id = ?
		ORDER BY changed_at DESC
		LIMIT ? OFFSET ?
	`
	rows, err := r.DB.QueryContext(ctx, query, teamID, pageSize, offset)
	if err != nil {
		return nil, fmt.Errorf("changes_log list: %w", err)
	}
	defer rows.Close()

	var changes []models.ChangeLogRow
	for rows.Next() {
		var row models.ChangeLogRow
		var oldVal, newVal []byte
		var teamIDNull *int
		err := rows.Scan(
			&row.ID,
			&row.TableName,
			&row.RecordID,
			&row.Action,
			&oldVal,
			&newVal,
			&row.ChangedBy,
			&teamIDNull,
			&row.ChangedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("changes_log scan: %w", err)
		}
		row.OldValues = oldVal
		row.NewValues = newVal
		row.TeamID = teamIDNull
		changes = append(changes, row)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	var total int
	countQuery := `SELECT COUNT(*) FROM changes_log WHERE team_id = ?`
	if err := r.DB.QueryRowContext(ctx, countQuery, teamID).Scan(&total); err != nil {
		return nil, fmt.Errorf("changes_log count: %w", err)
	}

	totalPages := (total + pageSize - 1) / pageSize
	if totalPages < 1 {
		totalPages = 1
	}

	return &models.ChangeLogListResponse{
		Changes:    changes,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}
