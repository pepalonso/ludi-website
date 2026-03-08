# Tournament Management System - Development Helper Script
# This script runs the Go development helper with all required files

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

$files = @(
    "cmd/dev/main.go",
    "cmd/dev/utils.go", 
    "cmd/dev/start.go",
    "cmd/dev/stop.go",
    "cmd/dev/restart.go",
    "cmd/dev/logs.go",
    "cmd/dev/reset.go",
    "cmd/dev/connect.go",
    "cmd/dev/status.go",
    "cmd/dev/help.go"
)

$args = @($files) + $Command
go run $args 