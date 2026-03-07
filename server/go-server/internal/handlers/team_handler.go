package handlers

import (
	"fmt"
	"net/http"
	"strings"

	"tournament-dev/internal/database"
	"tournament-dev/internal/models"
	"tournament-dev/internal/request"

	"github.com/go-playground/validator/v10"
)

type TeamHandler struct {
	*BaseHandler
}

func NewTeamHandler(repo database.Repository) *TeamHandler {
	return &TeamHandler{
		BaseHandler: NewBaseHandler(repo),
	}
}

// CreateTeam handles POST /api/teams
func (h *TeamHandler) CreateTeam(w http.ResponseWriter, r *http.Request) {
	var team models.TeamCreateRequest

	decoder := request.NewDecoder(w)
	if err := decoder.Decode(r, &team); err != nil {
		return
	}

	// Default status when not provided
	if team.Status == "" {
		team.Status = models.StatusPendingPayment
	}

	validate := validator.New()
	if err := validate.Struct(&team); err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}

	ctx := r.Context()
	if err := h.repo.CreateTeam(ctx, &team); err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to create team: %v", err))
		return
	}

	// Option B: load created team by email and return it
	created, err := h.repo.GetTeamByEmail(ctx, team.Email)
	if err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to load created team")
		return
	}

	h.JSONResponse(w, http.StatusCreated, created)
}

// GetTeam handles GET /api/teams/{id}
func (h *TeamHandler) GetTeam(w http.ResponseWriter, r *http.Request) {
	id, err := request.ExtractIntParam(r, "id")
	if err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx := r.Context()
	team, err := h.repo.GetTeamByID(ctx, id)
	if err != nil {
		h.ErrorResponse(w, http.StatusNotFound, "Team not found")
		return
	}

	h.JSONResponse(w, http.StatusOK, team)
}

// ListTeams handles GET /api/teams
func (h *TeamHandler) ListTeams(w http.ResponseWriter, r *http.Request) {
	page := request.ExtractIntQueryParamWithDefault(r, "page", 1)
	pageSize := request.ExtractIntQueryParamWithDefault(r, "page_size", 10)

	clubID, err := request.ExtractOptionalIntQueryParam(r, "club_id")
	if err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Invalid club_id: %v", err))
		return
	}

	search := request.ExtractOptionalQueryParam(r, "search")

	filters := models.TeamFilters{
		Page:     page,
		PageSize: pageSize,
	}
	if clubID != nil {
		filters.ClubID = clubID
	}
	if search != nil {
		filters.Search = search
	}

	// Optional enum filters: category, gender, status
	if s := request.ExtractOptionalQueryParam(r, "category"); s != nil {
		c := models.Category(*s)
		if !isValidCategory(c) {
			h.ErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Invalid category: %s", *s))
			return
		}
		filters.Category = &c
	}
	if s := request.ExtractOptionalQueryParam(r, "gender"); s != nil {
		g := models.Gender(*s)
		if !isValidGender(g) {
			h.ErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Invalid gender: %s", *s))
			return
		}
		filters.Gender = &g
	}
	if s := request.ExtractOptionalQueryParam(r, "status"); s != nil {
		st := models.Status(*s)
		if !isValidStatus(st) {
			h.ErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Invalid status: %s", *s))
			return
		}
		filters.Status = &st
	}

	ctx := r.Context()
	response, err := h.repo.ListTeams(ctx, filters)
	if err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to list teams: %v", err))
		return
	}

	h.JSONResponse(w, http.StatusOK, response)
}

// UpdateTeam handles PUT /api/teams/{id}
func (h *TeamHandler) UpdateTeam(w http.ResponseWriter, r *http.Request) {
	id, err := request.ExtractIntParam(r, "id")
	if err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	var team models.TeamUpdateRequest
	decoder := request.NewDecoder(w)
	if err := decoder.Decode(r, &team); err != nil {
		return
	}

	validate := validator.New()
	if err := validate.Struct(&team); err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}

	ctx := r.Context()
	if err := h.repo.UpdateTeam(ctx, id, &team); err != nil {
		if err != nil && strings.Contains(err.Error(), "not found") {
			h.ErrorResponse(w, http.StatusNotFound, "Team not found")
			return
		}
		h.ErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to update team: %v", err))
		return
	}

	updated, err := h.repo.GetTeamByID(ctx, id)
	if err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to load updated team")
		return
	}

	h.JSONResponse(w, http.StatusOK, updated)
}

// GetTeamStats handles GET /api/teams/stats
func (h *TeamHandler) GetTeamStats(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	stats, err := h.repo.GetTeamStats(ctx)
	if err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to get team stats: %v", err))
		return
	}

	h.JSONResponse(w, http.StatusOK, stats)
}

func isValidCategory(c models.Category) bool {
	switch c {
	case models.CategoryPreMini, models.CategoryMini, models.CategoryPreInfantil,
		models.CategoryInfantil, models.CategoryCadet, models.CategoryJunior:
		return true
	default:
		return false
	}
}

func isValidGender(g models.Gender) bool {
	switch g {
	case models.GenderMasculi, models.GenderFemeni:
		return true
	default:
		return false
	}
}

func isValidStatus(s models.Status) bool {
	switch s {
	case models.StatusPendingPayment, models.StatusCanceled, models.StatusActive:
		return true
	default:
		return false
	}
}

