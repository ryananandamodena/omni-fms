package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"omnichannel-fms/internal/auth"
	"omnichannel-fms/internal/middleware"
	"omnichannel-fms/internal/products"
	"omnichannel-fms/internal/marketplaces"
	"omnichannel-fms/internal/sync"
	"omnichannel-fms/internal/media"
	"omnichannel-fms/internal/ai"
	"omnichannel-fms/internal/database"
	"omnichannel-fms/internal/categories"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	// Initialize Database Pool
	initCtx, cancelInit := context.WithTimeout(context.Background(), 5*time.Second)
	_, _ = database.InitDB(initCtx)
	cancelInit()
	defer database.Close()

	// Set Gin mode
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-Request-ID"},
		ExposeHeaders:    []string{"Content-Length", "X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "omnichannel-fms",
			"version": "1.0.0",
		})
	})

	// API v1
	v1 := r.Group("/api/v1")
	{
		// Auth routes (no auth required)
		authGroup := v1.Group("/auth")
		auth.RegisterRoutes(authGroup)

		// Protected routes
		protected := v1.Group("")
		protected.Use(middleware.AuthRequired())
		{
			// Products
			productsGroup := protected.Group("/products")
			products.RegisterRoutes(productsGroup)

			// Marketplaces
			marketplacesGroup := protected.Group("/marketplaces")
			marketplaces.RegisterRoutes(marketplacesGroup)

			// Sync
			syncGroup := protected.Group("/sync")
			sync.RegisterRoutes(syncGroup)

			// Media
			mediaGroup := protected.Group("/media")
			media.RegisterRoutes(mediaGroup)

			// AI
			aiGroup := protected.Group("/ai")
			ai.RegisterRoutes(aiGroup)

			// Categories & Mapping
			categoriesGroup := protected.Group("/categories")
			categories.RegisterRoutes(categoriesGroup)
		}
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	go func() {
		log.Printf("Server starting on port %s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}
	log.Println("Server exited")
}
