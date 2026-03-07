package main

import (
	"os"
	"os/exec"
)

func connectDB() {
	env, err := loadEnv()
	if err != nil {
		printError("Failed to load environment: " + err.Error())
		os.Exit(1)
	}

	setDockerEnv(env)

	printStatus("Connecting to database...")
	args := []string{
		"exec", "db", "mysql",
		"-u", env.DBUser,
		"-p" + env.DBPassword,
		env.DBName,
	}
	name, prefix := dockerComposeCmd()
	cmd := exec.Command(name, append(prefix, args...)...)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		printError("Failed to connect to database: " + err.Error())
		os.Exit(1)
	}
}
