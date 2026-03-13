package models

import "time"

// ChangeLogEntry is a single audit log row (for insert).
type ChangeLogEntry struct {
	TableName string          `json:"table_name"`
	RecordID  int             `json:"record_id"`
	Action    ChangeAction    `json:"action"`
	OldValues []byte          `json:"old_values,omitempty"` // JSON, nil for INSERT
	NewValues []byte          `json:"new_values,omitempty"` // JSON, nil for DELETE
	ChangedBy string          `json:"changed_by"`           // "admin" or "team:123"
	TeamID    *int            `json:"team_id,omitempty"`    // nullable; for filtering by team
	ChangedAt time.Time       `json:"changed_at"`
}

// ChangeLogRow is a row returned when listing changes (e.g. by team).
type ChangeLogRow struct {
	ID        int       `json:"id"`
	TableName string    `json:"table_name"`
	RecordID  int       `json:"record_id"`
	Action    string    `json:"action"`
	OldValues []byte    `json:"old_values,omitempty"`
	NewValues []byte    `json:"new_values,omitempty"`
	ChangedBy string    `json:"changed_by"`
	TeamID    *int      `json:"team_id,omitempty"`
	ChangedAt time.Time `json:"changed_at"`
}

// ChangeLogListResponse is the response for GET /api/teams/{id}/changes.
type ChangeLogListResponse struct {
	Changes   []ChangeLogRow `json:"changes"`
	Total     int            `json:"total"`
	Page      int            `json:"page"`
	PageSize  int            `json:"page_size"`
	TotalPages int           `json:"total_pages"`
}
