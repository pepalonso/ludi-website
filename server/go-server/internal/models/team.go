package models

import "time"

type TeamBase struct {
	Name     string   `json:"name" db:"name" validate:"required,min=1,max=255"`
	Email    string   `json:"email" db:"email" validate:"required,email"`
	Category Category `json:"category" db:"category" validate:"required,oneof=Pre-mini Mini Pre-infantil Infantil Cadet Júnior"`
	Phone    string   `json:"phone" db:"phone" validate:"required,min=1,max=255"`
	Gender   Gender   `json:"gender" db:"gender" validate:"required,oneof=Masculí Femení"`
	ClubID   int      `json:"club_id" db:"club_id" validate:"required,gt=0,foreign_key=clubs.id"`
	Status   Status   `json:"status" db:"status" validate:"oneof=pending_payment canceled active"`
}

type Team struct {
	ID int `json:"id" db:"id"`
	TeamBase
	Observations     *string   `json:"observations" db:"observations"`
	RegistrationDate time.Time `json:"registration_date" db:"registration_date"`
	UpdatedAt        time.Time `json:"updated_at" db:"updated_at"`

	Club    *Club    `json:"club,omitempty" db:"-"`
	Players []Player `json:"players,omitempty" db:"-"`
	Coaches []Coach  `json:"coaches,omitempty" db:"-"`
}

type TeamCreateRequest struct {
	TeamBase
	Observations *string `json:"observations,omitempty"`
}

type TeamUpdateRequest struct {
	TeamBase
	Observations *string `json:"observations,omitempty"`
}

type TeamResponse struct {
	ID               int           `json:"id"`
	Name             string        `json:"name"`
	Email            string        `json:"email"`
	Category         Category      `json:"category"`
	Phone            string        `json:"phone"`
	Gender           Gender        `json:"gender"`
	ClubID           int           `json:"club_id"`
	Observations     *string       `json:"observations"`
	RegistrationDate time.Time     `json:"registration_date"`
	UpdatedAt        time.Time     `json:"updated_at"`
	Status           Status        `json:"status"`
	Club             *ClubResponse `json:"club,omitempty"`
}

type TeamListResponse struct {
	Teams      []TeamResponse `json:"teams"`
	Total      int            `json:"total"`
	Page       int            `json:"page"`
	PageSize   int            `json:"page_size"`
	TotalPages int            `json:"total_pages"`
}

type TeamFilters struct {
	Category *Category `json:"category,omitempty"`
	Gender   *Gender   `json:"gender,omitempty"`
	Status   *Status   `json:"status,omitempty"`
	ClubID   *int      `json:"club_id,omitempty"`
	Search   *string   `json:"search,omitempty"`
	Page     int       `json:"page"`
	PageSize int       `json:"page_size"`
}

type TeamStats struct {
	TotalTeams     int              `json:"total_teams"`
	ActiveTeams    int              `json:"active_teams"`
	PendingPayment int              `json:"pending_payment"`
	CanceledTeams  int              `json:"canceled_teams"`
	ByCategory     map[Category]int `json:"by_category"`
	ByGender       map[Gender]int   `json:"by_gender"`
}

// MeTeamResponse is the "my team" payload for GET /api/me/team (frontend shape: mapTeamResponse)
type MeTeamResponse struct {
	NomEquip       string             `json:"nomEquip"`
	Email          string             `json:"email"`
	Telefon        string             `json:"telefon"`
	Sexe           string             `json:"sexe"`   // "Masculí" or "Femení"
	Categoria      string             `json:"categoria"`
	Club           string             `json:"club"`   // club name
	Observacions   string             `json:"observacions,omitempty"`
	DataInscripcio string             `json:"dataInscripcio,omitempty"`
	Intolerancies  []string           `json:"intolerancies"`
	Jugadors       []MeTeamJugador    `json:"jugadors"`
	Entrenadors    []MeTeamEntrenador `json:"entrenadors"`
}

type MeTeamUpdateRequest struct {
	Observations *string `json:"observations,omitempty"`
}

type MeTeamJugador struct {
	ID             int    `json:"id"`
	Nom            string `json:"nom"`
	Cognoms        string `json:"cognoms"`
	TallaSamarreta string `json:"tallaSamarreta"`
}

type MeTeamEntrenador struct {
	ID             int    `json:"id"`
	Nom            string `json:"nom"`
	Cognoms        string `json:"cognoms"`
	TallaSamarreta string `json:"tallaSamarreta"`
	EsPrincipal    bool   `json:"esPrincipal"`
}
