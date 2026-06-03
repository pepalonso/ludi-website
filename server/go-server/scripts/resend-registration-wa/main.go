// Resend registration WhatsApp to teams that did not receive it (e.g. Twilio error 21656).
//
// Usage (from server/go-server, with .env or prod env vars):
//
//	go run ./scripts/resend-registration-wa -dry-run
//	go run ./scripts/resend-registration-wa -ids 52,50,49
//	go run ./scripts/resend-registration-wa   # default: known failed team IDs
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"tournament-dev/internal/auth"
	"tournament-dev/internal/config"
	"tournament-dev/internal/database"
	"tournament-dev/internal/database/mysql"

	"github.com/joho/godotenv"
)

const frontendTeamPath = "/equip"

// Team IDs that failed with Twilio error 21656 (ContentVariables invalid), matched from messaging logs.
var defaultFailedTeamIDs = []int{
	52, 50, 49, 48, 43, 41, 40, 39, 37, 34, 33, 32, 31, 27, 25, 17, 12, 11, 9, 8, 4, 1,
}

func main() {
	_ = godotenv.Load()

	idsFlag := flag.String("ids", "", "Comma-separated team IDs (default: known failed list from Twilio logs)")
	dryRun := flag.Bool("dry-run", false, "Print what would be sent without calling Twilio")
	baseURL := flag.String("base-url", "", "Frontend base URL for registration link (default: first CORS_ALLOWED_ORIGINS)")
	flag.Parse()

	teamIDs, err := parseTeamIDs(*idsFlag)
	if err != nil {
		log.Fatal(err)
	}

	dbConfig := database.LoadConfigFromEnv()
	conn, err := database.NewConnection(dbConfig)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer conn.Close()

	repo := mysql.NewRepository(conn.GetDB())
	sender := auth.NewTwilioSMTPSender()
	appCfg := config.LoadFromEnv()

	regBase := strings.TrimSuffix(strings.TrimSpace(*baseURL), "/")
	if regBase == "" && len(appCfg.AllowedOrigins) > 0 {
		regBase = strings.TrimSuffix(appCfg.AllowedOrigins[0], "/")
	}
	if regBase == "" {
		log.Fatal("missing base URL: set -base-url or CORS_ALLOWED_ORIGINS in env")
	}

	ctx := context.Background()
	var ok, fail, skip int

	for _, teamID := range teamIDs {
		label, data, err := loadRegistrationData(ctx, repo, teamID, regBase)
		if err != nil {
			log.Printf("[skip] team_id=%d: %v", teamID, err)
			skip++
			continue
		}

		if *dryRun {
			log.Printf("[dry-run] team_id=%d %s -> %s | path=%s", teamID, label, data.Phone, data.RegistrationPath)
			ok++
			continue
		}

		sendCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
		err = sender.SendRegistrationWhatsApp(sendCtx, data)
		cancel()
		if err != nil {
			log.Printf("[fail] team_id=%d %s: %v", teamID, label, err)
			fail++
			continue
		}
		log.Printf("[ok] team_id=%d %s -> %s", teamID, label, data.Phone)
		ok++
	}

	log.Printf("Done: ok=%d fail=%d skip=%d total=%d", ok, fail, skip, len(teamIDs))
	if fail > 0 {
		os.Exit(1)
	}
}

func parseTeamIDs(raw string) ([]int, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return defaultFailedTeamIDs, nil
	}
	parts := strings.Split(raw, ",")
	out := make([]int, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		id, err := strconv.Atoi(p)
		if err != nil {
			return nil, fmt.Errorf("invalid team id %q", p)
		}
		out = append(out, id)
	}
	if len(out) == 0 {
		return nil, fmt.Errorf("no team IDs provided")
	}
	return out, nil
}

func loadRegistrationData(ctx context.Context, repo database.Repository, teamID int, regBase string) (string, auth.RegistrationMessageData, error) {
	team, err := repo.GetTeamByID(ctx, teamID)
	if err != nil {
		return "", auth.RegistrationMessageData{}, fmt.Errorf("load team: %w", err)
	}
	if team == nil {
		return "", auth.RegistrationMessageData{}, fmt.Errorf("team not found")
	}

	club, err := repo.GetClubByID(ctx, team.ClubID)
	if err != nil {
		return "", auth.RegistrationMessageData{}, fmt.Errorf("load club: %w", err)
	}
	clubName := ""
	if club != nil {
		clubName = club.Name
	}

	players, err := repo.GetPlayersByTeamID(ctx, teamID)
	if err != nil {
		return "", auth.RegistrationMessageData{}, fmt.Errorf("load players: %w", err)
	}
	coaches, err := repo.GetCoachesByTeamID(ctx, teamID)
	if err != nil {
		return "", auth.RegistrationMessageData{}, fmt.Errorf("load coaches: %w", err)
	}

	token, err := repo.GetRegistrationTokenByTeamID(ctx, teamID)
	if err != nil {
		return "", auth.RegistrationMessageData{}, fmt.Errorf("load token: %w", err)
	}
	if token == nil || strings.TrimSpace(*token) == "" {
		return "", auth.RegistrationMessageData{}, fmt.Errorf("no valid registration token")
	}

	teamName := strings.TrimSpace(team.Name)
	if teamName == "" {
		teamName = clubName
	}

	regPath := frontendTeamPath + "?token=" + strings.TrimSpace(*token)
	label := fmt.Sprintf("%q (%s)", teamName, clubName)

	return label, auth.RegistrationMessageData{
		TeamName:         teamName,
		Club:             clubName,
		Email:            team.Email,
		Phone:            team.Phone,
		NumPlayers:       len(players),
		NumCoaches:       len(coaches),
		RegistrationPath: regPath,
		RegistrationURL:  regBase + regPath,
	}, nil
}
