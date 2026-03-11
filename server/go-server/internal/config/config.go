package config

import (
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// App holds application configuration.
type App struct {
	UploadDir              string
	AllowedOrigins         []string // From CORS_ALLOWED_ORIGINS; used for CORS and registration link base URL.
	RegistrationWebhookURL string   // Optional. If set, POST registration payload to this URL on new inscription.
	AppEnv                 string   // From APP_ENV (e.g. "production"); sent in registration webhook payload.
}

// LoadFromEnv loads app config from environment variables.
func LoadFromEnv() App {
	uploadDir := getEnv("UPLOAD_DIR", "uploads")
	allowed := parseCommaSeparated(getEnv("CORS_ALLOWED_ORIGINS", ""))
	webhookURL := strings.TrimSpace(os.Getenv("REGISTRATION_WEBHOOK_URL"))
	appEnv := strings.TrimSpace(os.Getenv("APP_ENV"))
	return App{UploadDir: uploadDir, AllowedOrigins: allowed, RegistrationWebhookURL: webhookURL, AppEnv: appEnv}
}

// parseCommaSeparated returns trimmed non-empty parts of s.
func parseCommaSeparated(s string) []string {
	var out []string
	for _, v := range strings.Split(s, ",") {
		if t := strings.TrimSpace(v); t != "" {
			out = append(out, t)
		}
	}
	return out
}

// ContainsOrigin returns true if origin is in the allowed list (exact or wildcard match).
func (a *App) ContainsOrigin(origin string) bool {
	return OriginMatches(origin, a.AllowedOrigins)
}

func OriginMatches(origin string, patterns []string) bool {
	origin = strings.TrimSuffix(origin, "/")
	for _, p := range patterns {
		if originMatchesPattern(origin, strings.TrimSuffix(p, "/")) {
			return true
		}
	}
	return false
}

func originMatchesPattern(origin, pattern string) bool {
	if pattern == "" {
		return false
	}
	if strings.IndexByte(pattern, '*') < 0 {
		return origin == pattern
	}
	var b strings.Builder
	for _, r := range pattern {
		if r == '*' {
			b.WriteString(".*")
		} else {
			b.WriteString(regexp.QuoteMeta(string(r)))
		}
	}
	re, err := regexp.Compile("^" + b.String() + "$")
	if err != nil {
		return false
	}
	return re.MatchString(origin)
}

// EnsureUploadDir creates the upload directory if it does not exist.
func (a *App) EnsureUploadDir() error {
	return os.MkdirAll(filepath.Clean(a.UploadDir), 0755)
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
