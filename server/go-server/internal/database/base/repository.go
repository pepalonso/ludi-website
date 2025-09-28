package base

import (
	"database/sql"
)

// BaseRepository holds the common database connection
type BaseRepository struct {
	DB *sql.DB
}

// NewBaseRepository creates a new base repository
func NewBaseRepository(db *sql.DB) *BaseRepository {
	return &BaseRepository{DB: db}
}

// GetDB returns the underlying database connection
func (r *BaseRepository) GetDB() *sql.DB {
	return r.DB
}
