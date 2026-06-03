// Standalone script to send the registration WhatsApp template.
// Run from server/go-server: go run ./scripts/send-wa-registration -to 666555444 -club "Club X" -name "Equip Y" -players 10 -coaches 2
// Loads .env from current directory for ACCOUNT_SID, AUTH_TOKEN, SENDER_PHONE, CONTENT_SID_REGISTRATION (or CONTENT_SID).
package main

import (
	"context"
	"flag"
	"log"
	"strings"

	"tournament-dev/internal/auth"

	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()
	to := flag.String("to", "", "Destination phone (9 digits or 34...)")
	club := flag.String("club", "", "Club name (template {{club}})")
	name := flag.String("name", "", "Team name (template {{name}})")
	players := flag.Int("players", 0, "Number of players (template {{players_num}})")
	coaches := flag.Int("coaches", 0, "Number of coaches (template {{coaches_num}})")
	pathRead := flag.String("path-read", "", "Registration path for link (template {{path_read}} / {{path_write}}), e.g. /equip?token=xxx")
	flag.Parse()

	if *to == "" || *club == "" || *name == "" {
		log.Fatal("usage: go run ./scripts/send-wa-registration -to 666555444 -club \"Club\" -name \"Equip\" -players 10 -coaches 2 [-path-read \"/equip?token=xxx\"]")
	}

	sender := auth.NewTwilioSMTPSender()
	err := sender.SendRegistrationWhatsApp(context.Background(), auth.RegistrationMessageData{
		Club:             *club,
		TeamName:         *name,
		Phone:            *to,
		NumPlayers:       *players,
		NumCoaches:       *coaches,
		RegistrationPath: strings.TrimSpace(*pathRead),
	})
	if err != nil {
		log.Fatal(err)
	}

	addr, _ := auth.FormatWhatsAppToAddress(*to)
	log.Println("WhatsApp message sent successfully to", addr)
}
