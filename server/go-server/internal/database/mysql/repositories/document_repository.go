package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"tournament-dev/internal/database/base"
	"tournament-dev/internal/models"
)

// DocumentRepository implements database.DocumentRepository
type DocumentRepository struct {
	*base.BaseRepository
}

// NewDocumentRepository creates a new document repository
func NewDocumentRepository(db *sql.DB) *DocumentRepository {
	return &DocumentRepository{
		BaseRepository: base.NewBaseRepository(db),
	}
}

// CreateDocument creates a new document
func (r *DocumentRepository) CreateDocument(ctx context.Context, document *models.DocumentCreateRequest) error {
	query := `
		INSERT INTO documents (team_id, file_name, file_path, file_size, mime_type, uploaded_at)
		VALUES (?, ?, ?, ?, ?, ?, NOW())
	`

	_, err := r.DB.ExecContext(ctx, query,
		document.TeamID,
		document.FileName,
		document.FilePath,
		document.FileSize,
		document.MimeType,
	)
	if err != nil {
		return fmt.Errorf("failed to create document: %w", err)
	}

	return nil
}

// GetDocumentByID retrieves a document by ID
func (r *DocumentRepository) GetDocumentByID(ctx context.Context, id int) (*models.Document, error) {
	query := `
		SELECT id, team_id, file_name, file_path, file_size, mime_type, uploaded_at
		FROM documents
		WHERE id = ?
	`

	document := &models.Document{}
	err := r.DB.QueryRowContext(ctx, query, id).Scan(
		&document.ID,
		&document.TeamID,
		&document.FileName,
		&document.FilePath,
		&document.FileSize,
		&document.MimeType,
		&document.UploadedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("document not found with ID: %d", id)
		}
		return nil, fmt.Errorf("failed to get document: %w", err)
	}

	return document, nil
}

// DeleteDocument deletes a document by ID
func (r *DocumentRepository) DeleteDocument(ctx context.Context, id int) error {
	query := `DELETE FROM documents WHERE id = ?`

	result, err := r.DB.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete document: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("document not found with ID: %d", id)
	}

	return nil
}

// ListDocuments retrieves a paginated list of documents
func (r *DocumentRepository) ListDocuments(ctx context.Context, filters models.DocumentFilters) (*models.DocumentListResponse, error) {
	query := `SELECT id, team_id, file_name, file_path, file_size, mime_type, uploaded_at FROM documents`
	args := []interface{}{}

	var conditions []string

	if filters.TeamID != nil {
		conditions = append(conditions, "team_id = ?")
		args = append(args, *filters.TeamID)
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

	query += whereClause + " ORDER BY uploaded_at DESC LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	// Execute the query
	rows, err := r.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query documents: %w", err)
	}
	defer rows.Close()

	var documents []models.DocumentResponse
	for rows.Next() {
		var document models.Document
		err := rows.Scan(
			&document.ID,
			&document.TeamID,
			&document.FileName,
			&document.FilePath,
			&document.FileSize,
			&document.MimeType,
			&document.UploadedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan document: %w", err)
		}

		documents = append(documents, models.DocumentResponse{
			ID:         document.ID,
			TeamID:     document.TeamID,
			FileName:   document.FileName,
			FilePath:   document.FilePath,
			FileSize:   document.FileSize,
			MimeType:   document.MimeType,
			UploadedAt: document.UploadedAt,
		})
	}

	// Get total count
	countQuery := `SELECT COUNT(*) FROM documents` + whereClause
	var total int
	err = r.DB.QueryRowContext(ctx, countQuery, args[:len(args)-2]...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count documents: %w", err)
	}

	totalPages := (total + limit - 1) / limit

	return &models.DocumentListResponse{
		Documents:  documents,
		Total:      total,
		Page:       filters.Page,
		PageSize:   limit,
		TotalPages: totalPages,
	}, nil
}

// GetDocumentsByTeamID retrieves all documents for a specific team
func (r *DocumentRepository) GetDocumentsByTeamID(ctx context.Context, teamID int) ([]models.Document, error) {
	query := `
		SELECT id, team_id, file_name, file_path, file_size, mime_type, uploaded_at
		FROM documents
		WHERE team_id = ?
		ORDER BY uploaded_at DESC
	`

	rows, err := r.DB.QueryContext(ctx, query, teamID)
	if err != nil {
		return nil, fmt.Errorf("failed to query documents: %w", err)
	}
	defer rows.Close()

	var documents []models.Document
	for rows.Next() {
		var document models.Document
		err := rows.Scan(
			&document.ID,
			&document.TeamID,
			&document.FileName,
			&document.FilePath,
			&document.FileSize,
			&document.MimeType,
			&document.UploadedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan document: %w", err)
		}
		documents = append(documents, document)
	}

	return documents, nil
}
