// add-admin creates an admin account (email + password) in the admins table.
// Run from server/go-server so .env and DB config are available:
//
//	go run ./cmd/add-admin --email=admin@example.com --password=yourpassword
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"

	"tournament-dev/internal/database"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Printf("No .env loaded: %v", err)
	}
	email := flag.String("email", "", "Admin email (required)")
	password := flag.String("password", "", "Admin password (required, or set ADMIN_PASSWORD env)")
	flag.Parse()
	pwd := *password
	if pwd == "" {
		pwd = os.Getenv("ADMIN_PASSWORD")
	}
	if *email == "" || pwd == "" {
		fmt.Fprintln(os.Stderr, "Usage: go run ./cmd/add-admin --email=admin@example.com --password=yourpassword")
		fmt.Fprintln(os.Stderr, "  Or: ADMIN_PASSWORD=xxx go run ./cmd/add-admin --email=admin@example.com")
		flag.PrintDefaults()
		os.Exit(1)
	}

	cfg := database.LoadConfigFromEnv()
	conn, err := database.NewConnection(cfg)
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
	defer conn.Close()

	hash, err := bcrypt.GenerateFromPassword([]byte(pwd), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	ctx := context.Background()
	_, err = conn.GetDB().ExecContext(ctx, `INSERT INTO admins (email, password_hash) VALUES (?, ?)`, *email, string(hash))
	if err != nil {
		if isDuplicateEmail(err) {
			log.Fatalf("Admin with email %q already exists.", *email)
		}
		log.Fatalf("Insert failed: %v", err)
	}
	log.Printf("Admin created: %s", *email)
}

func isDuplicateEmail(err error) bool {
	if err == nil {
		return false
	}
	s := err.Error()
	return strings.Contains(s, "Duplicate") || strings.Contains(s, "1062") || strings.Contains(s, "UNIQUE")
}
