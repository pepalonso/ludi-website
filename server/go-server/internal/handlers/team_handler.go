package handlers

import (
	"fmt"
	"log"
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
	teamID, err := h.repo.CreateTeam(ctx, &team)
	if err != nil {
		log.Printf("[admin/teams] CreateTeam failed: %v", err)
		h.ErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to create team: %v", err))
		return
	}

	created, err := h.repo.GetTeamByID(ctx, teamID)
	if err != nil {
		log.Printf("[admin/teams] CreateTeam GetTeamByID failed team_id=%d: %v", teamID, err)
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to load created team")
		return
	}

	h.JSONResponse(w, http.StatusCreated, map[string]interface{}{
		"id":                created.ID,
		"name":              created.Name,
		"email":             created.Email,
		"category":          created.Category,
		"phone":             created.Phone,
		"gender":            created.Gender,
		"club_id":           created.ClubID,
		"observations":      created.Observations,
		"registration_date": created.RegistrationDate,
		"updated_at":        created.UpdatedAt,
		"status":            created.Status,
	})
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
		log.Printf("[admin/teams] ListTeams failed: %v", err)
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
		log.Printf("[admin/teams] UpdateTeam failed id=%d: %v", id, err)
		h.ErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to update team: %v", err))
		return
	}

	updated, err := h.repo.GetTeamByID(ctx, id)
	if err != nil {
		log.Printf("[admin/teams] UpdateTeam GetTeamByID failed id=%d: %v", id, err)
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to load updated team")
		return
	}

	h.JSONResponse(w, http.StatusOK, updated)
}

// GetMeTeam handles GET /api/me/team (requires auth; team_id from context). Response shape matches frontend mapTeamResponse.
func (h *TeamHandler) GetMeTeam(w http.ResponseWriter, r *http.Request) {
	teamID := TeamIDFromContext(r.Context())
	if teamID == 0 {
		h.ErrorResponse(w, http.StatusUnauthorized, "missing team context")
		return
	}
	ctx := r.Context()
	team, err := h.repo.GetTeamWithRelations(ctx, teamID)
	if err != nil {
		h.ErrorResponse(w, http.StatusNotFound, "team not found")
		return
	}
	allergies, _ := h.repo.GetAllergiesByTeamID(ctx, teamID)
	intolerancies := make([]string, 0, len(allergies))
	for _, a := range allergies {
		if a.Description != nil && *a.Description != "" {
			intolerancies = append(intolerancies, *a.Description)
		}
	}
	clubName := ""
	if team.Club != nil {
		clubName = team.Club.Name
	}
	observacions := ""
	if team.Observations != nil {
		observacions = *team.Observations
	}
	resp := models.MeTeamResponse{
		NomEquip:       team.Name,
		Email:          team.Email,
		Telefon:        team.Phone,
		Sexe:           string(team.Gender),
		Categoria:      string(team.Category),
		Club:           clubName,
		Observacions:   observacions,
		DataInscripcio: team.RegistrationDate.Format("2006-01-02T15:04:05Z07:00"),
		Intolerancies:  intolerancies,
		Jugadors:       make([]models.MeTeamJugador, 0, len(team.Players)),
		Entrenadors:    make([]models.MeTeamEntrenador, 0, len(team.Coaches)),
	}
	for _, p := range team.Players {
		resp.Jugadors = append(resp.Jugadors, models.MeTeamJugador{
			ID:             p.ID,
			Nom:            p.FirstName,
			Cognoms:        p.LastName,
			TallaSamarreta: string(p.ShirtSize),
		})
	}
	for _, c := range team.Coaches {
		resp.Entrenadors = append(resp.Entrenadors, models.MeTeamEntrenador{
			ID:             c.ID,
			Nom:            c.FirstName,
			Cognoms:        c.LastName,
			TallaSamarreta: c.ShirtSize,
			EsPrincipal:    c.IsHeadCoach,
		})
	}
	h.JSONResponse(w, http.StatusOK, resp)
}

// UpdateMeTeam handles PUT /api/me/team (requires auth; team_id from context). Only observations are accepted.
func (h *TeamHandler) UpdateMeTeam(w http.ResponseWriter, r *http.Request) {
	teamID := TeamIDFromContext(r.Context())
	if teamID == 0 {
		h.ErrorResponse(w, http.StatusUnauthorized, "missing team context")
		return
	}
	var req models.MeTeamUpdateRequest
	decoder := request.NewDecoder(w)
	if err := decoder.Decode(r, &req); err != nil {
		return
	}
	ctx := r.Context()
	if err := h.repo.UpdateTeamObservations(ctx, teamID, req.Observations); err != nil {
		if err != nil && strings.Contains(err.Error(), "not found") {
			h.ErrorResponse(w, http.StatusNotFound, "Team not found")
			return
		}
		log.Printf("[me/team] UpdateMeTeam UpdateTeamObservations failed team_id=%d: %v", teamID, err)
		h.ErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to update team: %v", err))
		return
	}
	updated, err := h.repo.GetTeamByID(ctx, teamID)
	if err != nil {
		log.Printf("[me/team] UpdateMeTeam GetTeamByID failed team_id=%d: %v", teamID, err)
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
		log.Printf("[admin/teams] GetTeamStats failed: %v", err)
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

