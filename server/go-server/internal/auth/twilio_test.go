package auth

import "testing"

func TestFormatWhatsAppToAddress(t *testing.T) {
	tests := []struct {
		in   string
		want string
	}{
		{"639892853", "whatsapp:+34639892853"},
		{"34639892853", "whatsapp:+34639892853"},
		{"+34 639 892 853", "whatsapp:+34639892853"},
	}
	for _, tc := range tests {
		got, err := formatWhatsAppToAddress(tc.in)
		if err != nil {
			t.Fatalf("formatWhatsAppToAddress(%q): %v", tc.in, err)
		}
		if got != tc.want {
			t.Errorf("formatWhatsAppToAddress(%q) = %q, want %q", tc.in, got, tc.want)
		}
	}
}

func TestFormatWhatsAppFromAddress(t *testing.T) {
	if got := formatWhatsAppFromAddress("16575515423"); got != "whatsapp:+16575515423" {
		t.Errorf("got %q", got)
	}
}

func TestRegistrationContentVariables(t *testing.T) {
	raw, err := registrationContentVariables(RegistrationMessageData{
		Club:             "BC Test",
		TeamName:         "Equip A",
		NumPlayers:       8,
		NumCoaches:       1,
		RegistrationPath: "/equip?token=abc",
	})
	if err != nil {
		t.Fatal(err)
	}
	want := `{"club":"BC Test","coaches_num":"1","name":"Equip A","path_read":"/equip?token=abc","path_write":"/equip?token=abc","players_num":"8"}`
	if raw != want {
		t.Errorf("got %s", raw)
	}
}
