package main

import (
	"bufio"
	"os"
	"os/exec"
	"strings"
	"time"
)

func resetDB() {
	printWarning("This will delete all data in the database. Are you sure? (y/N)")
	reader := bufio.NewReader(os.Stdin)
	response, _ := reader.ReadString('\n')
	response = strings.TrimSpace(strings.ToLower(response))

	if response == "y" || response == "yes" {
		printStatus("Resetting database...")

		env, err := loadEnv()
		if err != nil {
			printError("Failed to load environment: " + err.Error())
			os.Exit(1)
		}

		setDockerEnv(env)

		name, prefix := dockerComposeCmd()
		cmd := exec.Command(name, append(prefix, "down", "-v", "--remove-orphans")...)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr

		if err := cmd.Run(); err != nil {
			printError("Failed to reset database: " + err.Error())
			os.Exit(1)
		}

		time.Sleep(2 * time.Second)
		startDev()
		printSuccess("Database reset complete")
	} else {
		printStatus("Database reset cancelled")
	}
}
