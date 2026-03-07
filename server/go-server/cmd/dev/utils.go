package main

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"strings"
)

// Colors for output
const (
	red    = "\033[31m"
	green  = "\033[32m"
	yellow = "\033[33m"
	blue   = "\033[34m"
	reset  = "\033[0m"
)

// Environment variables
type Env struct {
	DBName           string
	DBUser           string
	DBPassword       string
	DBRootPassword   string
	DBPort           string
	PMAPort          string
	AppPort          string
	AppEnv           string
	GoServerPort     string
	DatabaseHost     string
	DatabasePort     string
	DatabaseName     string
	DatabaseUser     string
	DatabasePassword string
}

// Print functions
func printStatus(msg string) {
	fmt.Printf("%s[INFO]%s %s\n", blue, reset, msg)
}

func printSuccess(msg string) {
	fmt.Printf("%s[SUCCESS]%s %s\n", green, reset, msg)
}

func printWarning(msg string) {
	fmt.Printf("%s[WARNING]%s %s\n", yellow, reset, msg)
}

func printError(msg string) {
	fmt.Printf("%s[ERROR]%s %s\n", red, reset, msg)
}

// Check if Docker is running
func checkDocker() error {
	cmd := exec.Command("docker", "info")
	return cmd.Run()
}

// dockerComposeCmd returns the executable name and any prefix args for compose.
// Prefers "docker compose" (v2) when "docker-compose" (v1) is not in PATH.
func dockerComposeCmd() (name string, prefix []string) {
	if _, err := exec.LookPath("docker-compose"); err == nil {
		return "docker-compose", nil
	}
	return "docker", []string{"compose"}
}

// Load environment variables from .env.dev file
func loadEnv() (*Env, error) {
	env := &Env{
		DBName:         "tournament",
		DBUser:         "tournament_user",
		DBPassword:     "tournament_dev_pass",
		DBRootPassword: "admin_dev_root",
		DBPort:         "3307",
		PMAPort:        "8081",
		AppPort:        "8080",
		AppEnv:         "development",
		// Go Server Configuration
		GoServerPort:     "8080",
		DatabaseHost:     "db",
		DatabasePort:     "3306",
		DatabaseName:     "tournament",
		DatabaseUser:     "tournament_user",
		DatabasePassword: "tournament_dev_pass",
	}

	// Try to load from .env.dev file
	file, err := os.Open(".env.dev")
	if err != nil {
		printWarning(".env.dev file not found, using defaults")
		return env, nil
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}

		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])

		switch key {
		case "DB_NAME":
			env.DBName = value
		case "DB_USER":
			env.DBUser = value
		case "DB_PASSWORD":
			env.DBPassword = value
		case "DB_ROOT_PASSWORD":
			env.DBRootPassword = value
		case "DB_PORT":
			env.DBPort = value
		case "PMA_PORT":
			env.PMAPort = value
		case "APP_PORT":
			env.AppPort = value
		case "APP_ENV":
			env.AppEnv = value
		// Go Server Configuration
		case "GO_SERVER_PORT":
			env.GoServerPort = value
		case "DATABASE_HOST":
			env.DatabaseHost = value
		case "DATABASE_PORT":
			env.DatabasePort = value
		case "DATABASE_NAME":
			env.DatabaseName = value
		case "DATABASE_USER":
			env.DatabaseUser = value
		case "DATABASE_PASSWORD":
			env.DatabasePassword = value
		}
	}

	printSuccess("Loaded development environment variables")
	return env, nil
}

// Set environment variables for docker-compose
func setDockerEnv(env *Env) {
	os.Setenv("DB_NAME", env.DBName)
	os.Setenv("DB_USER", env.DBUser)
	os.Setenv("DB_PASSWORD", env.DBPassword)
	os.Setenv("DB_ROOT_PASSWORD", env.DBRootPassword)
	os.Setenv("DB_PORT", env.DBPort)
	os.Setenv("PMA_PORT", env.PMAPort)
	// Go Server Configuration
	os.Setenv("GO_SERVER_PORT", env.GoServerPort)
	os.Setenv("DATABASE_HOST", env.DatabaseHost)
	os.Setenv("DATABASE_PORT", env.DatabasePort)
	os.Setenv("DATABASE_NAME", env.DatabaseName)
	os.Setenv("DATABASE_USER", env.DatabaseUser)
	os.Setenv("DATABASE_PASSWORD", env.DatabasePassword)
	os.Setenv("APP_ENV", env.AppEnv)
}
