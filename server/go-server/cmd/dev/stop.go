package main

import (
	"os"
	"os/exec"
)

func stopDev() {
	printStatus("Stopping development environment...")

	env, err := loadEnv()
	if err != nil {
		printError("Failed to load environment: " + err.Error())
		os.Exit(1)
	}

	// Set environment variables for docker-compose
	setDockerEnv(env)

	cmd := exec.Command("docker-compose", "down", "--remove-orphans")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		printError("Failed to stop development environment: " + err.Error())
		os.Exit(1)
	}

	printSuccess("Development environment stopped")
}
