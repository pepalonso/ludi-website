package handlers

import (
	"encoding/json"
	"net/http"

	"tournament-dev/internal/database"
)

type BaseHandler struct {
	repo database.Repository
}

func NewBaseHandler(repo database.Repository) *BaseHandler {
	return &BaseHandler{repo: repo}
}

func (h *BaseHandler) JSONResponse(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	if data != nil {
		if err := json.NewEncoder(w).Encode(data); err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		}
	}
}

func (h *BaseHandler) ErrorResponse(w http.ResponseWriter, statusCode int, message string) {
	h.JSONResponse(w, statusCode, map[string]string{
		"error": message,
	})
}

func (h *BaseHandler) GetRepository() database.Repository {
	return h.repo
}

func (h *BaseHandler) ValidationErrorResponse(w http.ResponseWriter, validationErrors []interface{}) {
	errorResponse := map[string]interface{}{
		"error":   "Validation failed",
		"details": validationErrors,
		"code":    "VALIDATION_ERROR",
		"message": "One or more fields failed validation",
	}

	h.JSONResponse(w, http.StatusBadRequest, errorResponse)
}
