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

	cmd := exec.Command("docker-compose", "up", "-d")
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
