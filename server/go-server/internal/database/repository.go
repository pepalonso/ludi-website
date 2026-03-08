package database

import (
	"context"
	"errors"
	"time"

	"tournament-dev/internal/models"
)

var (
	ErrSessionNotFound = errors.New("session not found")
	ErrInvalidToken    = errors.New("invalid or expired token")
)

// Repository defines the interface for all database operations
type Repository interface {
	// Club operations
	ClubRepository
	// Team operations
	TeamRepository
	// Player operations
	PlayerRepository
	// Coach operations
	CoachRepository
	// Allergy operations
	AllergyRepository
	// Document operations
	DocumentRepository
	// Auth operations
	AuthRepository
}

// AuthRepository defines auth/session database operations
type AuthRepository interface {
	CreateRegistrationToken(ctx context.Context, teamID int, token string, expiresAt time.Time) error
	GetTeamIDByRegistrationToken(ctx context.Context, token string) (*int, error)
	CreateEditSession(ctx context.Context, teamID int, sessionToken, pinHash, contactMethod string, expiresAt time.Time) error
	GetPendingSessionsByTeamID(ctx context.Context, teamID int) ([]EditSessionRow, error)
	MarkSessionUsedByToken(ctx context.Context, sessionToken string) error
	GetTeamIDBySessionToken(ctx context.Context, sessionToken string) (*int, error)
	ResolveBearerToken(ctx context.Context, token string) (teamID int, err error)
	CreateAdminSession(ctx context.Context, token string, expiresAt time.Time) error
	ValidateAdminSession(ctx context.Context, token string) (bool, error)
	DeleteAdminSession(ctx context.Context, token string) error
	CreateAdminGrantedTeamSession(ctx context.Context, teamID int, sessionToken string, expiresAt time.Time) error
}

// EditSessionRow is a pending edit session (for PIN verification)
type EditSessionRow struct {
	SessionToken string
	PinHash      string
	ExpiresAt    time.Time
}

// ClubRepository defines club-related database operations
type ClubRepository interface {
	CreateClub(ctx context.Context, club *models.ClubCreateRequest) error
	GetClubByID(ctx context.Context, id int) (*models.Club, error)
	GetClubByName(ctx context.Context, name string) (*models.Club, error)
	UpdateClub(ctx context.Context, id int, club *models.ClubUpdateRequest) error
	DeleteClub(ctx context.Context, id int) error
	ListClubs(ctx context.Context) (*models.ClubListResponse, error)
}

// TeamRepository defines team-related database operations
type TeamRepository interface {
	CreateTeam(ctx context.Context, team *models.TeamCreateRequest) (int, error)
	GetTeamByID(ctx context.Context, id int) (*models.Team, error)
	GetTeamByEmail(ctx context.Context, email string) (*models.Team, error)
	UpdateTeam(ctx context.Context, id int, team *models.TeamUpdateRequest) error
	UpdateTeamObservations(ctx context.Context, id int, observations *string) error
	DeleteTeam(ctx context.Context, id int) error
	ListTeams(ctx context.Context, filters models.TeamFilters) (*models.TeamListResponse, error)
	GetTeamStats(ctx context.Context) (*models.TeamStats, error)
	GetTeamWithRelations(ctx context.Context, id int) (*models.Team, error)
	TeamExists(ctx context.Context, id int) (bool, error)
}

// PlayerRepository defines player-related database operations
type PlayerRepository interface {
	CreatePlayer(ctx context.Context, player *models.PlayerCreateRequest) error
	GetPlayerByID(ctx context.Context, id int) (*models.Player, error)
	UpdatePlayer(ctx context.Context, id int, player *models.PlayerUpdateRequest) error
	DeletePlayer(ctx context.Context, id int) error
	ListPlayers(ctx context.Context, filters models.PlayerFilters) (*models.PlayerListResponse, error)
	GetPlayersByTeamID(ctx context.Context, teamID int) ([]models.Player, error)
}

// CoachRepository defines coach-related database operations
type CoachRepository interface {
	CreateCoach(ctx context.Context, coach *models.CoachCreateRequest) error
	GetCoachByID(ctx context.Context, id int) (*models.Coach, error)
	UpdateCoach(ctx context.Context, id int, coach *models.CoachUpdateRequest) error
	DeleteCoach(ctx context.Context, id int) error
	ListCoaches(ctx context.Context, filters models.CoachFilters) (*models.CoachListResponse, error)
	GetCoachesByTeamID(ctx context.Context, teamID int) ([]models.Coach, error)
}

// AllergyRepository defines allergy-related database operations
type AllergyRepository interface {
	CreateAllergy(ctx context.Context, allergy *models.AllergyCreateRequest) error
	GetAllergyByID(ctx context.Context, id int) (*models.Allergy, error)
	DeleteAllergy(ctx context.Context, id int) error
	ListAllergies(ctx context.Context, filters models.AllergyFilters) (*models.AllergyListResponse, error)
	GetAllergiesByTeamID(ctx context.Context, teamID int) ([]models.Allergy, error)
}

// DocumentRepository defines document-related database operations
type DocumentRepository interface {
	CreateDocument(ctx context.Context, document *models.DocumentCreateRequest) (int64, error)
	GetDocumentByID(ctx context.Context, id int) (*models.Document, error)
	UpdateDocument(ctx context.Context, id int, req *models.DocumentUpdateRequest) error
	DeleteDocument(ctx context.Context, id int) error
	ListDocuments(ctx context.Context, filters models.DocumentFilters) (*models.DocumentListResponse, error)
	GetDocumentsByTeamID(ctx context.Context, teamID int) ([]models.Document, error)
}
