package main

import (
	"os"
	"os/exec"
)

func viewLogs() {
	env, err := loadEnv()
	if err != nil {
		printError("Failed to load environment: " + err.Error())
		os.Exit(1)
	}

	// Set environment variables for docker-compose
	setDockerEnv(env)

	args := []string{"logs", "-f"}
	if len(os.Args) > 2 {
		args = append(args, os.Args[2])
	}

	cmd := exec.Command("docker-compose", args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		printError("Failed to view logs: " + err.Error())
		os.Exit(1)
	}
}
