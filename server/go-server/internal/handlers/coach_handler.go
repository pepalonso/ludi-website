package handlers

import (
	"fmt"
	"net/http"
	"tournament-dev/internal/database"
	"tournament-dev/internal/models"
	"tournament-dev/internal/request"

	"github.com/go-playground/validator/v10"
)

type CoachHandler struct {
	*BaseHandler
}

func NewCoachHandler(repo database.Repository) *CoachHandler {
	return &CoachHandler{
		BaseHandler: NewBaseHandler(repo),
	}
}

// CreateCoach handles POST /api/coaches
func (h *CoachHandler) CreateCoach(w http.ResponseWriter, r *http.Request) {
	var coach models.CoachCreateRequest

	decoder := request.NewDecoder(w)
	if err := decoder.Decode(r, &coach); err != nil {
		return
	}

	validate := validator.New()
	if err := validate.Struct(&coach); err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}

	ctx := r.Context()
	if err := h.repo.CreateCoach(ctx, &coach); err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to create coach: %v", err))
	}
}

// GetCoach handles GET /api/coaches/{id}
func (h *CoachHandler) GetCoach(w http.ResponseWriter, r *http.Request) {
	id, err := request.ExtractIntParam(r, "id")
	if err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx := r.Context()
	coach, err := h.repo.GetCoachByID(ctx, id)
	if err != nil {
		h.ErrorResponse(w, http.StatusNotFound, "Club not found")
		return
	}

	h.JSONResponse(w, http.StatusOK, coach)
}

// ListCoaches handles GET/ /api/coaches
func (h *CoachHandler) ListCoaches(w http.ResponseWriter, r *http.Request) {
	page := request.ExtractIntParamWithDefault(r, "page", 1)
	pageSize := request.ExtractIntParamWithDefault(r, "page_size", 10)

	teamId, err := request.ExtractOptionalIntQueryParam(r, "team_id")
	if err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Invalid team_id: %v", err))
		return
	}

	shirtSize := request.ExtractOptionalQueryParam(r, "shirt_size")
	search := request.ExtractOptionalQueryParam(r, "search")

	filters := models.CoachFilters{
		Page:     page,
		PageSize: pageSize,
	}

	if teamId != nil {
		filters.TeamID = teamId
	}

	if shirtSize != nil {
		filters.ShirtSize = shirtSize
	}

	if search != nil {
		filters.Search = search
	}

	ctx := r.Context()
	coaches, err := h.repo.ListCoaches(ctx, filters)
	if err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to list coaches")
		return
	}

	h.JSONResponse(w, http.StatusOK, coaches)
}

func (h *CoachHandler) UpdateCoach(w http.ResponseWriter, r *http.Request) {
	id, err := request.ExtractIntParam(r, "id")
	if err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, err.Error())
	}

	var coach models.CoachUpdateRequest

	decoder := request.NewDecoder(w)
	if err := decoder.Decode(r, &coach); err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, err.Error())
	}

	validate := validator.New()
	if err := validate.Struct(&coach); err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}

	ctx := r.Context()

	if err := h.repo.UpdateCoach(ctx, id, &coach); err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to update coach: %v", err))
	}

	h.JSONResponse(w, http.StatusOK, "Coach updated successfully")
}

func (h *CoachHandler) DeleteCoach(w http.ResponseWriter, r *http.Request) {
	id, err := request.ExtractIntParam(r, "id")
	if err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx := r.Context()
	if err := h.repo.DeleteCoach(ctx, id); err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to delete coach: %v", err))
	}

	h.JSONResponse(w, http.StatusOK, "Coach deleted successfully")
}

func (h *CoachHandler) ListMeCoaches(w http.ResponseWriter, r *http.Request) {
	teamID := TeamIDFromContext(r.Context())
	if teamID == 0 {
		h.ErrorResponse(w, http.StatusUnauthorized, "missing team context")
		return
	}
	page := request.ExtractIntParamWithDefault(r, "page", 1)
	pageSize := request.ExtractIntParamWithDefault(r, "page_size", 10)
	filters := models.CoachFilters{Page: page, PageSize: pageSize, TeamID: &teamID}
	resp, err := h.repo.ListCoaches(r.Context(), filters)
	if err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to list coaches")
		return
	}
	h.JSONResponse(w, http.StatusOK, resp)
}

func (h *CoachHandler) CreateMeCoach(w http.ResponseWriter, r *http.Request) {
	teamID := TeamIDFromContext(r.Context())
	if teamID == 0 {
		h.ErrorResponse(w, http.StatusUnauthorized, "missing team context")
		return
	}
	var coach models.CoachCreateRequest
	decoder := request.NewDecoder(w)
	if err := decoder.Decode(r, &coach); err != nil {
		return
	}
	coach.TeamID = teamID
	validate := validator.New()
	if err := validate.Struct(&coach); err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}
	if err := h.repo.CreateCoach(r.Context(), &coach); err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to create coach")
		return
	}
	h.JSONResponse(w, http.StatusCreated, coach)
}

func (h *CoachHandler) GetMeCoach(w http.ResponseWriter, r *http.Request) {
	teamID := TeamIDFromContext(r.Context())
	if teamID == 0 {
		h.ErrorResponse(w, http.StatusUnauthorized, "missing team context")
		return
	}
	id, err := request.ExtractIntParam(r, "id")
	if err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}
	coach, err := h.repo.GetCoachByID(r.Context(), id)
	if err != nil || coach == nil || coach.TeamID != teamID {
		h.ErrorResponse(w, http.StatusNotFound, "Coach not found")
		return
	}
	h.JSONResponse(w, http.StatusOK, coach)
}

func (h *CoachHandler) UpdateMeCoach(w http.ResponseWriter, r *http.Request) {
	teamID := TeamIDFromContext(r.Context())
	if teamID == 0 {
		h.ErrorResponse(w, http.StatusUnauthorized, "missing team context")
		return
	}
	id, err := request.ExtractIntParam(r, "id")
	if err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}
	coach, err := h.repo.GetCoachByID(r.Context(), id)
	if err != nil || coach == nil || coach.TeamID != teamID {
		h.ErrorResponse(w, http.StatusNotFound, "Coach not found")
		return
	}
	var req models.CoachUpdateRequest
	decoder := request.NewDecoder(w)
	if err := decoder.Decode(r, &req); err != nil {
		return
	}
	validate := validator.New()
	if err := validate.Struct(&req); err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}
	if err := h.repo.UpdateCoach(r.Context(), id, &req); err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to update coach")
		return
	}
	h.JSONResponse(w, http.StatusOK, req)
}

func (h *CoachHandler) DeleteMeCoach(w http.ResponseWriter, r *http.Request) {
	teamID := TeamIDFromContext(r.Context())
	if teamID == 0 {
		h.ErrorResponse(w, http.StatusUnauthorized, "missing team context")
		return
	}
	id, err := request.ExtractIntParam(r, "id")
	if err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}
	coach, err := h.repo.GetCoachByID(r.Context(), id)
	if err != nil || coach == nil || coach.TeamID != teamID {
		h.ErrorResponse(w, http.StatusNotFound, "Coach not found")
		return
	}
	if err := h.repo.DeleteCoach(r.Context(), id); err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to delete coach")
		return
	}
	h.JSONResponse(w, http.StatusNoContent, nil)
}
