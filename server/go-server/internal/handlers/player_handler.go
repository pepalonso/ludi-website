package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"tournament-dev/internal/database"
	customerrors "tournament-dev/internal/errors"
	"tournament-dev/internal/models"
	"tournament-dev/internal/request"

	"github.com/go-playground/validator/v10"
)

type PlayerHandler struct {
	*BaseHandler
}

func NewPlayerHandler(repo database.Repository) *PlayerHandler {
	return &PlayerHandler{
		BaseHandler: NewBaseHandler(repo),
	}
}

// CreatePlayer handles POST /api/players
func (h *PlayerHandler) CreatePlayer(w http.ResponseWriter, r *http.Request) {
	var player models.PlayerCreateRequest

	decoder := request.NewDecoder(w)
	if err := decoder.Decode(r, &player); err != nil {
		return
	}

	validate := validator.New()
	if err := validate.Struct(&player); err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}

	ctx := r.Context()
	if err := h.repo.CreatePlayer(ctx, &player); err != nil {
		var teamNotFound *customerrors.TeamNotFoundError
		if errors.As(err, &teamNotFound) {
			h.ErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Team with ID %d not found", teamNotFound.TeamID))
			return
		}

		log.Printf("[admin/players] CreatePlayer failed: %v", err)
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to create player")
		return
	}

	h.JSONResponse(w, http.StatusCreated, player)
}

// GetPlayer handles GET /api/players/{id}
func (h *PlayerHandler) GetPlayer(w http.ResponseWriter, r *http.Request) {
	id, err := request.ExtractIntParam(r, "id")
	if err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx := r.Context()
	player, err := h.repo.GetPlayerByID(ctx, id)
	if err != nil {
		h.ErrorResponse(w, http.StatusNotFound, "Player not found")
		return
	}

	h.JSONResponse(w, http.StatusOK, player)
}

// ListPlayers handles GET /api/players
func (h *PlayerHandler) ListPlayers(w http.ResponseWriter, r *http.Request) {
	page := request.ExtractIntQueryParamWithDefault(r, "page", 1)
	pageSize := request.ExtractIntQueryParamWithDefault(r, "page_size", 10)

	teamId, err := request.ExtractOptionalIntQueryParam(r, "team_id")
	if err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Invalid team_id: %v", err))
		return
	}

	shirtSize := request.ExtractOptionalQueryParam(r, "shirt_size")
	search := request.ExtractOptionalQueryParam(r, "search")

	filters := models.PlayerFilters{
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

	players, err := h.repo.ListPlayers(ctx, filters)
	if err != nil {
		log.Printf("[admin/players] ListPlayers failed: %v", err)
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to list players")
		return
	}

	h.JSONResponse(w, http.StatusOK, players)
}

// UpdatePlayer handles PUT /api/players/{id}
func (h *PlayerHandler) UpdatePlayer(w http.ResponseWriter, r *http.Request) {
	id, err := request.ExtractIntParam(r, "id")
	if err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	var player models.PlayerUpdateRequest

	decoder := request.NewDecoder(w)
	if err := decoder.Decode(r, &player); err != nil {
		return
	}

	validate := validator.New()
	if err := validate.Struct(&player); err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}

	ctx := r.Context()
	oldPlayer, _ := h.repo.GetPlayerByID(ctx, id)
	if err := h.repo.UpdatePlayer(ctx, id, &player); err != nil {
		log.Printf("[admin/players] UpdatePlayer failed id=%d: %v", id, err)
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to update player")
		return
	}
	updated, _ := h.repo.GetPlayerByID(ctx, id)
	if oldPlayer != nil && updated != nil {
		oldJSON, _ := json.Marshal(oldPlayer)
		newJSON, _ := json.Marshal(updated)
		tid := oldPlayer.TeamID
		LogChange(ctx, h.repo, "players", id, models.ChangeActionUpdate, oldJSON, newJSON, &tid)
	}
	h.JSONResponse(w, http.StatusOK, player)
}

// DeletePlayer handles DELETE /api/players/{id}
func (h *PlayerHandler) DeletePlayer(w http.ResponseWriter, r *http.Request) {
	id, err := request.ExtractIntParam(r, "id")
	if err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx := r.Context()
	oldPlayer, _ := h.repo.GetPlayerByID(ctx, id)
	if err := h.repo.DeletePlayer(ctx, id); err != nil {
		log.Printf("[admin/players] DeletePlayer failed id=%d: %v", id, err)
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to delete player")
		return
	}
	if oldPlayer != nil {
		oldJSON, _ := json.Marshal(oldPlayer)
		tid := oldPlayer.TeamID
		LogChange(ctx, h.repo, "players", id, models.ChangeActionDelete, oldJSON, nil, &tid)
	}
	h.JSONResponse(w, http.StatusNoContent, nil)
}

// Me players: team_id from context, scope enforced

func (h *PlayerHandler) ListMePlayers(w http.ResponseWriter, r *http.Request) {
	teamID := TeamIDFromContext(r.Context())
	if teamID == 0 {
		h.ErrorResponse(w, http.StatusUnauthorized, "missing team context")
		return
	}
	page := request.ExtractIntQueryParamWithDefault(r, "page", 1)
	pageSize := request.ExtractIntQueryParamWithDefault(r, "page_size", 10)
	filters := models.PlayerFilters{Page: page, PageSize: pageSize, TeamID: &teamID}
	resp, err := h.repo.ListPlayers(r.Context(), filters)
	if err != nil {
		log.Printf("[me/players] ListMePlayers failed team_id=%d: %v", teamID, err)
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to list players")
		return
	}
	h.JSONResponse(w, http.StatusOK, resp)
}

func (h *PlayerHandler) CreateMePlayer(w http.ResponseWriter, r *http.Request) {
	teamID := TeamIDFromContext(r.Context())
	if teamID == 0 {
		h.ErrorResponse(w, http.StatusUnauthorized, "missing team context")
		return
	}
	var player models.PlayerCreateRequest
	decoder := request.NewDecoder(w)
	if err := decoder.Decode(r, &player); err != nil {
		return
	}
	player.TeamID = teamID
	validate := validator.New()
	if err := validate.Struct(&player); err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}
	if err := h.repo.CreatePlayer(r.Context(), &player); err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to create player")
		return
	}
	h.JSONResponse(w, http.StatusCreated, player)
}

func (h *PlayerHandler) GetMePlayer(w http.ResponseWriter, r *http.Request) {
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
	player, err := h.repo.GetPlayerByID(r.Context(), id)
	if err != nil || player == nil || player.TeamID != teamID {
		h.ErrorResponse(w, http.StatusNotFound, "Player not found")
		return
	}
	h.JSONResponse(w, http.StatusOK, player)
}

func (h *PlayerHandler) UpdateMePlayer(w http.ResponseWriter, r *http.Request) {
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
	player, err := h.repo.GetPlayerByID(r.Context(), id)
	if err != nil || player == nil || player.TeamID != teamID {
		h.ErrorResponse(w, http.StatusNotFound, "Player not found")
		return
	}
	var req models.PlayerUpdateRequest
	decoder := request.NewDecoder(w)
	if err := decoder.Decode(r, &req); err != nil {
		return
	}
	validate := validator.New()
	if err := validate.Struct(&req); err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}
	oldPlayer := player
	if err := h.repo.UpdatePlayer(r.Context(), id, &req); err != nil {
		log.Printf("[me/players] UpdateMePlayer failed team_id=%d player_id=%d: %v", teamID, id, err)
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to update player")
		return
	}
	updated, _ := h.repo.GetPlayerByID(r.Context(), id)
	if oldPlayer != nil && updated != nil {
		oldJSON, _ := json.Marshal(oldPlayer)
		newJSON, _ := json.Marshal(updated)
		LogChange(r.Context(), h.repo, "players", id, models.ChangeActionUpdate, oldJSON, newJSON, &teamID)
	}
	h.JSONResponse(w, http.StatusOK, req)
}

func (h *PlayerHandler) DeleteMePlayer(w http.ResponseWriter, r *http.Request) {
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
	player, err := h.repo.GetPlayerByID(r.Context(), id)
	if err != nil || player == nil || player.TeamID != teamID {
		h.ErrorResponse(w, http.StatusNotFound, "Player not found")
		return
	}
	oldPlayer := player
	if err := h.repo.DeletePlayer(r.Context(), id); err != nil {
		log.Printf("[me/players] DeleteMePlayer failed team_id=%d player_id=%d: %v", teamID, id, err)
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to delete player")
		return
	}
	if oldPlayer != nil {
		oldJSON, _ := json.Marshal(oldPlayer)
		LogChange(r.Context(), h.repo, "players", id, models.ChangeActionDelete, oldJSON, nil, &teamID)
	}
	h.JSONResponse(w, http.StatusNoContent, nil)
}
