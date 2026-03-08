package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
	"tournament-dev/internal/database"
	"tournament-dev/internal/models"
	"tournament-dev/internal/request"

	"github.com/go-playground/validator/v10"
)

const basquetCatalaClubsURL = "https://www.basquetcatala.cat/clubs/ajax"

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

// ListClubs handles GET /api/clubs (admin only).
func (h *ClubHandler) ListClubs(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	response, err := h.repo.ListClubs(ctx)
	if err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to list clubs: %v", err))
		return
	}

	h.JSONResponse(w, http.StatusOK, response.Clubs)
}

// basquetCatalaClubItem is the shape of one item from basquetcatala.cat/clubs/ajax (we only use name and logo).
type basquetCatalaClubItem struct {
	Name string `json:"name"`
	Logo string `json:"logo"`
}

// ListClubsPublic handles GET /api/clubs/list (no auth). Proxies basquetcatala.cat and returns [{ "club_name", "logo_url" }, ...].
func (h *ClubHandler) ListClubsPublic(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, basquetCatalaClubsURL+"?_="+fmt.Sprintf("%d", time.Now().UnixMilli()), nil)
	if err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, "failed to build upstream request")
		return
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("[clubs] upstream request failed: %v", err)
		h.ErrorResponse(w, http.StatusInternalServerError, "failed to fetch clubs")
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		log.Printf("[clubs] upstream status %d", resp.StatusCode)
		h.ErrorResponse(w, http.StatusBadGateway, "upstream clubs unavailable")
		return
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, "failed to read upstream response")
		return
	}
	var raw []basquetCatalaClubItem
	if err := json.Unmarshal(body, &raw); err != nil {
		log.Printf("[clubs] upstream JSON decode failed: %v", err)
		h.ErrorResponse(w, http.StatusBadGateway, "invalid upstream response")
		return
	}
	out := make([]models.ClubListPublicItem, 0, len(raw))
	for _, c := range raw {
		if c.Name != "" {
			out = append(out, models.ClubListPublicItem{
				ClubName: c.Name,
				LogoURL:  c.Logo,
			})
		}
	}
	h.JSONResponse(w, http.StatusOK, out)
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
