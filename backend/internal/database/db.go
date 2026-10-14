package database

import (
	"context"
	"log"
	"os"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	pool *pgxpool.Pool
	mu   sync.RWMutex
)

// InitDB initializes PostgreSQL connection pool
func InitDB(ctx context.Context) (*pgxpool.Pool, error) {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Println("[Database] DATABASE_URL not set; running in in-memory mode")
		return nil, nil
	}

	config, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		log.Printf("[Database] Failed to parse DATABASE_URL: %v", err)
		return nil, err
	}

	config.MaxConns = 25
	config.MinConns = 5
	config.MaxConnLifetime = 1 * time.Hour
	config.MaxConnIdleTime = 30 * time.Minute

	connectCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	p, err := pgxpool.NewWithConfig(connectCtx, config)
	if err != nil {
		log.Printf("[Database] Failed to connect to PostgreSQL: %v (falling back to in-memory mode)", err)
		return nil, err
	}

	// Ping test
	if err := p.Ping(connectCtx); err != nil {
		log.Printf("[Database] PostgreSQL ping failed: %v (falling back to in-memory mode)", err)
		p.Close()
		return nil, err
	}

	mu.Lock()
	pool = p
	mu.Unlock()

	log.Println("[Database] Successfully connected to PostgreSQL")
	return pool, nil
}

// GetPool returns current connection pool or nil
func GetPool() *pgxpool.Pool {
	mu.RLock()
	defer mu.RUnlock()
	return pool
}

// IsConnected returns true if database pool is ready
func IsConnected() bool {
	mu.RLock()
	defer mu.RUnlock()
	return pool != nil
}

// Close gracefully closes the pool
func Close() {
	mu.Lock()
	defer mu.Unlock()
	if pool != nil {
		pool.Close()
		pool = nil
		log.Println("[Database] Connection pool closed")
	}
}
