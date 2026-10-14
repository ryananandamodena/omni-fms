package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"
	"omnichannel-fms/internal/database"
	"omnichannel-fms/workers"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("[Worker Main] .env not found, using system environment variables")
	}

	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()

	// Initialize Database connection
	_, _ = database.InitDB(ctx)
	defer database.Close()

	log.Println("[Worker Main] Starting Omnichannel FMS background worker...")
	if err := workers.StartWorkerServer(ctx); err != nil {
		log.Fatalf("[Worker Main] Worker server error: %v", err)
	}
	log.Println("[Worker Main] Worker exited gracefully")
}
