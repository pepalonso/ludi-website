package config

import (
	"os"
	"path/filepath"
)

// App holds application configuration (e.g. document upload path, frontend URL).
type App struct {
	UploadDir   string
	FrontendURL string
}

// LoadFromEnv loads app config from environment variables.
func LoadFromEnv() App {
	uploadDir := getEnv("UPLOAD_DIR", "uploads")
	frontendURL := getEnv("FRONTEND_URL", "")
	return App{UploadDir: uploadDir, FrontendURL: frontendURL}
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
