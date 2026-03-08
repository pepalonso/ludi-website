package handlers

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"tournament-dev/internal/auth"
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

// RegistrationHandler handles public registration (inscription) endpoint.
type RegistrationHandler struct {
	*BaseHandler
	FrontendURL string
	Notifier    auth.RegistrationNotifier
}

// NewRegistrationHandler creates a new registration handler.
func NewRegistrationHandler(repo database.Repository, frontendURL string, notifier auth.RegistrationNotifier) *RegistrationHandler {
	return &RegistrationHandler{
		BaseHandler:  NewBaseHandler(repo),
		FrontendURL:  strings.TrimSuffix(frontendURL, "/"),
		Notifier:     notifier,
	}
}

// RegisterInscription handles POST /api/registrar-incripcio (no auth).
func (h *RegistrationHandler) RegisterInscription(w http.ResponseWriter, r *http.Request) {
	var body models.RegisterInscriptionRequest
	decoder := request.NewDecoder(w)
	if err := decoder.Decode(r, &body); err != nil {
		return
	}

	if err := h.validateRegistrationBody(&body); err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx := r.Context()

	// 1. Club: find or create by name
	club, err := h.repo.GetClubByName(ctx, strings.TrimSpace(body.Club))
	if err != nil {
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
	if err := h.repo.CreateTeam(ctx, &teamReq); err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to create team: %v", err))
		return
	}
	createdTeam, err := h.repo.GetTeamByEmail(ctx, teamReq.Email)
	if err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to load created team")
		return
	}
	teamID := createdTeam.ID

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
		esPrincipal := false
		if e.EsPrincipal != nil && *e.EsPrincipal == 1 {
			esPrincipal = true
		}
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

	// 8. wa_token
	waToken, err := randomHex(32)
	if err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to create wa_token")
		return
	}
	if err := h.repo.CreateWAToken(ctx, teamID, createdTeam.Phone, waToken); err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, "Failed to create wa_token")
		return
	}

	// 9. Registration path and URL
	registrationPath := frontendTeamPath + "?token=" + token
	registrationURL := registrationPath
	if h.FrontendURL != "" {
		registrationURL = h.FrontendURL + registrationPath
	}

	// 10. Send WhatsApp and email confirmation (best-effort; do not fail response)
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
		WAToken:          waToken,
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
