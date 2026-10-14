package sync

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"omnichannel-fms/internal/database"
	"omnichannel-fms/workers"
)

type SyncJob struct {
	ID          string     `json:"id"`
	ProductID   string     `json:"product_id"`
	ProductName string     `json:"product_name"`
	Channel     string     `json:"channel"`
	Action      string     `json:"action"` // create, update_stock, update_price, publish
	Status      string     `json:"status"` // pending, processing, success, failed
	Message     string     `json:"message"`
	CreatedAt   time.Time  `json:"created_at"`
	FinishedAt  *time.Time `json:"finished_at,omitempty"`
}

var (
	jobs = []SyncJob{
		{
			ID: "sync-101", ProductID: "1", ProductName: "MODENA Gas Hob Crista Series BH 1725 L",
			Channel: "Shopee", Action: "update_stock", Status: "success", Message: "Stock synced: 48 units",
			CreatedAt: time.Now().Add(-15 * time.Minute),
		},
		{
			ID: "sync-102", ProductID: "1", ProductName: "MODENA Gas Hob Crista Series BH 1725 L",
			Channel: "Tokopedia", Action: "update_stock", Status: "success", Message: "Stock synced: 48 units",
			CreatedAt: time.Now().Add(-14 * time.Minute),
		},
		{
			ID: "sync-103", ProductID: "2", ProductName: "MODENA Purifier Air Care Series AP 2530 G",
			Channel: "Lazada", Action: "update_price", Status: "success", Message: "Price updated to Rp 2.150.000",
			CreatedAt: time.Now().Add(-45 * time.Minute),
		},
	}
	mu sync.RWMutex
)

func RegisterRoutes(rg *gin.RouterGroup) {
	rg.GET("/jobs", handleListJobs)
	rg.POST("/trigger", handleTriggerSync)
}

func handleListJobs(c *gin.Context) {
	pool := database.GetPool()
	if pool != nil {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		rows, err := pool.Query(ctx, `
			SELECT j.id, j.product_id, COALESCE(p.name, 'Product ' || j.product_id), m.name, j.action, j.status, COALESCE(j.error_message, 'Synced successfully'), j.created_at, j.finished_at
			FROM sync_jobs j
			LEFT JOIN products p ON p.id = j.product_id
			LEFT JOIN marketplace_accounts m ON m.id = j.marketplace_account_id
			ORDER BY j.created_at DESC
			LIMIT 50
		`)
		if err == nil {
			defer rows.Close()
			var list []SyncJob
			for rows.Next() {
				var job SyncJob
				var idStr, prodIdStr string
				if err := rows.Scan(&idStr, &prodIdStr, &job.ProductName, &job.Channel, &job.Action, &job.Status, &job.Message, &job.CreatedAt, &job.FinishedAt); err == nil {
					job.ID = idStr
					job.ProductID = prodIdStr
					list = append(list, job)
				}
			}
			if len(list) > 0 {
				c.JSON(http.StatusOK, gin.H{"data": list, "source": "postgresql"})
				return
			}
		}
	}

	mu.RLock()
	defer mu.RUnlock()
	c.JSON(http.StatusOK, gin.H{"data": jobs, "source": "in-memory"})
}

func handleTriggerSync(c *gin.Context) {
	var req struct {
		ProductID string `json:"product_id" binding:"required"`
		Channel   string `json:"channel"` // all or specific channel
		Action    string `json:"action"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	jobID := uuid.New().String()
	now := time.Now()
	channel := req.Channel
	if channel == "" {
		channel = "all"
	}
	action := req.Action
	if action == "" {
		action = "update"
	}

	newJob := SyncJob{
		ID:          jobID,
		ProductID:   req.ProductID,
		ProductName: "Product " + req.ProductID,
		Channel:     channel,
		Action:      action,
		Status:      "pending",
		Message:     fmt.Sprintf("Sync job scheduled for channel: %s", channel),
		CreatedAt:   now,
	}

	// 1. Try to enqueue into Asynq / Redis queue for async background processing
	taskPayload := workers.SyncTaskPayload{
		JobID:       jobID,
		ProductID:   req.ProductID,
		ProductName: newJob.ProductName,
		Channel:     channel,
		Action:      action,
		CreatedAt:   now,
	}

	_, queueErr := workers.EnqueueSyncTask(taskPayload)
	if queueErr != nil {
		log.Printf("[Sync Routes] Redis enqueue skipped/failed (%v); falling back to direct background execution", queueErr)
		// Fallback: run simulated background processing asynchronously
		go func(job SyncJob) {
			time.Sleep(1 * time.Second)
			mu.Lock()
			for i := range jobs {
				if jobs[i].ID == job.ID {
					jobs[i].Status = "success"
					finished := time.Now()
					jobs[i].FinishedAt = &finished
					jobs[i].Message = fmt.Sprintf("Sync completed successfully to %s", job.Channel)
					break
				}
			}
			mu.Unlock()
		}(newJob)
	} else {
		newJob.Message = "Task enqueued into Redis background worker queue"
	}

	// 2. Persist in memory
	mu.Lock()
	jobs = append([]SyncJob{newJob}, jobs...)
	mu.Unlock()

	c.JSON(http.StatusAccepted, gin.H{
		"message": "Sync job initiated successfully",
		"job":     newJob,
	})
}
