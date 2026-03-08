package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"tournament-dev/internal/auth"
	"tournament-dev/internal/database"

	"golang.org/x/crypto/bcrypt"
)

// AuthHandler handles /auth/generate and /auth/validator
type AuthHandler struct {
	*BaseHandler
	sender auth.PINSender
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(repo database.Repository, sender auth.PINSender) *AuthHandler {
	return &AuthHandler{
		BaseHandler: NewBaseHandler(repo),
		sender:      sender,
	}
}

// GenerateRequest is the body for POST /auth/generate
type GenerateRequest struct {
	Method string `json:"method"` // "email" or "whatsapp"
}

// ValidatorRequest is the body for POST /auth/validator
type ValidatorRequest struct {
	Pin string `json:"pin"`
}

const (
	pinLength    = 4
	sessionExpiry = 30 * time.Minute
)

// Generate handles POST /auth/generate (Bearer = registration token, body: method)
func (h *AuthHandler) Generate(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	if token == "" {
		h.ErrorResponse(w, http.StatusUnauthorized, "missing authorization")
		return
	}
	teamID, err := h.repo.GetTeamIDByRegistrationToken(r.Context(), token)
	if err != nil || teamID == nil {
		h.ErrorResponse(w, http.StatusUnauthorized, "invalid or expired registration token")
		return
	}

	var req GenerateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.ErrorResponse(w, http.StatusBadRequest, "invalid body")
		return
	}
	if req.Method != "email" && req.Method != "whatsapp" {
		h.ErrorResponse(w, http.StatusBadRequest, "method must be email or whatsapp")
		return
	}

	team, err := h.repo.GetTeamByID(r.Context(), *teamID)
	if err != nil || team == nil {
		h.ErrorResponse(w, http.StatusNotFound, "team not found")
		return
	}

	pin := generatePIN(pinLength)
	pinHash, err := bcrypt.GenerateFromPassword([]byte(pin), bcrypt.DefaultCost)
	if err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, "failed to generate code")
		return
	}

	sessionToken, err := randomHex(32)
	if err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, "failed to generate session")
		return
	}

	expiresAt := time.Now().Add(sessionExpiry)
	if err := h.repo.CreateEditSession(r.Context(), *teamID, sessionToken, string(pinHash), req.Method, expiresAt); err != nil {
		h.ErrorResponse(w, http.StatusInternalServerError, "failed to create session")
		return
	}

	if err := h.sender.SendPIN(r.Context(), req.Method, pin, team.Email, team.Phone); err != nil {
		log.Printf("[auth/generate] send failed (method=%s): %v", req.Method, err)
		h.ErrorResponse(w, http.StatusInternalServerError, "failed to send code")
		return
	}

	h.JSONResponse(w, http.StatusOK, map[string]string{"message": "Code sent"})
}

// Validator handles POST /auth/validator (Bearer = registration token, body: pin)
func (h *AuthHandler) Validator(w http.ResponseWriter, r *http.Request) {
	token := extractBearerToken(r)
	if token == "" {
		h.ErrorResponse(w, http.StatusUnauthorized, "missing authorization")
		return
	}
	teamID, err := h.repo.GetTeamIDByRegistrationToken(r.Context(), token)
	if err != nil || teamID == nil {
		h.ErrorResponse(w, http.StatusUnauthorized, "invalid or expired registration token")
		return
	}

	var req ValidatorRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Pin == "" {
		h.ErrorResponse(w, http.StatusBadRequest, "invalid body or missing pin")
		return
	}

	sessions, err := h.repo.GetPendingSessionsByTeamID(r.Context(), *teamID)
	if err != nil {
		log.Printf("[auth/validator] verify failed: %v", err)
		h.ErrorResponse(w, http.StatusInternalServerError, "failed to verify")
		return
	}
	var matched *database.EditSessionRow
	for i := range sessions {
		if bcrypt.CompareHashAndPassword([]byte(sessions[i].PinHash), []byte(req.Pin)) == nil {
			matched = &sessions[i]
			break
		}
	}
	if matched == nil {
		log.Printf("[auth/validator] invalid or expired code (team_id=%d)", *teamID)
		h.ErrorResponse(w, http.StatusUnauthorized, "invalid or expired code")
		return
	}

	if err := h.repo.MarkSessionUsedByToken(r.Context(), matched.SessionToken); err != nil {
		log.Printf("[auth/validator] mark session used failed: %v", err)
		h.ErrorResponse(w, http.StatusInternalServerError, "failed to complete login")
		return
	}

	// Session token is valid for sessionExpiry from creation; expires_at was set at generate time
	// Optionally extend expiry when validating (e.g. 30 min from now). For simplicity we return stored expires_at.
	h.JSONResponse(w, http.StatusOK, map[string]interface{}{
		"session_token": matched.SessionToken,
		"expires_at":    matched.ExpiresAt.Format(time.RFC3339),
	})
}

func generatePIN(length int) string {
	const digits = "0123456789"
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		return "0000"
	}
	for i := range b {
		b[i] = digits[int(b[i])%len(digits)]
	}
	return string(b)
}

func randomHex(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
