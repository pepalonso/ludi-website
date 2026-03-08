package handlers

import (
	"context"
	"net/http"
	"strings"

	"tournament-dev/internal/database"
)

type contextKey int

const (
	contextKeyTeamID contextKey = iota
)

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
