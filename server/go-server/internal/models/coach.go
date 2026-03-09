package models

import "time"

type CoachBase struct {
	FirstName   string  `json:"first_name" db:"first_name" validate:"required,min=1,max=255"`
	LastName    string  `json:"last_name" db:"last_name" validate:"required,min=1,max=255"`
	Phone       string  `json:"phone" db:"phone" validate:"required,min=1,max=255"`
	Email       *string `json:"email" db:"email" validate:"omitempty,email,max=255"`
	TeamID      int     `json:"team_id" db:"team_id" validate:"required,gt=0"`
	IsHeadCoach bool    `json:"is_head_coach" db:"is_head_coach"`
	ShirtSize   string  `json:"shirt_size" db:"shirt_size" validate:"required"`
}

type Coach struct {
	ID int `json:"id" db:"id"`
	CoachBase
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`

	Team *Team `json:"team,omitempty" db:"-"`
}

type CoachCreateRequest struct {
	CoachBase
}

type CoachUpdateRequest struct {
	FirstName   string  `json:"first_name,omitempty"`
	LastName    string  `json:"last_name,omitempty"`
	Phone       string  `json:"phone,omitempty"`
	Email       *string `json:"email,omitempty"`
	IsHeadCoach *bool   `json:"is_head_coach,omitempty"`
	ShirtSize   *string `json:"shirt_size,omitempty"`
}

type CoachResponse struct {
	ID          int           `json:"id"`
	FirstName   string        `json:"first_name"`
	LastName    string        `json:"last_name"`
	Phone       string        `json:"phone"`
	Email       *string       `json:"email"`
	TeamID      int           `json:"team_id"`
	IsHeadCoach bool          `json:"is_head_coach"`
	ShirtSize   string        `json:"shirt_size"`
	CreatedAt   time.Time     `json:"created_at"`
	UpdatedAt   time.Time     `json:"updated_at"`
	Team        *TeamResponse `json:"team,omitempty"`
}

type CoachListResponse struct {
	Coaches    []CoachResponse `json:"coaches"`
	Total      int             `json:"total"`
	Page       int             `json:"page"`
	PageSize   int             `json:"page_size"`
	TotalPages int             `json:"total_pages"`
}

type CoachFilters struct {
	TeamID    *int    `json:"team_id,omitempty"`
	Search    *string `json:"search,omitempty"`
	ShirtSize *string `json:"shirt_size,omitempty"`
	Page      int     `json:"page"`
	PageSize  int     `json:"page_size"`
}
