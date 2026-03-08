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

// CreateDocument creates a new document and returns the new document ID.
func (r *DocumentRepository) CreateDocument(ctx context.Context, document *models.DocumentCreateRequest) (int64, error) {
	query := `
		INSERT INTO documents (team_id, document_type, file_name, file_path, file_size, mime_type, uploaded_at)
		VALUES (?, ?, ?, ?, ?, ?, NOW())
	`

	teamIDArg := sql.NullInt64{}
	if document.TeamID != nil {
		teamIDArg = sql.NullInt64{Int64: int64(*document.TeamID), Valid: true}
	}

	result, err := r.DB.ExecContext(ctx, query,
		teamIDArg,
		document.DocumentType,
		document.FileName,
		document.FilePath,
		document.FileSize,
		document.MimeType,
	)
	if err != nil {
		return 0, fmt.Errorf("failed to create document: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("failed to get document id: %w", err)
	}
	return id, nil
}

// GetDocumentByID retrieves a document by ID
func (r *DocumentRepository) GetDocumentByID(ctx context.Context, id int) (*models.Document, error) {
	query := `
		SELECT id, team_id, document_type, file_name, file_path, file_size, mime_type, uploaded_at
		FROM documents
		WHERE id = ?
	`

	document := &models.Document{}
	var teamIDNull sql.NullInt64
	err := r.DB.QueryRowContext(ctx, query, id).Scan(
		&document.ID,
		&teamIDNull,
		&document.DocumentType,
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
	if teamIDNull.Valid {
		tid := int(teamIDNull.Int64)
		document.TeamID = &tid
	}

	return document, nil
}

// UpdateDocument updates only the team_id of a document.
func (r *DocumentRepository) UpdateDocument(ctx context.Context, id int, req *models.DocumentUpdateRequest) error {
	query := `UPDATE documents SET team_id = ? WHERE id = ?`
	teamIDArg := sql.NullInt64{}
	if req.TeamID != nil {
		teamIDArg = sql.NullInt64{Int64: int64(*req.TeamID), Valid: true}
	}
	result, err := r.DB.ExecContext(ctx, query, teamIDArg, id)
	if err != nil {
		return fmt.Errorf("failed to update document: %w", err)
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
	query := `SELECT id, team_id, document_type, file_name, file_path, file_size, mime_type, uploaded_at FROM documents`
	args := []interface{}{}

	var conditions []string

	if filters.TeamID != nil {
		conditions = append(conditions, "team_id = ?")
		args = append(args, *filters.TeamID)
	}

	if filters.DocumentType != nil {
		conditions = append(conditions, "document_type = ?")
		args = append(args, *filters.DocumentType)
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
		var doc models.Document
		var teamIDNull sql.NullInt64
		err := rows.Scan(
			&doc.ID,
			&teamIDNull,
			&doc.DocumentType,
			&doc.FileName,
			&doc.FilePath,
			&doc.FileSize,
			&doc.MimeType,
			&doc.UploadedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan document: %w", err)
		}
		var teamID *int
		if teamIDNull.Valid {
			tid := int(teamIDNull.Int64)
			teamID = &tid
		}
		documents = append(documents, models.DocumentResponse{
			ID:           doc.ID,
			TeamID:       teamID,
			DocumentType: doc.DocumentType,
			FileName:     doc.FileName,
			FilePath:     doc.FilePath,
			FileSize:     doc.FileSize,
			MimeType:     doc.MimeType,
			UploadedAt:   doc.UploadedAt,
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
		SELECT id, team_id, document_type, file_name, file_path, file_size, mime_type, uploaded_at
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
		var doc models.Document
		var teamIDNull sql.NullInt64
		err := rows.Scan(
			&doc.ID,
			&teamIDNull,
			&doc.DocumentType,
			&doc.FileName,
			&doc.FilePath,
			&doc.FileSize,
			&doc.MimeType,
			&doc.UploadedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan document: %w", err)
		}
		if teamIDNull.Valid {
			tid := int(teamIDNull.Int64)
			doc.TeamID = &tid
		}
		documents = append(documents, doc)
	}

	return documents, nil
}
