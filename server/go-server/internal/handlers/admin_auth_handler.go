package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"time"

	"tournament-dev/internal/database"
)

const adminSessionTTL = 15 * time.Minute

// AdminAuthHandler handles POST /auth/admin/login and POST /auth/admin/logout
type AdminAuthHandler struct {
	*BaseHandler
}

// NewAdminAuthHandler creates a new admin auth handler
func NewAdminAuthHandler(repo database.Repository) *AdminAuthHandler {
	return &AdminAuthHandler{
		BaseHandler: NewBaseHandler(repo),
	}
}

// AdminLoginRequest is the body for POST /auth/admin/login
type AdminLoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// AdminLogin handles POST /auth/admin/login (public)
func (h *AdminAuthHandler) AdminLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.ErrorResponse(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var req AdminLoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, "invalid body")
		return
	}
	if req.Email == "" || req.Password == "" {
		h.ErrorResponse(w, http.StatusBadRequest, "email and password required")
		return
	}

	adminEmail := os.Getenv("ADMIN_EMAIL")
	adminPassword := os.Getenv("ADMIN_PASSWORD")
	if adminEmail == "" || adminPassword == "" {
		h.ErrorResponse(w, http.StatusInternalServerError, "admin not configured")
		return
	}
	if req.Email != adminEmail || req.Password != adminPassword {
		h.ErrorResponse(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	token, err := randomHex(32)
	if err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, "failed to generate token")
		return
	}
	expiresAt := time.Now().Add(adminSessionTTL)
	if err := h.repo.CreateAdminSession(r.Context(), token, expiresAt); err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, "failed to create session")
		return
	}

	h.JSONResponse(w, http.StatusOK, map[string]string{
		"admin_token": token,
		"expires_at":  expiresAt.Format(time.RFC3339),
	})
}

// AdminLogout handles POST /auth/admin/logout (Bearer = admin token)
func (h *AdminAuthHandler) AdminLogout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.ErrorResponse(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	token := extractBearerToken(r)
	if token == "" {
		h.ErrorResponse(w, http.StatusUnauthorized, "missing authorization")
		return
	}

	_ = h.repo.DeleteAdminSession(r.Context(), token)
	w.WriteHeader(http.StatusNoContent)
}

// GenerateAdminSessionTokenRequest is the body for POST /auth/generate-admin-session-token
type GenerateAdminSessionTokenRequest struct {
	TeamToken string `json:"team_token"`
}

// GenerateAdminSessionToken handles POST /auth/generate-admin-session-token (Bearer = admin token).
// Returns a team session_token so the client can call /api/me/* for that team.
func (h *AdminAuthHandler) GenerateAdminSessionToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.ErrorResponse(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var req GenerateAdminSessionTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.TeamToken == "" {
		h.ErrorResponse(w, http.StatusBadRequest, "team_token required")
		return
	}

	teamID, err := h.repo.GetTeamIDByRegistrationToken(r.Context(), req.TeamToken)
	if err != nil || teamID == nil {
		h.ErrorResponse(w, http.StatusBadRequest, "invalid or expired team_token")
		return
	}

	sessionToken, err := randomHex(32)
	if err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, "failed to generate session")
		return
	}
	expiresAt := time.Now().Add(30 * time.Minute)
	if err := h.repo.CreateAdminGrantedTeamSession(r.Context(), *teamID, sessionToken, expiresAt); err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, "failed to create session")
		return
	}

	h.JSONResponse(w, http.StatusOK, map[string]string{
		"session_token": sessionToken,
		"expires_at":    expiresAt.Format(time.RFC3339),
	})
}
