package models

import "time"

type PlayerBase struct {
	FirstName string    `json:"first_name" db:"first_name" validate:"required,min=1,max=255"`
	LastName  string    `json:"last_name" db:"last_name" validate:"required,min=1,max=255"`
	ShirtSize ShirtSize `json:"shirt_size" db:"shirt_size" validate:"required,oneof=8 10 12 14 S M L XL 2XL 3XL 4XL"`
	TeamID    int       `json:"team_id" db:"team_id" validate:"required,gt=0"`
}

type Player struct {
	ID int `json:"id" db:"id"`
	PlayerBase
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`

	Team      *Team     `json:"team,omitempty" db:"-"`
	Allergies []Allergy `json:"allergies,omitempty" db:"-"`
}

type PlayerCreateRequest struct {
	PlayerBase
}

type PlayerUpdateRequest struct {
	FirstName string    `json:"first_name,omitempty"`
	LastName  string    `json:"last_name,omitempty"`
	ShirtSize ShirtSize `json:"shirt_size,omitempty"`
}

type PlayerResponse struct {
	ID        int           `json:"id"`
	FirstName string        `json:"first_name"`
	LastName  string        `json:"last_name"`
	ShirtSize ShirtSize     `json:"shirt_size"`
	TeamID    int           `json:"team_id"`
	CreatedAt time.Time     `json:"created_at"`
	UpdatedAt time.Time     `json:"updated_at"`
	Team      *TeamResponse `json:"team,omitempty"`
}

type PlayerListResponse struct {
	Players    []PlayerResponse `json:"players"`
	Total      int              `json:"total"`
	Page       int              `json:"page"`
	PageSize   int              `json:"page_size"`
	TotalPages int              `json:"total_pages"`
}

type PlayerFilters struct {
	TeamID    *int    `json:"team_id,omitempty"`
	ShirtSize *string `json:"shirt_size,omitempty"`
	Search    *string `json:"search,omitempty"`
	Page      int     `json:"page"`
	PageSize  int     `json:"page_size"`
}

type PlayerWithAllergies struct {
	Player
	Allergies []AllergyResponse `json:"allergies"`
}
