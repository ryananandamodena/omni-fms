package products

import (
	"context"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"omnichannel-fms/internal/database"
)

type Variant struct {
	ID    string  `json:"id"`
	SKU   string  `json:"sku"`
	Name  string  `json:"name"`
	Price float64 `json:"price"`
	Stock int     `json:"stock"`
}

type Product struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	SKU         string    `json:"sku"`
	Brand       string    `json:"brand"`
	Category    string    `json:"category"`
	BasePrice   float64   `json:"base_price"`
	TotalStock  int       `json:"total_stock"`
	Status      string    `json:"status"` // active, draft, archived
	Images      []string  `json:"images"`
	Variants    []Variant `json:"variants"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

var (
	productsStore = make(map[string]Product)
	mu            sync.RWMutex
)

func init() {
	// Seed initial in-memory fallback products
	p1 := Product{
		ID:          "1",
		Title:       "MODENA Gas Hob Crista Series BH 1725 L - 2 Tungku Gas",
		Description: "Kompor gas tanam 2 tungku berdesain modern dengan material tempered glass tahan panas dan garansi resmi seumur hidup untuk kaca.",
		SKU:         "MDN-BH-1725L",
		Brand:       "MODENA",
		Category:    "Cooking Appliances",
		BasePrice:   3250000,
		TotalStock:  48,
		Status:      "active",
		Images: []string{
			"https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&auto=format&fit=crop",
		},
		Variants: []Variant{
			{ID: "v1-1", SKU: "MDN-BH-1725L-BLK", Name: "Black Tempered Glass", Price: 3250000, Stock: 30},
			{ID: "v1-2", SKU: "MDN-BH-1725L-SLV", Name: "Stainless Steel Edition", Price: 3450000, Stock: 18},
		},
		CreatedAt: time.Now().Add(-48 * time.Hour),
		UpdatedAt: time.Now(),
	}
	p2 := Product{
		ID:          "2",
		Title:       "MODENA Purifier Air Care Series AP 2530 G - HEPA Filter",
		Description: "Air purifier berkapasitas ruangan 30m2 dengan 4 lapis filtrasi termasuk True HEPA 13 untuk udara bersih bebas bakteri & virus.",
		SKU:         "MDN-AP-2530G",
		Brand:       "MODENA",
		Category:    "Air Care",
		BasePrice:   2150000,
		TotalStock:  85,
		Status:      "active",
		Images: []string{
			"https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&auto=format&fit=crop",
		},
		Variants: []Variant{
			{ID: "v2-1", SKU: "MDN-AP-2530G-WHT", Name: "Pure White", Price: 2150000, Stock: 85},
		},
		CreatedAt: time.Now().Add(-24 * time.Hour),
		UpdatedAt: time.Now(),
	}
	productsStore[p1.ID] = p1
	productsStore[p2.ID] = p2
}

func RegisterRoutes(rg *gin.RouterGroup) {
	rg.GET("", handleListProducts)
	rg.GET("/:id", handleGetProduct)
	rg.POST("", handleCreateProduct)
	rg.PUT("/:id", handleUpdateProduct)
	rg.DELETE("/:id", handleDeleteProduct)
}

func handleListProducts(c *gin.Context) {
	pool := database.GetPool()
	if pool != nil {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		rows, err := pool.Query(ctx, `
			SELECT id, sku, name, COALESCE(short_description, ''), status, created_at, updated_at
			FROM products
			WHERE deleted_at IS NULL
			ORDER BY updated_at DESC
		`)
		if err == nil {
			defer rows.Close()
			var list []Product
			for rows.Next() {
				var p Product
				var idStr string
				if err := rows.Scan(&idStr, &p.SKU, &p.Title, &p.Description, &p.Status, &p.CreatedAt, &p.UpdatedAt); err == nil {
					p.ID = idStr
					list = append(list, p)
				}
			}
			if len(list) > 0 {
				c.JSON(http.StatusOK, gin.H{
					"data":   list,
					"total":  len(list),
					"source": "postgresql",
				})
				return
			}
		} else {
			log.Printf("[Products] Postgres list query failed: %v (using memory fallback)", err)
		}
	}

	// Fallback to in-memory store
	mu.RLock()
	defer mu.RUnlock()

	list := make([]Product, 0, len(productsStore))
	for _, p := range productsStore {
		list = append(list, p)
	}

	c.JSON(http.StatusOK, gin.H{
		"data":   list,
		"total":  len(list),
		"source": "in-memory",
	})
}

func handleGetProduct(c *gin.Context) {
	id := c.Param("id")
	pool := database.GetPool()

	if pool != nil {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		var p Product
		var idStr string
		err := pool.QueryRow(ctx, `
			SELECT id, sku, name, COALESCE(long_description, short_description, ''), status, created_at, updated_at
			FROM products
			WHERE id::text = $1 AND deleted_at IS NULL
		`, id).Scan(&idStr, &p.SKU, &p.Title, &p.Description, &p.Status, &p.CreatedAt, &p.UpdatedAt)

		if err == nil {
			p.ID = idStr
			c.JSON(http.StatusOK, gin.H{"data": p, "source": "postgresql"})
			return
		}
	}

	mu.RLock()
	p, exists := productsStore[id]
	mu.RUnlock()

	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": p, "source": "in-memory"})
}

func handleCreateProduct(c *gin.Context) {
	var p Product
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if p.ID == "" {
		p.ID = uuid.New().String()
	}
	p.CreatedAt = time.Now()
	p.UpdatedAt = time.Now()

	pool := database.GetPool()
	if pool != nil {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		_, err := pool.Exec(ctx, `
			INSERT INTO products (id, sku, name, short_description, long_description, status, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			ON CONFLICT (sku) DO UPDATE
			SET name = EXCLUDED.name, short_description = EXCLUDED.short_description, updated_at = NOW()
		`, p.ID, p.SKU, p.Title, p.Description, p.Description, p.Status, p.CreatedAt, p.UpdatedAt)

		if err != nil {
			log.Printf("[Products] Postgres insert error: %v", err)
		} else {
			log.Printf("[Products] Product %s saved to PostgreSQL", p.ID)
		}
	}

	// Always update in-memory cache as well
	mu.Lock()
	productsStore[p.ID] = p
	mu.Unlock()

	c.JSON(http.StatusCreated, gin.H{"data": p, "message": "Product created successfully"})
}

func handleUpdateProduct(c *gin.Context) {
	id := c.Param("id")
	var req Product
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req.ID = id
	req.UpdatedAt = time.Now()

	pool := database.GetPool()
	if pool != nil {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		_, err := pool.Exec(ctx, `
			UPDATE products
			SET name = $1, short_description = $2, status = $3, updated_at = $4
			WHERE id::text = $5
		`, req.Title, req.Description, req.Status, req.UpdatedAt, id)

		if err != nil {
			log.Printf("[Products] Postgres update error: %v", err)
		}
	}

	mu.Lock()
	existing, exists := productsStore[id]
	if exists {
		req.CreatedAt = existing.CreatedAt
	} else {
		req.CreatedAt = time.Now()
	}
	productsStore[id] = req
	mu.Unlock()

	c.JSON(http.StatusOK, gin.H{"data": req, "message": "Product updated successfully"})
}

func handleDeleteProduct(c *gin.Context) {
	id := c.Param("id")

	pool := database.GetPool()
	if pool != nil {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		_, err := pool.Exec(ctx, `
			UPDATE products SET deleted_at = NOW() WHERE id::text = $1
		`, id)
		if err != nil {
			log.Printf("[Products] Postgres soft-delete error: %v", err)
		}
	}

	mu.Lock()
	delete(productsStore, id)
	mu.Unlock()

	c.JSON(http.StatusOK, gin.H{"message": "Product deleted successfully"})
}
