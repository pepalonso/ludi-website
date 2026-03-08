package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"tournament-dev/internal/auth"
	"tournament-dev/internal/config"
	"tournament-dev/internal/database"
	"tournament-dev/internal/models"
	"tournament-dev/internal/request"
)

const (
	registrationTokenExpiry = 365 * 24 * time.Hour
	// frontendTeamPath is the frontend route for "view/edit team with token" (app.routes: path 'equip').
	// Not tied to /api/me/*; the token is used for auth/validator then Bearer for me APIs.
	frontendTeamPath = "/equip"
)

func truncBytes(b []byte, max int) string {
	if len(b) <= max {
		return string(b)
	}
	return string(b[:max]) + "..."
}

// RegistrationHandler handles public registration (inscription) endpoint.
type RegistrationHandler struct {
	*BaseHandler
	AllowedOrigins []string
	Notifier       auth.RegistrationNotifier
}

// NewRegistrationHandler creates a new registration handler.
// allowedOrigins: origins allowed for CORS; registration link uses the request's Origin when it's in this list.
func NewRegistrationHandler(repo database.Repository, allowedOrigins []string, notifier auth.RegistrationNotifier) *RegistrationHandler {
	return &RegistrationHandler{
		BaseHandler:    NewBaseHandler(repo),
		AllowedOrigins: allowedOrigins,
		Notifier:       notifier,
	}
}

// requestOrigin returns the origin of the request (Origin header, or scheme+host from Referer).
func requestOrigin(r *http.Request) string {
	if o := r.Header.Get("Origin"); o != "" {
		return strings.TrimSuffix(o, "/")
	}
	ref := r.Header.Get("Referer")
	if ref == "" {
		return ""
	}
	u, err := url.Parse(ref)
	if err != nil || u.Scheme == "" || u.Host == "" {
		return ""
	}
	return u.Scheme + "://" + u.Host
}

func (h *RegistrationHandler) isAllowedOrigin(origin string) bool {
	return config.OriginMatches(origin, h.AllowedOrigins)
}

// RegisterInscription handles POST /api/registrar-incripcio (no auth).
func (h *RegistrationHandler) RegisterInscription(w http.ResponseWriter, r *http.Request) {
	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		request.NewDecoder(w).SendError(http.StatusBadRequest, "Invalid request body", "INVALID_JSON")
		return
	}

	var body models.RegisterInscriptionRequest
	if err := json.Unmarshal(bodyBytes, &body); err != nil {
		// Try double-encoded JSON (body is a JSON string) for frontend compatibility
		var inner string
		if err2 := json.Unmarshal(bodyBytes, &inner); err2 == nil {
			if err3 := json.Unmarshal([]byte(inner), &body); err3 == nil {
				// success
			} else {
				log.Printf("[registration] decode failed (inner): %v", err3)
				request.NewDecoder(w).SendError(http.StatusBadRequest, "Invalid request body", "INVALID_JSON")
				return
			}
		} else {
			log.Printf("[registration] decode failed: %v | body prefix: %q", err, truncBytes(bodyBytes, 200))
			request.NewDecoder(w).SendError(http.StatusBadRequest, "Invalid request body", "INVALID_JSON")
			return
		}
	}

	if err := h.validateRegistrationBody(&body); err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx := r.Context()

	// 1. Club: find or create by name
	club, err := h.repo.GetClubByName(ctx, strings.TrimSpace(body.Club))
	if err != nil {
		log.Printf("[registration] lookup club failed: %v", err)
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to lookup club")
		return
	}
	if club == nil {
		clubName := strings.TrimSpace(body.Club)
		if err := h.repo.CreateClub(ctx, &models.ClubCreateRequest{ClubBase: models.ClubBase{Name: clubName}}); err != nil {
			h.ErrorResponse(w, http.StatusInternalServerError, "Failed to create club")
			return
		}
		club, err = h.repo.GetClubByName(ctx, clubName)
		if err != nil || club == nil {
			log.Printf("[registration] load created club failed: %v", err)
			h.ErrorResponse(w, http.StatusInternalServerError, "Failed to load created club")
			return
		}
	}

	// 2. Team
	observations := body.Observacions.Value
	teamReq := models.TeamCreateRequest{
		TeamBase: models.TeamBase{
			Name:     strings.TrimSpace(body.NomEquip),
			Email:    strings.TrimSpace(body.Email),
			Category: models.Category(body.Categoria),
			Phone:    strings.TrimSpace(body.Telefon),
			Gender:   models.Gender(body.Sexe),
			ClubID:   club.ID,
			Status:   models.StatusPendingPayment,
		},
		Observations: &observations,
	}
	if teamReq.Observations != nil && *teamReq.Observations == "" {
		teamReq.Observations = nil
	}
	teamID, err := h.repo.CreateTeam(ctx, &teamReq)
	if err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to create team: %v", err))
		return
	}
	createdTeam, err := h.repo.GetTeamByID(ctx, teamID)
	if err != nil {
		log.Printf("[registration] load created team failed: %v", err)
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to load created team")
		return
	}

	// 3. Players (keep first player ID for intolerancies)
	for _, j := range body.Jugadors {
		sz := models.ShirtSize(strings.TrimSpace(j.TallaSamarreta))
		req := models.PlayerCreateRequest{
			PlayerBase: models.PlayerBase{
				FirstName: strings.TrimSpace(j.Nom),
				LastName:  strings.TrimSpace(j.Cognoms),
				ShirtSize: sz,
				TeamID:    teamID,
			},
		}
		if err := h.repo.CreatePlayer(ctx, &req); err != nil {
			h.ErrorResponse(w, http.StatusInternalServerError, "Failed to create player")
			return
		}
	}
	players, _ := h.repo.GetPlayersByTeamID(ctx, teamID)
	var firstPlayerID *int
	if len(players) > 0 {
		firstPlayerID = &players[0].ID
	}

	// 4. Intolerancies on first player
	if firstPlayerID != nil {
		for _, desc := range body.Intolerancies {
			if desc == "" {
				continue
			}
			d := strings.TrimSpace(desc)
			allergyReq := models.AllergyCreateRequest{PlayerID: *firstPlayerID, Description: &d}
			_ = h.repo.CreateAllergy(ctx, &allergyReq)
		}
	}

	// 5. Coaches (use team phone as coach phone)
	for _, e := range body.Entrenadors {
		esPrincipal := e.EsPrincipal.Value == 1
		req := models.CoachCreateRequest{
			CoachBase: models.CoachBase{
				FirstName:   strings.TrimSpace(e.Nom),
				LastName:   strings.TrimSpace(e.Cognoms),
				ShirtSize:  strings.TrimSpace(e.TallaSamarreta),
				Phone:      createdTeam.Phone,
				TeamID:     teamID,
				IsHeadCoach: esPrincipal,
			},
		}
		if err := h.repo.CreateCoach(ctx, &req); err != nil {
			log.Printf("[registration] create coach failed team_id=%d: %v", teamID, err)
			h.ErrorResponse(w, http.StatusInternalServerError, "Failed to create coach")
			return
		}
	}

	// 6. Link documents (fitxes) to team
	for _, docID := range body.Fitxes {
		tid := teamID
		if err := h.repo.UpdateDocument(ctx, docID, &models.DocumentUpdateRequest{TeamID: &tid}); err != nil {
			// Log but do not fail registration if a document is missing
			continue
		}
	}

	// 7. Registration token
	token, err := randomHex(32)
	if err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to create registration token")
		return
	}
	expiresAt := time.Now().Add(registrationTokenExpiry)
	if err := h.repo.CreateRegistrationToken(ctx, teamID, token, expiresAt); err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to create registration token")
		return
	}

	// 8. Registration path and URL (use request origin when allowed, so dev/prod frontend get correct link)
	registrationPath := frontendTeamPath + "?token=" + token
	registrationURL := registrationPath
	if origin := requestOrigin(r); origin != "" && h.isAllowedOrigin(origin) {
		registrationURL = origin + registrationPath
	}

	// 9. Send WhatsApp and email confirmation (best-effort; do not fail response)
	if h.Notifier != nil {
		notifData := auth.RegistrationMessageData{
			TeamName:         createdTeam.Name,
			Club:             body.Club,
			Email:            createdTeam.Email,
			Phone:            createdTeam.Phone,
			NumPlayers:       len(body.Jugadors),
			NumCoaches:       len(body.Entrenadors),
			RegistrationPath: registrationPath,
			RegistrationURL:  registrationURL,
		}
		if err := h.Notifier.SendRegistration(ctx, notifData); err != nil {
			log.Printf("[registration] notifications failed (registration succeeded): %v", err)
		}
	}

	h.JSONResponse(w, http.StatusCreated, models.RegisterInscriptionResponse{
		RegistrationURL:  registrationURL,
		RegistrationPath: registrationPath,
		Message:          "Inscripció registrada correctament.",
		TeamID:           teamID,
	})
}

func (h *RegistrationHandler) validateRegistrationBody(b *models.RegisterInscriptionRequest) error {
	if strings.TrimSpace(b.Email) == "" {
		return fmt.Errorf("email is required")
	}
	if strings.TrimSpace(b.Categoria) == "" {
		return fmt.Errorf("categoria is required")
	}
	if strings.TrimSpace(b.Telefon) == "" {
		return fmt.Errorf("telefon is required")
	}
	if strings.TrimSpace(b.Sexe) == "" {
		return fmt.Errorf("sexe is required")
	}
	if strings.TrimSpace(b.Club) == "" {
		return fmt.Errorf("club is required")
	}
	if len(b.Jugadors) == 0 {
		return fmt.Errorf("at least one jugador is required")
	}
	if len(b.Entrenadors) == 0 {
		return fmt.Errorf("at least one entrenador is required")
	}
	// Validate category and gender match DB enums
	switch models.Category(b.Categoria) {
	case models.CategoryPreMini, models.CategoryMini, models.CategoryPreInfantil,
		models.CategoryInfantil, models.CategoryCadet, models.CategoryJunior:
	default:
		return fmt.Errorf("invalid categoria")
	}
	switch models.Gender(b.Sexe) {
	case models.GenderMasculi, models.GenderFemeni:
	default:
		return fmt.Errorf("invalid sexe")
	}
	return nil
}
