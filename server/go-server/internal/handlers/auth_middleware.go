package handlers

import (
	"context"
	"log"
	"net/http"
	"strings"

	"tournament-dev/internal/database"
)

type contextKey int

const (
	contextKeyTeamID contextKey = iota
)

// SessionTokenHeader is the header used for the 2FA session token on modify endpoints.
const SessionTokenHeader = "X-Session-Token"

// TeamIDFromContext returns the team ID set by auth middleware, or 0 if not present.
func TeamIDFromContext(ctx context.Context) int {
	id, _ := ctx.Value(contextKeyTeamID).(int)
	return id
}

// RequireTeamAuth returns an http.Handler that resolves Authorization: Bearer <token>
// to a team_id and injects it into the request context. Responds with 401 if missing or invalid.
func RequireTeamAuth(repo database.Repository) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := extractBearerToken(r)
			if token == "" {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				w.Write([]byte(`{"error":"missing or invalid authorization"}`))
				return
			}
			teamID, err := repo.ResolveBearerToken(r.Context(), token)
			if err != nil || teamID == 0 {
				// Debug: confirm token shape when 401 (e.g. mobile vs desktop)
				prefix := token
				if len(prefix) > 8 {
					prefix = prefix[:8] + "..."
				}
				log.Printf("[auth] RequireTeamAuth 401: token len=%d prefix=%s", len(token), prefix)
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				w.Write([]byte(`{"error":"invalid or expired token"}`))
				return
			}
			ctx := context.WithValue(r.Context(), contextKeyTeamID, teamID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireSessionTokenHeader requires Bearer (registration token) and X-Session-Token (session token).
// Only the session token is used to resolve team_id. Use for /api/me/ routes that modify data (POST, PUT, DELETE).
func RequireSessionTokenHeader(repo database.Repository) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			bearer := extractBearerToken(r)
			if bearer == "" {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				w.Write([]byte(`{"error":"missing or invalid authorization"}`))
				return
			}
			sessionToken := strings.TrimSpace(r.Header.Get(SessionTokenHeader))
			if sessionToken == "" {
				log.Printf("[auth] RequireSessionTokenHeader 401: missing %s", SessionTokenHeader)
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				w.Write([]byte(`{"error":"session token required for this action; complete authentication first"}`))
				return
			}
			teamID, err := repo.GetTeamIDBySessionToken(r.Context(), sessionToken)
			if err != nil || teamID == nil || *teamID == 0 {
				log.Printf("[auth] RequireSessionTokenHeader 401: invalid or expired session token")
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				w.Write([]byte(`{"error":"session token required for this action; complete authentication first"}`))
				return
			}
			ctx := context.WithValue(r.Context(), contextKeyTeamID, *teamID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireAdminAuth returns an http.Handler that validates Authorization: Bearer <admin_token>
// against admin_sessions. Responds with 401 if missing or invalid.
func RequireAdminAuth(repo database.Repository) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := extractBearerToken(r)
			if token == "" {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				w.Write([]byte(`{"error":"missing or invalid authorization"}`))
				return
			}
			valid, err := repo.ValidateAdminSession(r.Context(), token)
			if err != nil || !valid {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				w.Write([]byte(`{"error":"invalid or expired admin token"}`))
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func extractBearerToken(r *http.Request) string {
	h := r.Header.Get("Authorization")
	if h == "" {
		return ""
	}
	const prefix = "Bearer "
	if !strings.HasPrefix(h, prefix) {
		return ""
	}
	return strings.TrimSpace(h[len(prefix):])
}
