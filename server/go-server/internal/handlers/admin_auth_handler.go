package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"tournament-dev/internal/database"

	"golang.org/x/crypto/bcrypt"
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

	passwordHash, err := h.repo.GetAdminByEmail(r.Context(), req.Email)
	if err != nil {
		log.Printf("[auth/admin] login failed: %v", err)
		h.ErrorResponse(w, http.StatusInternalServerError, "login failed")
		return
	}
	if passwordHash == "" {
		log.Printf("[auth/admin] login failed: invalid credentials")
		h.ErrorResponse(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)) != nil {
		log.Printf("[auth/admin] login failed: invalid credentials")
		h.ErrorResponse(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	token, err := randomHex(32)
	if err != nil {
		log.Printf("[auth/admin] login failed: %v", err)
		h.ErrorResponse(w, http.StatusInternalServerError, "failed to generate token")
		return
	}
	expiresAt := time.Now().Add(adminSessionTTL)
	if err := h.repo.CreateAdminSession(r.Context(), token, expiresAt); err != nil {
		log.Printf("[auth/admin] login failed: %v", err)
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
		log.Printf("[auth/admin] generate session failed: invalid team_token")
		h.ErrorResponse(w, http.StatusBadRequest, "invalid or expired team_token")
		return
	}

	sessionToken, err := randomHex(32)
	if err != nil {
		log.Printf("[auth/admin] generate session failed: %v", err)
		h.ErrorResponse(w, http.StatusInternalServerError, "failed to generate session")
		return
	}
	expiresAt := time.Now().Add(30 * time.Minute)
	if err := h.repo.CreateAdminGrantedTeamSession(r.Context(), *teamID, sessionToken, expiresAt); err != nil {
		log.Printf("[auth/admin] generate session failed: %v", err)
		h.ErrorResponse(w, http.StatusInternalServerError, "failed to create session")
		return
	}

	h.JSONResponse(w, http.StatusOK, map[string]string{
		"session_token": sessionToken,
		"expires_at":    expiresAt.Format(time.RFC3339),
	})
}
