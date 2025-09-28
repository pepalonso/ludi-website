package main

import (
	"time"
)

func restartDev() {
	printStatus("Restarting development environment...")
	stopDev()
	time.Sleep(2 * time.Second)
	startDev()
}
