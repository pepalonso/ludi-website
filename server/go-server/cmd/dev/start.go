package main

import (
	"os"
	"os/exec"
)

func startDev() {
	printStatus("Starting development environment with hot reloading...")

	if err := checkDocker(); err != nil {
		printError("Docker is not running. Please start Docker and try again.")
		os.Exit(1)
	}

	env, err := loadEnv()
	if err != nil {
		printError("Failed to load environment: " + err.Error())
		os.Exit(1)
	}

	setDockerEnv(env)

	name, prefix := dockerComposeCmd()
	cmd := exec.Command(name, append(prefix, "up", "-d")...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		printError("Failed to start development environment: " + err.Error())
		os.Exit(1)
	}

	printSuccess("Development environment started with Air hot reloading")
	printStatus("Database: localhost:" + env.DBPort)
	printStatus("phpMyAdmin: http://localhost:" + env.PMAPort)
	printStatus("Go Server: http://localhost:" + env.GoServerPort)
	printStatus("API Health: http://localhost:" + env.GoServerPort + "/health")
}

// startDBOnly starts only the database and phpMyAdmin (no app build).
// Use when you run the Go server locally: go run ./cmd/server/
// Set DB_HOST=localhost and DB_PORT to env.DBPort (e.g. 3307) in your environment.
func startDBOnly() {
	printStatus("Starting database and phpMyAdmin only (no app container)...")

	if err := checkDocker(); err != nil {
		printError("Docker is not running. Please start Docker and try again.")
		os.Exit(1)
	}

	env, err := loadEnv()
	if err != nil {
		printError("Failed to load environment: " + err.Error())
		os.Exit(1)
	}

	setDockerEnv(env)

	name, prefix := dockerComposeCmd()
	cmd := exec.Command(name, append(prefix, "up", "-d", "db", "phpmyadmin")...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		printError("Failed to start database: " + err.Error())
		os.Exit(1)
	}

	printSuccess("Database and phpMyAdmin started")
	printStatus("Database: localhost:" + env.DBPort + " (user: " + env.DBUser + ", db: " + env.DBName + ")")
	printStatus("phpMyAdmin: http://localhost:" + env.PMAPort)
	printStatus("Run the server locally: DB_HOST=localhost DB_PORT=" + env.DBPort + " go run ./cmd/server/")
}
