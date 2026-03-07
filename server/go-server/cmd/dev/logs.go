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

	setDockerEnv(env)

	args := []string{"logs", "-f"}
	if len(os.Args) > 2 {
		args = append(args, os.Args[2])
	}
	name, prefix := dockerComposeCmd()
	cmd := exec.Command(name, append(prefix, args...)...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		printError("Failed to view logs: " + err.Error())
		os.Exit(1)
	}
}
