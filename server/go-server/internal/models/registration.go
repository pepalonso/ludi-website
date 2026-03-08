package models

import "encoding/json"

// RegisterInscriptionRequest is the payload for POST /api/registrar-incripcio (frontend shape).
// Fitxes are document IDs (pre-uploaded); frontend sends these instead of ARNs.
type RegisterInscriptionRequest struct {
	NomEquip       string                    `json:"nomEquip"`
	Email          string                    `json:"email"`
	Telefon        string                    `json:"telefon"`
	Sexe           string                    `json:"sexe"`
	Categoria      string                    `json:"categoria"`
	Club           string                    `json:"club"`
	Observacions   observacionsPayload       `json:"observacions,omitempty"`
	Intolerancies  []string                  `json:"intolerancies,omitempty"`
	Jugadors       []RegisterInscriptionJug  `json:"jugadors"`
	Entrenadors    []RegisterInscriptionEntr `json:"entrenadors"`
	Fitxes         []int                     `json:"fitxes,omitempty"` // document IDs to link to team
}

type RegisterInscriptionJug struct {
	Nom            string `json:"nom"`
	Cognoms        string `json:"cognoms"`
	TallaSamarreta string `json:"tallaSamarreta"`
}

type RegisterInscriptionEntr struct {
	Nom            string `json:"nom"`
	Cognoms        string `json:"cognoms"`
	TallaSamarreta string `json:"tallaSamarreta"`
	EsPrincipal    *int   `json:"esPrincipal"` // 0 or 1 from frontend
}

// observacionsPayload accepts either a string or an object { "observacio": "..." }
type observacionsPayload struct {
	Value string
}

func (o *observacionsPayload) UnmarshalJSON(data []byte) error {
	if len(data) == 0 {
		return nil
	}
	if data[0] == '"' {
		var s string
		if err := json.Unmarshal(data, &s); err != nil {
			return err
		}
		o.Value = s
		return nil
	}
	var obj struct {
		Observacio string `json:"observacio"`
	}
	if err := json.Unmarshal(data, &obj); err != nil {
		return err
	}
	o.Value = obj.Observacio
	return nil
}

// RegisterInscriptionResponse is the response for POST /api/registrar-incripcio
type RegisterInscriptionResponse struct {
	RegistrationURL  string `json:"registration_url"`
	RegistrationPath string `json:"registration_path"`
	WAToken          string `json:"wa_token"`
	Message          string `json:"message,omitempty"`
	TeamID           int    `json:"team_id"`
}
