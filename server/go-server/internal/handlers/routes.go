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
	clubHandler         *ClubHandler
	teamHandler         *TeamHandler
	playerHandler       *PlayerHandler
	coachHandler        *CoachHandler
	allergyHandler      *AllergyHandler
	documentHandler    *DocumentHandler
	authHandler        *AuthHandler
	adminAuthHandler   *AdminAuthHandler
	registrationHandler *RegistrationHandler
}

func NewRouter(repo database.Repository, uploadDir string, pinSender auth.PINSender, allowedOrigins []string, registrationNotifier auth.RegistrationNotifier) *Router {
	return &Router{
		clubHandler:         NewClubHandler(repo),
		teamHandler:         NewTeamHandler(repo),
		playerHandler:       NewPlayerHandler(repo),
		coachHandler:        NewCoachHandler(repo),
		allergyHandler:      NewAllergyHandler(repo),
		documentHandler:     NewDocumentHandler(repo, uploadDir),
		authHandler:         NewAuthHandler(repo, pinSender),
		adminAuthHandler:    NewAdminAuthHandler(repo),
		registrationHandler: NewRegistrationHandler(repo, allowedOrigins, registrationNotifier),
	}
}

func (r *Router) SetupRoutes(mux *http.ServeMux) {
	// Public routes (no auth)
	mux.HandleFunc("POST /api/registrar-incripcio", r.registrationHandler.RegisterInscription)
	mux.HandleFunc("POST /registrar-incripcio", r.registrationHandler.RegisterInscription)
	mux.HandleFunc("POST /auth/generate", r.authHandler.Generate)
	mux.HandleFunc("POST /auth/validator", r.authHandler.Validator)
	mux.HandleFunc("POST /api/documents/upload", r.documentHandler.UploadDocument)
	mux.HandleFunc("POST /auth/admin/login", r.adminAuthHandler.AdminLogin)
	mux.HandleFunc("POST /auth/admin/logout", r.adminAuthHandler.AdminLogout)

	// Admin-protected routes (Bearer = admin session token)
	requireAdminAuth := RequireAdminAuth(r.clubHandler.GetRepository())
	mux.Handle("POST /auth/generate-admin-session-token", requireAdminAuth(http.HandlerFunc(r.adminAuthHandler.GenerateAdminSessionToken)))
	mux.Handle("POST /api/clubs", requireAdminAuth(http.HandlerFunc(r.clubHandler.CreateClub)))
	mux.Handle("GET /api/clubs", requireAdminAuth(http.HandlerFunc(r.clubHandler.ListClubs)))
	mux.Handle("GET /api/clubs/{id}", requireAdminAuth(http.HandlerFunc(r.clubHandler.GetClub)))
	mux.Handle("PUT /api/clubs/{id}", requireAdminAuth(http.HandlerFunc(r.clubHandler.UpdateClub)))
	mux.Handle("DELETE /api/clubs/{id}", requireAdminAuth(http.HandlerFunc(r.clubHandler.DeleteClub)))

	mux.Handle("GET /api/teams/stats", requireAdminAuth(http.HandlerFunc(r.teamHandler.GetTeamStats)))
	mux.Handle("POST /api/teams", requireAdminAuth(http.HandlerFunc(r.teamHandler.CreateTeam)))
	mux.Handle("GET /api/teams", requireAdminAuth(http.HandlerFunc(r.teamHandler.ListTeams)))
	mux.Handle("GET /api/teams/{id}", requireAdminAuth(http.HandlerFunc(r.teamHandler.GetTeam)))
	mux.Handle("PUT /api/teams/{id}", requireAdminAuth(http.HandlerFunc(r.teamHandler.UpdateTeam)))

	mux.Handle("POST /api/players", requireAdminAuth(http.HandlerFunc(r.playerHandler.CreatePlayer)))
	mux.Handle("GET /api/players", requireAdminAuth(http.HandlerFunc(r.playerHandler.ListPlayers)))
	mux.Handle("GET /api/players/{id}", requireAdminAuth(http.HandlerFunc(r.playerHandler.GetPlayer)))
	mux.Handle("PUT /api/players/{id}", requireAdminAuth(http.HandlerFunc(r.playerHandler.UpdatePlayer)))
	mux.Handle("DELETE /api/players/{id}", requireAdminAuth(http.HandlerFunc(r.playerHandler.DeletePlayer)))

	mux.Handle("POST /api/coaches", requireAdminAuth(http.HandlerFunc(r.coachHandler.CreateCoach)))
	mux.Handle("GET /api/coaches", requireAdminAuth(http.HandlerFunc(r.coachHandler.ListCoaches)))
	mux.Handle("GET /api/coaches/{id}", requireAdminAuth(http.HandlerFunc(r.coachHandler.GetCoach)))
	mux.Handle("PUT /api/coaches/{id}", requireAdminAuth(http.HandlerFunc(r.coachHandler.UpdateCoach)))
	mux.Handle("DELETE /api/coaches/{id}", requireAdminAuth(http.HandlerFunc(r.coachHandler.DeleteCoach)))

	mux.Handle("POST /api/allergies", requireAdminAuth(http.HandlerFunc(r.allergyHandler.CreateAllergy)))
	mux.Handle("GET /api/allergies", requireAdminAuth(http.HandlerFunc(r.allergyHandler.ListAllergies)))
	mux.Handle("GET /api/allergies/team/{team_id}", requireAdminAuth(http.HandlerFunc(r.allergyHandler.ListAllergiesByTeam)))
	mux.Handle("DELETE /api/allergies/{id}", requireAdminAuth(http.HandlerFunc(r.allergyHandler.DeleteAllergy)))

	mux.Handle("GET /api/documents", requireAdminAuth(http.HandlerFunc(r.documentHandler.ListDocuments)))
	mux.Handle("GET /api/documents/{id}", requireAdminAuth(http.HandlerFunc(r.documentHandler.GetDocument)))
	mux.Handle("PUT /api/documents/{id}", requireAdminAuth(http.HandlerFunc(r.documentHandler.UpdateDocument)))

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
