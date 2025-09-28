package main

import (
	"fmt"
	"os"
	"os/exec"
)

func showStatus() {
	printStatus("Development environment status:")

	cmd := exec.Command("docker-compose", "ps")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		printError("Failed to show status: " + err.Error())
		os.Exit(1)
	}

	// Load env just for connection info display
	env, err := loadEnv()
	if err != nil {
		printWarning("Could not load environment variables for connection info")
		return
	}

	fmt.Println()
	printStatus("Database connection info:")
	fmt.Printf("  Host: localhost\n")
	fmt.Printf("  Port: %s\n", env.DBPort)
	fmt.Printf("  Database: %s\n", env.DBName)
	fmt.Printf("  User: %s\n", env.DBUser)
	fmt.Printf("  phpMyAdmin: http://localhost:%s\n", env.PMAPort)
}
