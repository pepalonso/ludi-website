package main

import (
	"os"
)

func main() {
	if len(os.Args) < 2 {
		showHelp()
		return
	}

	command := os.Args[1]
	switch command {
	case "start":
		startDev()
	case "start-db":
		startDBOnly()
	case "stop":
		stopDev()
	case "restart":
		restartDev()
	case "logs":
		viewLogs()
	case "reset":
		resetDB()
	case "connect":
		connectDB()
	case "status":
		showStatus()
	case "help", "--help", "-h":
		showHelp()
	default:
		printError("Unknown command: " + command)
		showHelp()
		os.Exit(1)
	}
}
