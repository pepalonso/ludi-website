package handlers

import (
	"fmt"
	"net/http"
	"tournament-dev/internal/database"
	"tournament-dev/internal/models"
	"tournament-dev/internal/request"

	"github.com/go-playground/validator/v10"
)

type ClubHandler struct {
	*BaseHandler
}

func NewClubHandler(repo database.Repository) *ClubHandler {
	return &ClubHandler{
		BaseHandler: NewBaseHandler(repo),
	}
}

// CreateClub handles POST /api/clubs
func (h *ClubHandler) CreateClub(w http.ResponseWriter, r *http.Request) {
	var club models.ClubCreateRequest

	decoder := request.NewDecoder(w)
	if err := decoder.Decode(r, &club); err != nil {
		return
	}

	validate := validator.New()
	if err := validate.Struct(&club); err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}

	ctx := r.Context()
	if err := h.repo.CreateClub(ctx, &club); err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to create club: %v", err))
		return
	}

	h.JSONResponse(w, http.StatusCreated, club)
}

// GetClub handles GET /api/clubs/{id}
func (h *ClubHandler) GetClub(w http.ResponseWriter, r *http.Request) {
	id, err := request.ExtractIntParam(r, "id")
	if err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx := r.Context()
	club, err := h.repo.GetClubByID(ctx, id)
	if err != nil {
		h.ErrorResponse(w, http.StatusNotFound, "Club not found")
		return
	}

	h.JSONResponse(w, http.StatusOK, club)
}

// ListClubs handles GET /api/
func (h *ClubHandler) ListClubs(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	response, err := h.repo.ListClubs(ctx)
	if err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to list clubs: %v", err))
		return
	}

	h.JSONResponse(w, http.StatusOK, response.Clubs)
}

// DeleteClub handles DELETE /api/clubs/{id}
func (h *ClubHandler) DeleteClub(w http.ResponseWriter, r *http.Request) {
	id, err := request.ExtractIntParam(r, "id")
	if err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx := r.Context()
	if err := h.repo.DeleteClub(ctx, id); err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to delete club: %v", err))
		return
	}

	h.JSONResponse(w, http.StatusNoContent, nil)
}

// UpdateClub handles PUT /api/clubs/{id}
func (h *ClubHandler) UpdateClub(w http.ResponseWriter, r *http.Request) {
	id, err := request.ExtractIntParam(r, "id")
	if err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	var club models.ClubUpdateRequest
	decoder := request.NewDecoder(w)
	if err := decoder.Decode(r, &club); err != nil {
		return
	}

	validate := validator.New()
	if err := validate.Struct(&club); err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Validation failed: %v", err))
		return
	}

	ctx := r.Context()
	if err := h.repo.UpdateClub(ctx, id, &club); err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to update club: %v", err))
		return
	}

	h.JSONResponse(w, http.StatusOK, club)
}
