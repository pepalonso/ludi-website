package mysql

import (
	"database/sql"

	"tournament-dev/internal/database"
	"tournament-dev/internal/database/mysql/repositories"
)

type Repository struct {
	*repositories.ClubRepository
	*repositories.TeamRepository
	*repositories.PlayerRepository
	*repositories.CoachRepository
	*repositories.AllergyRepository
	*repositories.DocumentRepository
}

func NewRepository(db *sql.DB) database.Repository {
	return &Repository{
		ClubRepository:     repositories.NewClubRepository(db),
		TeamRepository:     repositories.NewTeamRepository(db),
		PlayerRepository:   repositories.NewPlayerRepository(db),
		CoachRepository:    repositories.NewCoachRepository(db),
		AllergyRepository:  repositories.NewAllergyRepository(db),
		DocumentRepository: repositories.NewDocumentRepository(db),
	}
}
