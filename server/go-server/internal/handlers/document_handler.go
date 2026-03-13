package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"tournament-dev/internal/database"
	"tournament-dev/internal/models"
	"tournament-dev/internal/request"

	"github.com/go-playground/validator/v10"
)

const maxUploadSize = 10 << 20 // 10 MiB

type DocumentHandler struct {
	*BaseHandler
	uploadDir string
}

func NewDocumentHandler(repo database.Repository, uploadDir string) *DocumentHandler {
	return &DocumentHandler{
		BaseHandler: NewBaseHandler(repo),
		uploadDir:   uploadDir,
	}
}

// ListDocuments handles GET /api/documents
func (h *DocumentHandler) ListDocuments(w http.ResponseWriter, r *http.Request) {
	page := request.ExtractIntQueryParamWithDefault(r, "page", 1)
	pageSize := request.ExtractIntQueryParamWithDefault(r, "page_size", 10)

	teamID, err := request.ExtractOptionalIntQueryParam(r, "team_id")
	if err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Invalid team_id: %v", err))
		return
	}

	filters := models.DocumentFilters{Page: page, PageSize: pageSize}
	if teamID != nil {
		filters.TeamID = teamID
	}

	if s := request.ExtractOptionalQueryParam(r, "document_type"); s != nil {
		dt := models.DocumentType(*s)
		if !isValidDocumentType(dt) {
			h.ErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Invalid document_type: %s", *s))
			return
		}
		filters.DocumentType = &dt
	}

	ctx := r.Context()
	resp, err := h.repo.ListDocuments(ctx, filters)
	if err != nil {
		log.Printf("[admin/documents] ListDocuments failed: %v", err)
		h.ErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to list documents: %v", err))
		return
	}

	h.JSONResponse(w, http.StatusOK, resp)
}

// GetDocument handles GET /api/documents/{id}
func (h *DocumentHandler) GetDocument(w http.ResponseWriter, r *http.Request) {
	id, err := request.ExtractIntParam(r, "id")
	if err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx := r.Context()
	doc, err := h.repo.GetDocumentByID(ctx, id)
	if err != nil {
		h.ErrorResponse(w, http.StatusNotFound, "Document not found")
		return
	}

	h.JSONResponse(w, http.StatusOK, doc)
}

// UpdateDocument handles PUT /api/documents/{id}. Only team_id can be updated (assign, change, or unassign).
func (h *DocumentHandler) UpdateDocument(w http.ResponseWriter, r *http.Request) {
	id, err := request.ExtractIntParam(r, "id")
	if err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	var req models.DocumentUpdateRequest
	decoder := request.NewDecoder(w)
	if err := decoder.Decode(r, &req); err != nil {
		return
	}

	ctx := r.Context()
	oldDoc, _ := h.repo.GetDocumentByID(ctx, id)
	if req.TeamID != nil {
		exists, err := h.repo.TeamExists(ctx, *req.TeamID)
		if err != nil || !exists {
			h.ErrorResponse(w, http.StatusBadRequest, "Team not found")
			return
		}
	}

	if err := h.repo.UpdateDocument(ctx, id, &req); err != nil {
		if strings.Contains(err.Error(), "not found") {
			h.ErrorResponse(w, http.StatusNotFound, "Document not found")
			return
		}
		log.Printf("[admin/documents] UpdateDocument failed id=%d: %v", id, err)
		h.ErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to update document: %v", err))
		return
	}

	doc, err := h.repo.GetDocumentByID(ctx, id)
	if err != nil {
		log.Printf("[admin/documents] UpdateDocument GetDocumentByID failed id=%d: %v", id, err)
		h.ErrorResponse(w, http.StatusInternalServerError, "Document updated but failed to load")
		return
	}
	if oldDoc != nil && doc != nil {
		oldJSON, _ := json.Marshal(oldDoc)
		newJSON, _ := json.Marshal(doc)
		LogChange(ctx, h.repo, "documents", id, models.ChangeActionUpdate, oldJSON, newJSON, doc.TeamID)
	}
	h.JSONResponse(w, http.StatusOK, doc)
}

// UploadDocument handles POST /api/documents/upload
func (h *DocumentHandler) UploadDocument(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, "File too large or invalid multipart form")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, "Missing or invalid file")
		return
	}
	defer file.Close()

	// team_id is optional; document can be assigned to a team later
	var teamID *int
	teamIDStr := r.FormValue("team_id")
	if teamIDStr != "" {
		id, err := strconv.Atoi(teamIDStr)
		if err != nil || id < 1 {
			h.ErrorResponse(w, http.StatusBadRequest, "Invalid team_id")
			return
		}
		teamID = &id
	}

	documentTypeStr := r.FormValue("document_type")
	if documentTypeStr == "" {
		h.ErrorResponse(w, http.StatusBadRequest, "document_type is required")
		return
	}
	documentType := models.DocumentType(documentTypeStr)
	if !isValidDocumentType(documentType) {
		h.ErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Invalid document_type: %s", documentTypeStr))
		return
	}

	ctx := r.Context()
	if teamID != nil {
		exists, err := h.repo.TeamExists(ctx, *teamID)
		if err != nil || !exists {
			h.ErrorResponse(w, http.StatusBadRequest, "Team not found")
			return
		}
	}

	// Safe unique filename; store under team_id subdir or "unassigned" when no team
	baseName := sanitizeFileName(header.Filename)
	if baseName == "" {
		baseName = "document"
	}
	uniqueName := fmt.Sprintf("%d_%s", time.Now().UnixNano(), baseName)
	subdir := "unassigned"
	if teamID != nil {
		subdir = strconv.Itoa(*teamID)
	}
	relPath := filepath.Join(subdir, uniqueName)
	fullPath := filepath.Join(h.uploadDir, relPath)

	if err := ensureDir(filepath.Dir(fullPath)); err != nil {
		log.Printf("[admin/documents] UploadDocument ensureDir failed: %v", err)
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to create upload directory")
		return
	}

	dst, err := createFile(fullPath)
	if err != nil {
		log.Printf("[admin/documents] UploadDocument createFile failed: %v", err)
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to save file")
		return
	}
	defer dst.Close()

	size, err := io.Copy(dst, file)
	if err != nil {
		_ = removeFile(fullPath)
		log.Printf("[admin/documents] UploadDocument io.Copy failed: %v", err)
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to save file")
		return
	}

	fileSize := int(size)
	mimeType := header.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	req := &models.DocumentCreateRequest{
		DocumentBase: models.DocumentBase{
			TeamID:       teamID,
			DocumentType: documentType,
			FileName:     header.Filename,
			FilePath:     filepath.ToSlash(relPath),
			MimeType:     &mimeType,
		},
		FileSize: &fileSize,
	}

	validate := validator.New()
	if err := validate.Struct(req); err != nil {
		_ = removeFile(fullPath)
		h.ErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}

	id, err := h.repo.CreateDocument(ctx, req)
	if err != nil {
		_ = removeFile(fullPath)
		log.Printf("[admin/documents] UploadDocument CreateDocument failed: %v", err)
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to create document record")
		return
	}

	created, err := h.repo.GetDocumentByID(ctx, int(id))
	if err != nil {
		log.Printf("[admin/documents] UploadDocument GetDocumentByID after create failed id=%d: %v", id, err)
		h.ErrorResponse(w, http.StatusInternalServerError, "Document created but failed to load")
		return
	}
	if created != nil {
		if newJSON, _ := json.Marshal(created); len(newJSON) > 0 {
			LogChange(ctx, h.repo, "documents", int(id), models.ChangeActionInsert, nil, newJSON, created.TeamID)
		}
	}
	h.JSONResponse(w, http.StatusCreated, created)
}

func isValidDocumentType(d models.DocumentType) bool {
	switch d {
	case models.DocumentTypeMedicalCertificate, models.DocumentTypeParentalConsent,
		models.DocumentTypePhotoRelease, models.DocumentTypeOther:
		return true
	default:
		return false
	}
}

func sanitizeFileName(name string) string {
	base := filepath.Base(name)
	// Remove path traversal and keep only safe chars
	base = strings.TrimSpace(base)
	if base == "" || base == "." || base == ".." {
		return ""
	}
	return base
}

func ensureDir(dir string) error {
	return os.MkdirAll(dir, 0755)
}

func createFile(path string) (*os.File, error) {
	return os.Create(path)
}

func removeFile(path string) error {
	return os.Remove(path)
}
