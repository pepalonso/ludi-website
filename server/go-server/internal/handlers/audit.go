package handlers

import (
	"context"

	"tournament-dev/internal/database"
	"tournament-dev/internal/models"
)

// LogChange records an audit entry. ChangedBy is set from context (AuditActorFromContext); use "unknown" if empty.
func LogChange(ctx context.Context, repo database.Repository, tableName string, recordID int, action models.ChangeAction, oldValues, newValues []byte, teamID *int) {
	actor := AuditActorFromContext(ctx)
	if actor == "" {
		actor = "unknown"
	}
	entry := &models.ChangeLogEntry{
		TableName: tableName,
		RecordID:  recordID,
		Action:    action,
		OldValues: oldValues,
		NewValues: newValues,
		ChangedBy: actor,
		TeamID:    teamID,
	}
	_ = repo.LogChange(ctx, entry)
}
