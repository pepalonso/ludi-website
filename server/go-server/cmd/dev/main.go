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
	case "start-prod":
		startProd()
	case "stop":
		stopDev()
	case "stop-prod":
		stopProd()
	case "restart":
		restartDev()
	case "restart-prod":
		restartProd()
	case "logs":
		viewLogs()
	case "logs-prod":
		viewLogsProd()
	case "reset":
		resetDB()
	case "connect":
		connectDB()
	case "status":
		showStatus()
	case "status-prod":
		showStatusProd()
	case "help", "--help", "-h":
		showHelp()
	default:
		printError("Unknown command: " + command)
		showHelp()
		os.Exit(1)
	}
}
