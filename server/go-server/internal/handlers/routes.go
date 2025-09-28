package handlers

import (
	"fmt"
	"net/http"
	"time"

	"tournament-dev/internal/database"
)

var serverStartTime = time.Now()

type Router struct {
	clubHandler *ClubHandler
	// teamHandler    *TeamHandler
	playerHandler  *PlayerHandler
	coachHandler   *CoachHandler
	allergyHandler *AllergyHandler
	// documentHandler *DocumentHandler
}

func NewRouter(repo database.Repository) *Router {
	return &Router{
		clubHandler: NewClubHandler(repo),
		// teamHandler:    NewTeamHandler(repo),
		playerHandler:  NewPlayerHandler(repo),
		coachHandler:   NewCoachHandler(repo),
		allergyHandler: NewAllergyHandler(repo),
		// documentHandler: NewDocumentHandler(repo),
	}
}

func (r *Router) SetupRoutes(mux *http.ServeMux) {
	// Club routes
	mux.HandleFunc("POST /api/clubs", r.clubHandler.CreateClub)
	mux.HandleFunc("GET /api/clubs", r.clubHandler.ListClubs)
	mux.HandleFunc("GET /api/clubs/{id}", r.clubHandler.GetClub)
	mux.HandleFunc("PUT /api/clubs/{id}", r.clubHandler.UpdateClub)
	mux.HandleFunc("DELETE /api/clubs/{id}", r.clubHandler.DeleteClub)

	// Team routes (uncomment when you create TeamHandler)
	// mux.HandleFunc("POST /api/teams", r.teamHandler.CreateTeam)
	// mux.HandleFunc("GET /api/teams", r.teamHandler.ListTeams)
	// mux.HandleFunc("GET /api/teams/{id}", r.teamHandler.GetTeam)
	// mux.HandleFunc("PUT /api/teams/{id}", r.teamHandler.UpdateTeam)
	// mux.HandleFunc("DELETE /api/teams/{id}", r.teamHandler.DeleteTeam)
	// mux.HandleFunc("GET /api/teams/stats", r.teamHandler.GetTeamStats)

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

	// Document routes (uncomment when you create DocumentHandler)
	// mux.HandleFunc("POST /api/documents", r.documentHandler.CreateDocument)
	// mux.HandleFunc("GET /api/documents", r.documentHandler.ListDocuments)
	// mux.HandleFunc("GET /api/documents/{id}", r.documentHandler.GetDocument)
	// mux.HandleFunc("DELETE /api/documents/{id}", r.documentHandler.DeleteDocument)

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
