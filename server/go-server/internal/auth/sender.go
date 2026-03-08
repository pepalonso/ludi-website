package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/smtp"
	"net/url"
	"os"
	"regexp"
	"strconv"
	"strings"
)

// TwilioSMTPSender implements PINSender using Twilio (WhatsApp) and SMTP (email).
type TwilioSMTPSender struct{}

func NewTwilioSMTPSender() *TwilioSMTPSender {
	return &TwilioSMTPSender{}
}

// SendPIN sends the PIN via the given method ("email" or "whatsapp").
func (s *TwilioSMTPSender) SendPIN(ctx context.Context, method, pin, email, phone string) error {
	switch method {
	case "whatsapp":
		return s.sendWhatsApp(ctx, pin, phone)
	case "email":
		return s.sendEmail(ctx, pin, email)
	default:
		return fmt.Errorf("unsupported method: %s", method)
	}
}

func (s *TwilioSMTPSender) sendWhatsApp(ctx context.Context, pin, phone string) error {
	accountSid := os.Getenv("ACCOUNT_SID")
	authToken := os.Getenv("AUTH_TOKEN")
	sender := os.Getenv("SENDER_PHONE")
	contentSid := os.Getenv("CONTENT_SID")
	if accountSid == "" || authToken == "" || sender == "" || contentSid == "" {
		return fmt.Errorf("missing Twilio configuration (ACCOUNT_SID, AUTH_TOKEN, SENDER_PHONE, CONTENT_SID)")
	}

	to, err := cleanPhoneNumber(phone)
	if err != nil {
		return err
	}

	contentVars, _ := json.Marshal(map[string]string{"1": pin})
	form := url.Values{}
	form.Set("To", "whatsapp:"+to)
	form.Set("From", "whatsapp:"+sender)
	form.Set("ContentSid", contentSid)
	form.Set("ContentVariables", string(contentVars))
	body := strings.NewReader(form.Encode())

	url := fmt.Sprintf("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", accountSid)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, body)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.SetBasicAuth(accountSid, authToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("twilio returned %d", resp.StatusCode)
	}
	return nil
}

// cleanPhoneNumber normalizes to 34 + 9 digits (Spanish format, no +).
func cleanPhoneNumber(phone string) (string, error) {
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
	return "", fmt.Errorf("invalid phone number: %s", phone)
}

func (s *TwilioSMTPSender) sendEmail(ctx context.Context, pin, email string) error {
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")
	from := os.Getenv("SMTP_FROM")
	if from == "" {
		from = user
	}
	if host == "" || port == "" {
		return fmt.Errorf("missing SMTP configuration (SMTP_HOST, SMTP_PORT)")
	}

	addr := host + ":" + port
	var auth smtp.Auth
	if user != "" {
		auth = smtp.PlainAuth("", user, pass, host)
	}
	msg := []byte("To: " + email + "\r\n" +
		"Subject: Codi d'accés\r\n" +
		"Content-Type: text/plain; charset=UTF-8\r\n\r\n" +
		"El teu codi és: " + pin + "\r\n")
	if err := smtp.SendMail(addr, auth, from, []string{email}, msg); err != nil {
		return err
	}
	return nil
}

// SendRegistration sends registration confirmation via WhatsApp (Twilio Content template) and email (SMTP).
// Matches old backend: WA uses content_variables club, name, players_num, coaches_num, path_read, path_write.
// Best-effort: logs errors but does not fail the request if sending fails.
func (s *TwilioSMTPSender) SendRegistration(ctx context.Context, data RegistrationMessageData) error {
	var errs []string
	if err := s.sendWhatsAppRegistration(ctx, data); err != nil {
		log.Printf("[registration] WhatsApp send failed: %v", err)
		errs = append(errs, "wa: "+err.Error())
	}
	if err := s.sendRegistrationEmail(ctx, data); err != nil {
		log.Printf("[registration] Email send failed: %v", err)
		errs = append(errs, "email: "+err.Error())
	}
	if len(errs) > 0 {
		return fmt.Errorf("registration notifications: %s", strings.Join(errs, "; "))
	}
	return nil
}

// sendWhatsAppRegistration sends the registration confirmation using Twilio Content API (same as old send_wa).
// Env: CONTENT_SID_REGISTRATION for the template; falls back to CONTENT_SID if unset.
func (s *TwilioSMTPSender) sendWhatsAppRegistration(ctx context.Context, data RegistrationMessageData) error {
	contentSid := os.Getenv("CONTENT_SID_REGISTRATION")
	if contentSid == "" {
		contentSid = os.Getenv("CONTENT_SID")
	}
	if contentSid == "" {
		return fmt.Errorf("missing CONTENT_SID_REGISTRATION or CONTENT_SID")
	}
	accountSid := os.Getenv("ACCOUNT_SID")
	authToken := os.Getenv("AUTH_TOKEN")
	sender := os.Getenv("SENDER_PHONE")
	if accountSid == "" || authToken == "" || sender == "" {
		return fmt.Errorf("missing Twilio configuration")
	}
	to, err := cleanPhoneNumber(data.Phone)
	if err != nil {
		return err
	}
	contentVars, _ := json.Marshal(map[string]string{
		"club":       data.Club,
		"name":       data.TeamName,
		"players_num": strconv.Itoa(data.NumPlayers),
		"coaches_num": strconv.Itoa(data.NumCoaches),
		"path_read":  data.RegistrationPath,
		"path_write": data.RegistrationPath,
	})
	form := url.Values{}
	form.Set("To", "whatsapp:"+to)
	form.Set("From", "whatsapp:"+sender)
	form.Set("ContentSid", contentSid)
	form.Set("ContentVariables", string(contentVars))
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		fmt.Sprintf("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", accountSid),
		strings.NewReader(form.Encode()))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.SetBasicAuth(accountSid, authToken)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("twilio returned %d", resp.StatusCode)
	}
	return nil
}

// sendRegistrationEmail sends a confirmation email with the registration link (same SMTP as PIN emails).
func (s *TwilioSMTPSender) sendRegistrationEmail(ctx context.Context, data RegistrationMessageData) error {
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")
	from := os.Getenv("SMTP_FROM")
	if from == "" {
		from = user
	}
	if host == "" || port == "" {
		return fmt.Errorf("missing SMTP configuration (SMTP_HOST, SMTP_PORT)")
	}
	addr := host + ":" + port
	var auth smtp.Auth
	if user != "" {
		auth = smtp.PlainAuth("", user, pass, host)
	}
	subject := "Inscripció registrada - Ludibàsquet"
	link := data.RegistrationURL
	if link == "" {
		link = data.RegistrationPath
	}
	body := fmt.Sprintf("Hola,\n\nLa inscripció de l'equip \"%s\" (%s) s'ha registrat correctament.\n\n"+
		"Per consultar o editar la teva inscripció, fes clic a:\n%s\n\nSalut,\nLudibàsquet",
		data.TeamName, data.Club, link)
	msg := []byte("To: " + data.Email + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"Content-Type: text/plain; charset=UTF-8\r\n\r\n" + body)
	if err := smtp.SendMail(addr, auth, from, []string{data.Email}, msg); err != nil {
		return err
	}
	return nil
}

// Ensure TwilioSMTPSender implements PINSender and RegistrationNotifier.
var _ PINSender = (*TwilioSMTPSender)(nil)
var _ RegistrationNotifier = (*TwilioSMTPSender)(nil)
