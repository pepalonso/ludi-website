package models

import "time"

type AllergyBase struct {
	PlayerID    int     `json:"player_id" db:"player_id" validate:"required,gt=0,foreign_key=players.id"`
	Description *string `json:"description" db:"description"`
}

type Allergy struct {
	ID        int       `json:"id" db:"id"`
	PlayerID  int       `json:"player_id" db:"player_id"`
	Description *string `json:"description" db:"description"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`

	Player *Player `json:"player,omitempty" db:"-"`
}

type AllergyCreateRequest struct {
	PlayerID    int     `json:"player_id" validate:"required,gt=0"`
	Description *string `json:"description,omitempty"`
}

type AllergyUpdateRequest struct {
	Description *string `json:"description,omitempty"`
}

type AllergyResponse struct {
	ID          int       `json:"id"`
	PlayerID    int       `json:"player_id"`
	Description *string   `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	Player      *PlayerResponse `json:"player,omitempty"`
}

type AllergyListResponse struct {
	Allergies  []AllergyResponse `json:"allergies"`
	Total      int               `json:"total"`
	Page       int               `json:"page"`
	PageSize   int               `json:"page_size"`
	TotalPages int               `json:"total_pages"`
}

type AllergyFilters struct {
	PlayerID *int `json:"player_id,omitempty"`
	Page     int  `json:"page"`
	PageSize int  `json:"page_size"`
}

type AllergyStats struct {
	TotalAllergies int `json:"total_allergies"`
	ByPlayer       map[int]int `json:"by_player"`
}
