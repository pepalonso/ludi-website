package auth

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

var phoneDigitsRe = regexp.MustCompile(`\D`)

// cleanPhoneNumber normalizes Spanish mobiles to 34 + 9 digits (E.164 without +).
func cleanPhoneNumber(phone string) (string, error) {
	digits := phoneDigitsRe.ReplaceAllString(phone, "")
	if strings.HasPrefix(digits, "34") {
		if len(digits) == 11 {
			return digits, nil
		}
		digits = digits[2:]
	}
	if len(digits) == 9 {
		return "34" + digits, nil
	}
	return "", fmt.Errorf("invalid phone number: %s", phone)
}

// FormatWhatsAppToAddress formats a recipient phone for Twilio WhatsApp (E.164 with +).
func FormatWhatsAppToAddress(phone string) (string, error) {
	return formatWhatsAppToAddress(phone)
}

// FormatWhatsAppFromAddress formats the sender phone from env (any country code).
func FormatWhatsAppFromAddress(senderEnv string) string {
	return formatWhatsAppFromAddress(senderEnv)
}

// RegistrationContentVariablesJSON builds Twilio ContentVariables JSON for the registration template.
func RegistrationContentVariablesJSON(data RegistrationMessageData) (string, error) {
	return registrationContentVariables(data)
}

func formatWhatsAppToAddress(phone string) (string, error) {
	digits, err := cleanPhoneNumber(phone)
	if err != nil {
		return "", err
	}
	return "whatsapp:+" + digits, nil
}

// formatWhatsAppFromAddress formats the sender phone from env (any country code).
func formatWhatsAppFromAddress(senderEnv string) string {
	digits := phoneDigitsRe.ReplaceAllString(senderEnv, "")
	return "whatsapp:+" + digits
}

// registrationContentVariables builds Twilio ContentVariables for the registration template.
// Matches the legacy Python backend: club, name, players_num, coaches_num, path_read, path_write.
func registrationContentVariables(data RegistrationMessageData) (string, error) {
	path := strings.TrimSpace(data.RegistrationPath)
	vars := map[string]string{
		"club":        data.Club,
		"name":        data.TeamName,
		"players_num": strconv.Itoa(data.NumPlayers),
		"coaches_num": strconv.Itoa(data.NumCoaches),
		"path_read":   path,
		"path_write":  path,
	}
	raw, err := json.Marshal(vars)
	if err != nil {
		return "", err
	}
	return string(raw), nil
}
