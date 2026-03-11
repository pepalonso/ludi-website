package handlers

import (
	"fmt"
	"log"
	"net/http"
	"tournament-dev/internal/database"
	"tournament-dev/internal/models"
	"tournament-dev/internal/request"

	"github.com/go-playground/validator/v10"
)

type AllergyHandler struct {
	*BaseHandler
}

func NewAllergyHandler(repo database.Repository) *AllergyHandler {
	return &AllergyHandler{
		BaseHandler: NewBaseHandler(repo),
	}
}

// CreateAllergy handles POST /api/allergies
func (h *AllergyHandler) CreateAllergy(w http.ResponseWriter, r *http.Request) {
	var allergy models.AllergyCreateRequest

	decoder := request.NewDecoder(w)
	if err := decoder.Decode(r, &allergy); err != nil {
		return
	}

	validate := validator.New()
	if err := validate.Struct(&allergy); err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}

	ctx := r.Context()
	if err := h.repo.CreateAllergy(ctx, &allergy); err != nil {
		log.Printf("[admin/allergies] CreateAllergy failed: %v", err)
		h.ErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to create allergy: %v", err))
		return
	}

	h.JSONResponse(w, http.StatusCreated, allergy)
}

// ListAllergies handles GET /api/allergies
func (h *AllergyHandler) ListAllergies(w http.ResponseWriter, r *http.Request) {
	page := request.ExtractIntQueryParamWithDefault(r, "page", 1)
	pageSize := request.ExtractIntQueryParamWithDefault(r, "page_size", 10)

	playerID, err := request.ExtractOptionalIntQueryParam(r, "player_id")
	if err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Invalid player_id: %v", err))
		return
	}

	filters := models.AllergyFilters{
		Page:     page,
		PageSize: pageSize,
	}

	if playerID != nil {
		filters.PlayerID = playerID
	}

	ctx := r.Context()
	allergies, err := h.repo.ListAllergies(ctx, filters)
	if err != nil {
		log.Printf("[admin/allergies] ListAllergies failed: %v", err)
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to list allergies")
		return
	}

	h.JSONResponse(w, http.StatusOK, allergies)
}

// ListAllergiesByTeam handles GET /api/allergies/team/{team_id}
func (h *AllergyHandler) ListAllergiesByTeam(w http.ResponseWriter, r *http.Request) {
	teamID, err := request.ExtractIntParam(r, "team_id")
	if err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Invalid team_id: %v", err))
		return
	}

	ctx := r.Context()
	allergies, err := h.repo.GetAllergiesByTeamID(ctx, teamID)
	if err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to list allergies by team")
		return
	}

	h.JSONResponse(w, http.StatusOK, allergies)
}

// DeleteAllergy handles DELETE /api/allergies/{id}
func (h *AllergyHandler) DeleteAllergy(w http.ResponseWriter, r *http.Request) {
	id, err := request.ExtractIntParam(r, "id")
	if err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx := r.Context()
	if err := h.repo.DeleteAllergy(ctx, id); err != nil {
		log.Printf("[admin/allergies] DeleteAllergy failed id=%d: %v", id, err)
		h.ErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to delete allergy: %v", err))
		return
	}

	h.JSONResponse(w, http.StatusNoContent, nil)
}

func (h *AllergyHandler) ListMeAllergies(w http.ResponseWriter, r *http.Request) {
	teamID := TeamIDFromContext(r.Context())
	if teamID == 0 {
		h.ErrorResponse(w, http.StatusUnauthorized, "missing team context")
		return
	}
	allergies, err := h.repo.GetAllergiesByTeamID(r.Context(), teamID)
	if err != nil {
		log.Printf("[me/allergies] ListMeAllergies failed team_id=%d: %v", teamID, err)
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to list allergies")
		return
	}
	h.JSONResponse(w, http.StatusOK, allergies)
}

func (h *AllergyHandler) CreateMeAllergy(w http.ResponseWriter, r *http.Request) {
	teamID := TeamIDFromContext(r.Context())
	if teamID == 0 {
		h.ErrorResponse(w, http.StatusUnauthorized, "missing team context")
		return
	}
	var allergy models.AllergyCreateRequest
	decoder := request.NewDecoder(w)
	if err := decoder.Decode(r, &allergy); err != nil {
		return
	}
	player, err := h.repo.GetPlayerByID(r.Context(), allergy.PlayerID)
	if err != nil || player == nil || player.TeamID != teamID {
		h.ErrorResponse(w, http.StatusBadRequest, "Player not found or not in your team")
		return
	}
	validate := validator.New()
	if err := validate.Struct(&allergy); err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}
	if err := h.repo.CreateAllergy(r.Context(), &allergy); err != nil {
		log.Printf("[allergy] CreateMeAllergy failed: %v", err)
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to create allergy")
		return
	}
	h.JSONResponse(w, http.StatusCreated, allergy)
}

func (h *AllergyHandler) DeleteMeAllergy(w http.ResponseWriter, r *http.Request) {
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
	allergy, err := h.repo.GetAllergyByID(r.Context(), id)
	if err != nil || allergy == nil {
		h.ErrorResponse(w, http.StatusNotFound, "Allergy not found")
		return
	}
	player, err := h.repo.GetPlayerByID(r.Context(), allergy.PlayerID)
	if err != nil || player == nil || player.TeamID != teamID {
		h.ErrorResponse(w, http.StatusNotFound, "Allergy not found")
		return
	}
	if err := h.repo.DeleteAllergy(r.Context(), id); err != nil {
		log.Printf("[me/allergies] DeleteMeAllergy failed team_id=%d allergy_id=%d: %v", teamID, id, err)
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to delete allergy")
		return
	}
	h.JSONResponse(w, http.StatusNoContent, nil)
}
