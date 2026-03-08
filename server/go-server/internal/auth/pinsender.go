package auth

import "context"

type PINSender interface {
	SendPIN(ctx context.Context, method, pin, email, phone string) error
}

// RegistrationMessageData is the payload for sending registration confirmation (WA + email).
type RegistrationMessageData struct {
	TeamName         string
	Club             string
	Email            string
	Phone            string
	NumPlayers       int
	NumCoaches       int
	RegistrationPath string
	RegistrationURL  string
}

// RegistrationNotifier sends registration confirmation via WhatsApp and email.
// Used by the registration endpoint after a team is created.
type RegistrationNotifier interface {
	SendRegistration(ctx context.Context, data RegistrationMessageData) error
}
