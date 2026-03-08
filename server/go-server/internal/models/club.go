package models

import "time"

type ClubBase struct {
	Name    string  `json:"name" db:"name" validate:"required,min=1,max=255,unique=clubs.name"`
	LogoURL *string `json:"logo_url" db:"logo_url"`
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
	LogoURL   *string   `json:"logo_url,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ClubListPublicItem is the shape returned by the public clubs list endpoint (for frontend dropdown and logo lookup).
type ClubListPublicItem struct {
	ClubName string `json:"club_name"`
	LogoURL  string `json:"logo_url"`
}

type ClubListResponse struct {
	Clubs []ClubResponse `json:"clubs"`
}
