package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"tournament-dev/internal/auth"
	"tournament-dev/internal/config"
	"tournament-dev/internal/database"
	"tournament-dev/internal/database/mysql"
	"tournament-dev/internal/handlers"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Printf("No .env file loaded (optional): %v", err)
	}
	dbConfig := database.LoadConfigFromEnv()
	conn, err := database.NewConnection(dbConfig)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer conn.Close()

	db := conn.GetDB()
	repo := mysql.NewRepository(db)

	appConfig := config.LoadFromEnv()
	if err := appConfig.EnsureUploadDir(); err != nil {
		log.Fatalf("Failed to create upload directory: %v", err)
	}

	sender := auth.NewTwilioSMTPSender()
	router := handlers.NewRouter(repo, appConfig.UploadDir, sender, appConfig.AllowedOrigins, sender, appConfig.RegistrationWebhookURL)

	mux := http.NewServeMux()
	router.SetupRoutes(mux)

	handler := addMiddleware(mux, appConfig.AllowedOrigins)

	server := &http.Server{
		Addr:         ":8080",
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("Server starting on port 8080")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Server shutting down...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}

func addMiddleware(next http.Handler, allowedOrigins []string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if len(allowedOrigins) == 0 {
			w.Header().Set("Access-Control-Allow-Origin", "*")
		} else if origin != "" && config.OriginMatches(origin, allowedOrigins) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		log.Printf("%s %s", r.Method, r.URL.Path)

		next.ServeHTTP(w, r)
	})
}
