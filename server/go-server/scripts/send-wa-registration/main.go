// Standalone script to send the registration WhatsApp template.
// Run from server/go-server: go run ./scripts/send-wa-registration -to 666555444 -club "Club X" -name "Equip Y" -players 10 -coaches 2
// Loads .env from current directory for ACCOUNT_SID, AUTH_TOKEN, SENDER_PHONE, CONTENT_SID_REGISTRATION (or CONTENT_SID).
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()
	to := flag.String("to", "", "Destination phone (9 digits or 34...)")
	club := flag.String("club", "", "Club name (template {{club}})")
	name := flag.String("name", "", "Team name (template {{name}})")
	players := flag.Int("players", 0, "Number of players (template {{players_num}})")
	coaches := flag.Int("coaches", 0, "Number of coaches (template {{coaches_num}})")
	pathRead := flag.String("path-read", "", "Registration path for link (template {{path_read}}), e.g. /equip?token=xxx")
	contentSID := flag.String("content-sid", "", "Override: Twilio Content SID (default: CONTENT_SID_REGISTRATION or CONTENT_SID)")
	flag.Parse()

	if *to == "" || *club == "" || *name == "" {
		log.Fatal("usage: go run ./scripts/send-wa-registration -to 666555444 -club \"Club\" -name \"Equip\" -players 10 -coaches 2 [-path-read \"/equip?token=xxx\"]")
	}

	accountSid := os.Getenv("ACCOUNT_SID")
	authToken := os.Getenv("AUTH_TOKEN")
	sender := os.Getenv("SENDER_PHONE")
	sid := *contentSID
	if sid == "" {
		sid = os.Getenv("CONTENT_SID_REGISTRATION")
		if sid == "" {
			sid = os.Getenv("CONTENT_SID")
		}
	}
	if accountSid == "" || authToken == "" || sender == "" || sid == "" {
		log.Fatal("missing env: set ACCOUNT_SID, AUTH_TOKEN, SENDER_PHONE, and CONTENT_SID_REGISTRATION (or CONTENT_SID)")
	}

	toNormalized, err := cleanPhone(*to)
	if err != nil {
		log.Fatalf("invalid -to phone: %v", err)
	}

	vars := map[string]string{
		"club":        *club,
		"name":        *name,
		"players_num": strconv.Itoa(*players),
		"coaches_num": strconv.Itoa(*coaches),
	}
	if *pathRead != "" {
		vars["path_read"] = *pathRead
	}
	contentVars, _ := json.Marshal(vars)
	form := url.Values{}
	form.Set("To", "whatsapp:"+toNormalized)
	form.Set("From", "whatsapp:"+sender)
	form.Set("ContentSid", sid)
	form.Set("ContentVariables", string(contentVars))

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		fmt.Sprintf("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", accountSid),
		strings.NewReader(form.Encode()))
	if err != nil {
		log.Fatalf("request: %v", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.SetBasicAuth(accountSid, authToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Fatalf("send: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		log.Fatalf("twilio error %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}
	log.Println("WhatsApp message sent successfully to", toNormalized)
}

func cleanPhone(phone string) (string, error) {
	digits := regexp.MustCompile(`\D`).ReplaceAllString(phone, "")
	if strings.HasPrefix(digits, "34") {
		if len(digits) == 11 {
			return digits, nil
		}
		digits = digits[2:]
	}
	if len(digits) == 9 {
		return "34" + digits, nil
	}
	return "", fmt.Errorf("invalid phone: %s", phone)
}
