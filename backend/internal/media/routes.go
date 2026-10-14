package media

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type MediaAsset struct {
	ID        string    `json:"id"`
	FileName  string    `json:"file_name"`
	URL       string    `json:"url"`
	SizeKB    int       `json:"size_kb"`
	Format    string    `json:"format"`
	Dimension string    `json:"dimension"`
	CreatedAt time.Time `json:"created_at"`
}

var (
	assets = []MediaAsset{
		{
			ID: "med-1", FileName: "modena-crista-bh1725l.jpg",
			URL: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&auto=format&fit=crop",
			SizeKB: 420, Format: "JPG", Dimension: "1200x1200", CreatedAt: time.Now().Add(-24 * time.Hour),
		},
		{
			ID: "med-2", FileName: "modena-air-purifier.jpg",
			URL: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&auto=format&fit=crop",
			SizeKB: 310, Format: "JPG", Dimension: "1080x1080", CreatedAt: time.Now().Add(-12 * time.Hour),
		},
	}
	mu sync.RWMutex
)

func RegisterRoutes(rg *gin.RouterGroup) {
	rg.GET("", handleListMedia)
	rg.POST("/upload", handleUploadMedia)
}

func handleListMedia(c *gin.Context) {
	mu.RLock()
	defer mu.RUnlock()
	c.JSON(http.StatusOK, gin.H{"data": assets})
}

func handleUploadMedia(c *gin.Context) {
	// Simulated file upload or multipart handler
	var req struct {
		FileName string `json:"file_name"`
		URL      string `json:"url"`
	}
	_ = c.ShouldBindJSON(&req)

	if req.FileName == "" {
		req.FileName = fmt.Sprintf("upload-%d.jpg", time.Now().Unix())
	}
	if req.URL == "" {
		req.URL = "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop"
	}

	newAsset := MediaAsset{
		ID:        fmt.Sprintf("med-%d", time.Now().Unix()),
		FileName:  req.FileName,
		URL:       req.URL,
		SizeKB:    256,
		Format:    "JPG",
		Dimension: "1080x1080",
		CreatedAt: time.Now(),
	}

	mu.Lock()
	assets = append([]MediaAsset{newAsset}, assets...)
	mu.Unlock()

	c.JSON(http.StatusCreated, gin.H{
		"message": "Media uploaded and optimized",
		"asset":   newAsset,
	})
}
