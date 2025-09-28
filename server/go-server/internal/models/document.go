package models

import "time"

type DocumentBase struct {
	TeamID       int          `json:"team_id" db:"team_id" validate:"required,gt=0,foreign_key=teams.id"`
	DocumentType DocumentType `json:"document_type" db:"document_type" validate:"required"`
	FileName     string       `json:"file_name" db:"file_name" validate:"required,min=1,max=255"`
	FilePath     string       `json:"file_path" db:"file_path" validate:"required,min=1,max=500"`
	MimeType     *string      `json:"mime_type" db:"mime_type" validate:"omitempty,max=100"`
}

type Document struct {
	ID int `json:"id" db:"id"`
	DocumentBase
	FileSize   *int      `json:"file_size" db:"file_size"`
	UploadedAt time.Time `json:"uploaded_at" db:"uploaded_at"`

	Team *Team `json:"team,omitempty" db:"-"`
}

type DocumentCreateRequest struct {
	DocumentBase
	FileSize *int `json:"file_size,omitempty"`
}

type DocumentUpdateRequest struct {
	DocumentType DocumentType `json:"document_type,omitempty"`
	FileName     string       `json:"file_name,omitempty"`
	FilePath     string       `json:"file_path,omitempty"`
	FileSize     *int         `json:"file_size,omitempty"`
	MimeType     *string      `json:"mime_type,omitempty"`
}

type DocumentResponse struct {
	ID           int           `json:"id"`
	TeamID       int           `json:"team_id"`
	DocumentType DocumentType  `json:"document_type"`
	FileName     string        `json:"file_name"`
	FilePath     string        `json:"file_path"`
	FileSize     *int          `json:"file_size"`
	MimeType     *string       `json:"mime_type"`
	UploadedAt   time.Time     `json:"uploaded_at"`
	Team         *TeamResponse `json:"team,omitempty"`
}

type DocumentListResponse struct {
	Documents  []DocumentResponse `json:"documents"`
	Total      int                `json:"total"`
	Page       int                `json:"page"`
	PageSize   int                `json:"page_size"`
	TotalPages int                `json:"total_pages"`
}

type DocumentFilters struct {
	TeamID       *int          `json:"team_id,omitempty"`
	DocumentType *DocumentType `json:"document_type,omitempty"`
	Page         int           `json:"page"`
	PageSize     int           `json:"page_size"`
}

type DocumentUploadRequest struct {
	TeamID       int          `json:"team_id" validate:"required"`
	DocumentType DocumentType `json:"document_type" validate:"required"`
}
