package workers

import (
	"encoding/json"
	"log"
	"os"
	"time"

	"github.com/hibiken/asynq"
)

const (
	TypeProductSync = "product:sync"
)

type SyncTaskPayload struct {
	JobID       string    `json:"job_id"`
	ProductID   string    `json:"product_id"`
	ProductName string    `json:"product_name"`
	Channel     string    `json:"channel"`
	Action      string    `json:"action"`
	CreatedAt   time.Time `json:"created_at"`
}

var (
	asynqClient *asynq.Client
)

// GetRedisOpt parses Redis options from environment
func GetRedisOpt() asynq.RedisConnOpt {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL != "" {
		opt, err := asynq.ParseRedisURI(redisURL)
		if err == nil {
			return opt
		}
		log.Printf("[Workers] Error parsing REDIS_URL: %v, using default host", err)
	}

	addr := os.Getenv("REDIS_ADDR")
	if addr == "" {
		addr = "localhost:6379"
	}
	pass := os.Getenv("REDIS_PASSWORD")

	return asynq.RedisClientOpt{
		Addr:     addr,
		Password: pass,
		DB:       0,
	}
}

// InitClient creates an Asynq client for enqueuing tasks
func InitClient() *asynq.Client {
	if asynqClient != nil {
		return asynqClient
	}
	opt := GetRedisOpt()
	asynqClient = asynq.NewClient(opt)
	log.Println("[Workers] Asynq client initialized")
	return asynqClient
}

// CloseClient gracefully closes the client
func CloseClient() {
	if asynqClient != nil {
		_ = asynqClient.Close()
		asynqClient = nil
	}
}

// EnqueueSyncTask pushes a sync job to the Redis queue
func EnqueueSyncTask(payload SyncTaskPayload) (*asynq.TaskInfo, error) {
	client := InitClient()
	data, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	task := asynq.NewTask(TypeProductSync, data, asynq.MaxRetry(3), asynq.Timeout(60*time.Second))
	info, err := client.Enqueue(task)
	if err != nil {
		log.Printf("[Workers] Failed to enqueue sync task: %v", err)
		return nil, err
	}

	log.Printf("[Workers] Successfully enqueued sync task: ID=%s Queue=%s", info.ID, info.Queue)
	return info, nil
}
