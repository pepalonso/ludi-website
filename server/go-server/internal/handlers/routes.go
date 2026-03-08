package handlers

import (
	"fmt"
	"net/http"
	"time"

	"tournament-dev/internal/auth"
	"tournament-dev/internal/database"
)

var serverStartTime = time.Now()

type Router struct {
	clubHandler        *ClubHandler
	teamHandler        *TeamHandler
	playerHandler      *PlayerHandler
	coachHandler       *CoachHandler
	allergyHandler     *AllergyHandler
	documentHandler    *DocumentHandler
	authHandler        *AuthHandler
	registrationHandler *RegistrationHandler
}

func NewRouter(repo database.Repository, uploadDir string, pinSender auth.PINSender, frontendURL string, registrationNotifier auth.RegistrationNotifier) *Router {
	return &Router{
		clubHandler:         NewClubHandler(repo),
		teamHandler:         NewTeamHandler(repo),
		playerHandler:       NewPlayerHandler(repo),
		coachHandler:        NewCoachHandler(repo),
		allergyHandler:      NewAllergyHandler(repo),
		documentHandler:     NewDocumentHandler(repo, uploadDir),
		authHandler:         NewAuthHandler(repo, pinSender),
		registrationHandler: NewRegistrationHandler(repo, frontendURL, registrationNotifier),
	}
}

func (r *Router) SetupRoutes(mux *http.ServeMux) {
	// Club routes
	mux.HandleFunc("POST /api/clubs", r.clubHandler.CreateClub)
	mux.HandleFunc("GET /api/clubs", r.clubHandler.ListClubs)
	mux.HandleFunc("GET /api/clubs/{id}", r.clubHandler.GetClub)
	mux.HandleFunc("PUT /api/clubs/{id}", r.clubHandler.UpdateClub)
	mux.HandleFunc("DELETE /api/clubs/{id}", r.clubHandler.DeleteClub)

	// Team routes (GET /api/teams/stats before /api/teams/{id} so it matches first)
	mux.HandleFunc("GET /api/teams/stats", r.teamHandler.GetTeamStats)
	mux.HandleFunc("POST /api/teams", r.teamHandler.CreateTeam)
	mux.HandleFunc("GET /api/teams", r.teamHandler.ListTeams)
	mux.HandleFunc("GET /api/teams/{id}", r.teamHandler.GetTeam)
	mux.HandleFunc("PUT /api/teams/{id}", r.teamHandler.UpdateTeam)

	// Player routes (uncomment when you create PlayerHandler)
	mux.HandleFunc("POST /api/players", r.playerHandler.CreatePlayer)
	mux.HandleFunc("GET /api/players", r.playerHandler.ListPlayers)
	mux.HandleFunc("GET /api/players/{id}", r.playerHandler.GetPlayer)
	mux.HandleFunc("PUT /api/players/{id}", r.playerHandler.UpdatePlayer)
	mux.HandleFunc("DELETE /api/players/{id}", r.playerHandler.DeletePlayer)

	// Coach routes (uncomment when you create CoachHandler)
	mux.HandleFunc("POST /api/coaches", r.coachHandler.CreateCoach)
	mux.HandleFunc("GET /api/coaches", r.coachHandler.ListCoaches)
	mux.HandleFunc("GET /api/coaches/{id}", r.coachHandler.GetCoach)
	mux.HandleFunc("PUT /api/coaches/{id}", r.coachHandler.UpdateCoach)
	mux.HandleFunc("DELETE /api/coaches/{id}", r.coachHandler.DeleteCoach)

	// Allergy routes
	mux.HandleFunc("POST /api/allergies", r.allergyHandler.CreateAllergy)
	mux.HandleFunc("GET /api/allergies", r.allergyHandler.ListAllergies)
	mux.HandleFunc("GET /api/allergies/team/{team_id}", r.allergyHandler.ListAllergiesByTeam)
	mux.HandleFunc("DELETE /api/allergies/{id}", r.allergyHandler.DeleteAllergy)

	// Public registration (inscription) - no auth (both paths for frontend compatibility)
	mux.HandleFunc("POST /api/registrar-incripcio", r.registrationHandler.RegisterInscription)
	mux.HandleFunc("POST /registrar-incripcio", r.registrationHandler.RegisterInscription)

	// Document routes (upload before /api/documents/{id} so path matches correctly)
	mux.HandleFunc("POST /api/documents/upload", r.documentHandler.UploadDocument)
	mux.HandleFunc("GET /api/documents", r.documentHandler.ListDocuments)
	mux.HandleFunc("GET /api/documents/{id}", r.documentHandler.GetDocument)
	mux.HandleFunc("PUT /api/documents/{id}", r.documentHandler.UpdateDocument)

	// Auth
	mux.HandleFunc("POST /auth/generate", r.authHandler.Generate)
	mux.HandleFunc("POST /auth/validator", r.authHandler.Validator)

	// Team-owner routes under /api/me/ (require Bearer token → team_id)
	requireTeamAuth := RequireTeamAuth(r.teamHandler.GetRepository())
	mux.Handle("GET /api/me/team", requireTeamAuth(http.HandlerFunc(r.teamHandler.GetMeTeam)))
	mux.Handle("PUT /api/me/team", requireTeamAuth(http.HandlerFunc(r.teamHandler.UpdateMeTeam)))
	mux.Handle("GET /api/me/players", requireTeamAuth(http.HandlerFunc(r.playerHandler.ListMePlayers)))
	mux.Handle("POST /api/me/players", requireTeamAuth(http.HandlerFunc(r.playerHandler.CreateMePlayer)))
	mux.Handle("GET /api/me/players/{id}", requireTeamAuth(http.HandlerFunc(r.playerHandler.GetMePlayer)))
	mux.Handle("PUT /api/me/players/{id}", requireTeamAuth(http.HandlerFunc(r.playerHandler.UpdateMePlayer)))
	mux.Handle("DELETE /api/me/players/{id}", requireTeamAuth(http.HandlerFunc(r.playerHandler.DeleteMePlayer)))
	mux.Handle("GET /api/me/coaches", requireTeamAuth(http.HandlerFunc(r.coachHandler.ListMeCoaches)))
	mux.Handle("POST /api/me/coaches", requireTeamAuth(http.HandlerFunc(r.coachHandler.CreateMeCoach)))
	mux.Handle("GET /api/me/coaches/{id}", requireTeamAuth(http.HandlerFunc(r.coachHandler.GetMeCoach)))
	mux.Handle("PUT /api/me/coaches/{id}", requireTeamAuth(http.HandlerFunc(r.coachHandler.UpdateMeCoach)))
	mux.Handle("DELETE /api/me/coaches/{id}", requireTeamAuth(http.HandlerFunc(r.coachHandler.DeleteMeCoach)))
	mux.Handle("GET /api/me/allergies", requireTeamAuth(http.HandlerFunc(r.allergyHandler.ListMeAllergies)))
	mux.Handle("POST /api/me/allergies", requireTeamAuth(http.HandlerFunc(r.allergyHandler.CreateMeAllergy)))
	mux.Handle("DELETE /api/me/allergies/{id}", requireTeamAuth(http.HandlerFunc(r.allergyHandler.DeleteMeAllergy)))

	// Health check
	mux.HandleFunc("GET /health", r.healthCheck)
}

func (r *Router) healthCheck(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	uptime := time.Since(serverStartTime)
	uptimeStr := formatUptime(uptime)

	response := fmt.Sprintf(`{"status": "ok", "uptime": "%s"}`, uptimeStr)
	w.Write([]byte(response))
}

func formatUptime(d time.Duration) string {
	hours := int(d.Hours())
	minutes := int(d.Minutes()) % 60
	seconds := int(d.Seconds()) % 60

	if hours > 0 {
		return fmt.Sprintf("%dh%dm%ds", hours, minutes, seconds)
	} else if minutes > 0 {
		return fmt.Sprintf("%dm%ds", minutes, seconds)
	} else {
		return fmt.Sprintf("%ds", seconds)
	}
}
