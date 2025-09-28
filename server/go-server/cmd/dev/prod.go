package main

import (
	"bufio"
	"os"
	"os/exec"
	"strings"
)

func startProd() {
	printStatus("Starting production environment...")

	if err := checkDocker(); err != nil {
		printError("Docker is not running. Please start Docker and try again.")
		os.Exit(1)
	}

	env, err := loadProdEnv()
	if err != nil {
		printError("Failed to load production environment: " + err.Error())
		os.Exit(1)
	}

	// Set environment variables for docker-compose
	setDockerEnv(env)

	cmd := exec.Command("docker-compose", "-f", "docker-compose.prod.yml", "--env-file", ".env.prod", "up", "-d")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		printError("Failed to start production environment: " + err.Error())
		os.Exit(1)
	}

	printSuccess("Production environment started")
	printStatus("Database: localhost:" + env.DBPort + " (localhost only)")
	printStatus("Go Server: http://localhost:" + env.GoServerPort + " (localhost only)")
	printStatus("API Health: http://localhost:" + env.GoServerPort + "/health")
}

func stopProd() {
	printStatus("Stopping production environment...")

	cmd := exec.Command("docker-compose", "-f", "docker-compose.prod.yml", "down")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		printError("Failed to stop production environment: " + err.Error())
		os.Exit(1)
	}

	printSuccess("Production environment stopped")
}

func restartProd() {
	printStatus("Restarting production environment...")
	stopProd()
	startProd()
}

func viewLogsProd() {
	args := []string{"-f", "docker-compose.prod.yml", "logs"}
	if len(os.Args) > 2 {
		args = append(args, os.Args[2:]...)
	}

	cmd := exec.Command("docker-compose", args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		printError("Failed to view production logs: " + err.Error())
		os.Exit(1)
	}
}

func showStatusProd() {
	printStatus("Production environment status:")

	cmd := exec.Command("docker-compose", "-f", "docker-compose.prod.yml", "ps")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		printError("Failed to show production status: " + err.Error())
		os.Exit(1)
	}
}

// Load production environment variables
func loadProdEnv() (*Env, error) {
	env := &Env{
		DBName:         "tournament",
		DBUser:         "tournament_user",
		DBPassword:     "CHANGE_THIS_TO_SECURE_PASSWORD",
		DBRootPassword: "CHANGE_THIS_TO_SECURE_ROOT_PASSWORD",
		DBPort:         "3306",
		AppPort:        "8080",
		AppEnv:         "production",
		// Go Server Configuration
		GoServerPort:     "8080",
		DatabaseHost:     "db",
		DatabasePort:     "3306",
		DatabaseName:     "tournament",
		DatabaseUser:     "tournament_user",
		DatabasePassword: "CHANGE_THIS_TO_SECURE_PASSWORD",
	}

	// Try to load from .env.prod file
	file, err := os.Open(".env.prod")
	if err != nil {
		printWarning(".env.prod file not found, using defaults")
		printWarning("Please copy env.prod.example to .env.prod and edit with secure values")
		return env, nil
	}
	defer file.Close()

	// Parse the file similar to loadEnv() but for production
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

	printSuccess("Loaded production environment variables")
	return env, nil
}
