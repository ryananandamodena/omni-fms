package workers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/hibiken/asynq"
	"omnichannel-fms/internal/database"
)

// SyncProcessor handles processing of sync background tasks
type SyncProcessor struct{}

func NewSyncProcessor() *SyncProcessor {
	return &SyncProcessor{}
}

// ProcessTask handles dispatch of tasks according to their type
func (p *SyncProcessor) ProcessTask(ctx context.Context, t *asynq.Task) error {
	switch t.Type() {
	case TypeProductSync:
		var payload SyncTaskPayload
		if err := json.Unmarshal(t.Payload(), &payload); err != nil {
			return fmt.Errorf("json.Unmarshal failed: %v: %w", err, asynq.SkipRetry)
		}
		return p.handleProductSync(ctx, payload)
	default:
		return fmt.Errorf("unexpected task type: %s", t.Type())
	}
}

func (p *SyncProcessor) handleProductSync(ctx context.Context, payload SyncTaskPayload) error {
	log.Printf("[Worker Processor] Processing sync job %s: Product=%s (%s) Channel=%s Action=%s",
		payload.JobID, payload.ProductID, payload.ProductName, payload.Channel, payload.Action)

	pool := database.GetPool()
	if pool != nil {
		_, _ = pool.Exec(ctx, `
			UPDATE sync_jobs
			SET status = 'processing', started_at = NOW()
			WHERE id::text = $1
		`, payload.JobID)
	}

	// Simulated execution / Adapter invocation
	time.Sleep(500 * time.Millisecond)

	// Record success in PostgreSQL if DB is connected
	if pool != nil {
		now := time.Now()
		_, err := pool.Exec(ctx, `
			UPDATE sync_jobs
			SET status = 'success', finished_at = $1
			WHERE id::text = $2
		`, now, payload.JobID)
		if err != nil {
			log.Printf("[Worker Processor] Failed to update sync_job in DB: %v", err)
		}

		_, _ = pool.Exec(ctx, `
			INSERT INTO sync_logs (sync_job_id, level, message, created_at)
			VALUES ($1, 'info', $2, NOW())
		`, payload.JobID, fmt.Sprintf("Successfully synced to channel %s", payload.Channel))
	}

	log.Printf("[Worker Processor] Completed sync job %s successfully", payload.JobID)
	return nil
}

// StartWorkerServer initializes and runs Asynq background worker server
func StartWorkerServer(ctx context.Context) error {
	redisOpt := GetRedisOpt()
	srv := asynq.NewServer(
		redisOpt,
		asynq.Config{
			Concurrency: 10,
			Queues: map[string]int{
				"critical": 6,
				"default":  3,
				"low":      1,
			},
			LogLevel: asynq.InfoLevel,
		},
	)

	mux := asynq.NewServeMux()
	processor := NewSyncProcessor()
	mux.HandleFunc(TypeProductSync, processor.ProcessTask)

	log.Println("[Worker Server] Starting Asynq background worker server...")

	// Handle graceful shutdown via context
	go func() {
		<-ctx.Done()
		log.Println("[Worker Server] Shutting down Asynq server...")
		srv.Shutdown()
	}()

	return srv.Run(mux)
}
