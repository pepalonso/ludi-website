package models

import "time"

type ClubBase struct {
	Name string `json:"name" db:"name" validate:"required,min=1,max=255,unique=clubs.name"`
}

type Club struct {
	ID int `json:"id" db:"id"`
	ClubBase
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type ClubCreateRequest struct {
	ClubBase
}

type ClubUpdateRequest struct {
	ClubBase
}

type ClubResponse struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ClubListResponse struct {
	Clubs []ClubResponse `json:"clubs"`
}
