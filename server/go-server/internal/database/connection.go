package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

// Config holds database configuration
type Config struct {
	Host     string
	Port     string
	User     string
	Password string
	Database string
}

// Connection represents a database connection
type Connection struct {
	DB *sql.DB
}

// NewConnection creates a new database connection
func NewConnection(config Config) (*Connection, error) {
	// parseTime=true: parse DATE/DATETIME into time.Time; loc=UTC: interpret as UTC in Go.
	// time_zone='UTC': set MySQL session to UTC so TIMESTAMP read/write matches app (30min from generate).
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&loc=UTC&time_zone=%%27UTC%%27",
		config.User,
		config.Password,
		config.Host,
		config.Port,
		config.Database,
	)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}
	_, _ = db.Exec("SET time_zone = '+00:00'")

	log.Println("Database connection established successfully")

	return &Connection{DB: db}, nil
}

// Close closes the database connection
func (c *Connection) Close() error {
	if c.DB != nil {
		return c.DB.Close()
	}
	return nil
}

// GetDB returns the underlying sql.DB instance
func (c *Connection) GetDB() *sql.DB {
	return c.DB
}

// LoadConfigFromEnv loads database configuration from environment variables
func LoadConfigFromEnv() Config {
	return Config{
		Host:     getEnv("DB_HOST", "localhost"),
		Port:     getEnv("DB_PORT", "3307"),
		User:     getEnv("DB_USER", "tournament_user"),
		Password: getEnv("DB_PASSWORD", "tournament_dev_pass"),
		Database: getEnv("DB_NAME", "tournament"),
	}
}

// getEnv gets an environment variable with a fallback default
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
