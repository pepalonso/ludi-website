package handlers

import (
	"errors"
	"fmt"
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
	if err := h.repo.UpdatePlayer(ctx, id, &player); err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to update player")
		return
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
	if err := h.repo.DeletePlayer(ctx, id); err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to delete player")
		return
	}

	h.JSONResponse(w, http.StatusNoContent, nil)
}
