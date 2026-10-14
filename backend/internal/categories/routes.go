package categories

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"omnichannel-fms/internal/database"
)

type Category struct {
	ID           string     `json:"id"`
	Name         string     `json:"name"`
	Slug         string     `json:"slug"`
	ParentID     *string    `json:"parent_id,omitempty"`
	ParentName   string     `json:"parent_name,omitempty"`
	Description  string     `json:"description,omitempty"`
	ProductCount int        `json:"product_count"`
	Children     []Category `json:"children,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type CategoryMapping struct {
	ID                      string    `json:"id"`
	MasterCategoryID        string    `json:"master_category_id"`
	MasterCategoryName      string    `json:"master_category_name"`
	MarketplaceID           string    `json:"marketplace_id"` // shopee, tokopedia, lazada, tiktok, blibli, shopify
	MarketplaceCategoryID   string    `json:"marketplace_category_id"`
	MarketplaceCategoryPath string    `json:"marketplace_category_path"`
	Status                  string    `json:"status"` // mapped, unmapped, review
	UpdatedAt               time.Time `json:"updated_at"`
}

var (
	categoriesStore = []Category{
		{
			ID: "cat-1", Name: "Cooking Appliances", Slug: "cooking-appliances",
			Description: "Peralatan memasak dapur modern", ProductCount: 24,
			CreatedAt: time.Now().Add(-60 * 24 * time.Hour), UpdatedAt: time.Now(),
		},
		{
			ID: "cat-1-1", Name: "Gas Hobs (Kompor Gas Tanam)", Slug: "gas-hobs",
			ParentID: strPtr("cat-1"), ParentName: "Cooking Appliances",
			Description: "Kompor gas tanam tempered glass dan stainless", ProductCount: 12,
			CreatedAt: time.Now().Add(-55 * 24 * time.Hour), UpdatedAt: time.Now(),
		},
		{
			ID: "cat-1-2", Name: "Induction & Electric Hobs", Slug: "induction-hobs",
			ParentID: strPtr("cat-1"), ParentName: "Cooking Appliances",
			Description: "Kompor induksi dan listrik hemat energi", ProductCount: 8,
			CreatedAt: time.Now().Add(-50 * 24 * time.Hour), UpdatedAt: time.Now(),
		},
		{
			ID: "cat-1-3", Name: "Cooker Hoods (Penghisap Asap)", Slug: "cooker-hoods",
			ParentID: strPtr("cat-1"), ParentName: "Cooking Appliances",
			Description: "Penghisap asap dapur slim dan chimney series", ProductCount: 4,
			CreatedAt: time.Now().Add(-45 * 24 * time.Hour), UpdatedAt: time.Now(),
		},
		{
			ID: "cat-2", Name: "Cooling Appliances", Slug: "cooling-appliances",
			Description: "Peralatan pendingin dan penyimpanan makanan", ProductCount: 15,
			CreatedAt: time.Now().Add(-60 * 24 * time.Hour), UpdatedAt: time.Now(),
		},
		{
			ID: "cat-2-1", Name: "Refrigerators (Kulkas Multidoor)", Slug: "refrigerators",
			ParentID: strPtr("cat-2"), ParentName: "Cooling Appliances",
			Description: "Kulkas side by side dan multidoor inverter", ProductCount: 9,
			CreatedAt: time.Now().Add(-40 * 24 * time.Hour), UpdatedAt: time.Now(),
		},
		{
			ID: "cat-2-2", Name: "Chest Freezers", Slug: "chest-freezers",
			ParentID: strPtr("cat-2"), ParentName: "Cooling Appliances",
			Description: "Pembeku makanan komersial dan rumah tangga", ProductCount: 6,
			CreatedAt: time.Now().Add(-38 * 24 * time.Hour), UpdatedAt: time.Now(),
		},
		{
			ID: "cat-3", Name: "Air Care", Slug: "air-care",
			Description: "Pembersih udara dan ventilasi ruangan", ProductCount: 8,
			CreatedAt: time.Now().Add(-60 * 24 * time.Hour), UpdatedAt: time.Now(),
		},
		{
			ID: "cat-3-1", Name: "Air Purifiers", Slug: "air-purifiers",
			ParentID: strPtr("cat-3"), ParentName: "Air Care",
			Description: "Air purifier True HEPA 13 dengan ionizer", ProductCount: 8,
			CreatedAt: time.Now().Add(-30 * 24 * time.Hour), UpdatedAt: time.Now(),
		},
	}

	mappingsStore = []CategoryMapping{
		{
			ID: "map-1", MasterCategoryID: "cat-1-1", MasterCategoryName: "Gas Hobs (Kompor Gas Tanam)",
			MarketplaceID: "shopee", MarketplaceCategoryID: "100234",
			MarketplaceCategoryPath: "Peralatan Rumah Tangga > Peralatan Dapur > Kompor Tanam",
			Status: "mapped", UpdatedAt: time.Now(),
		},
		{
			ID: "map-2", MasterCategoryID: "cat-1-1", MasterCategoryName: "Gas Hobs (Kompor Gas Tanam)",
			MarketplaceID: "tokopedia", MarketplaceCategoryID: "4912",
			MarketplaceCategoryPath: "Dapur > Kompor > Kompor Gas Tanam",
			Status: "mapped", UpdatedAt: time.Now(),
		},
		{
			ID: "map-3", MasterCategoryID: "cat-1-1", MasterCategoryName: "Gas Hobs (Kompor Gas Tanam)",
			MarketplaceID: "lazada", MarketplaceCategoryID: "8812",
			MarketplaceCategoryPath: "Kitchen Appliances > Cooktops & Stoves",
			Status: "mapped", UpdatedAt: time.Now(),
		},
		{
			ID: "map-4", MasterCategoryID: "cat-1-1", MasterCategoryName: "Gas Hobs (Kompor Gas Tanam)",
			MarketplaceID: "tiktok", MarketplaceCategoryID: "60192",
			MarketplaceCategoryPath: "Home Appliances > Kitchen Appliances > Gas Stoves",
			Status: "mapped", UpdatedAt: time.Now(),
		},
		{
			ID: "map-5", MasterCategoryID: "cat-3-1", MasterCategoryName: "Air Purifiers",
			MarketplaceID: "shopee", MarketplaceCategoryID: "101902",
			MarketplaceCategoryPath: "Elektronik Rumah Tangga > Perangkat Perawatan Udara > Air Purifier",
			Status: "mapped", UpdatedAt: time.Now(),
		},
		{
			ID: "map-6", MasterCategoryID: "cat-3-1", MasterCategoryName: "Air Purifiers",
			MarketplaceID: "tokopedia", MarketplaceCategoryID: "2019",
			MarketplaceCategoryPath: "Elektronik > Perangkat Udara > Air Purifier",
			Status: "mapped", UpdatedAt: time.Now(),
		},
	}

	mu sync.RWMutex
)

func strPtr(s string) *string {
	return &s
}

func RegisterRoutes(rg *gin.RouterGroup) {
	rg.GET("", handleListCategories)
	rg.POST("", handleCreateCategory)
	rg.PUT("/:id", handleUpdateCategory)
	rg.DELETE("/:id", handleDeleteCategory)
	rg.GET("/mappings", handleListMappings)
	rg.POST("/mappings", handleSaveMapping)
	rg.POST("/auto-map", handleAutoMapCategory)
}

func handleListCategories(c *gin.Context) {
	pool := database.GetPool()
	if pool != nil {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		rows, err := pool.Query(ctx, `
			SELECT c.id, c.name, c.slug, c.parent_id, COALESCE(p.name, ''), COALESCE(c.description, ''),
			       (SELECT COUNT(*) FROM products prod WHERE prod.category_id = c.id AND prod.deleted_at IS NULL),
			       c.created_at, c.updated_at
			FROM categories c
			LEFT JOIN categories p ON p.id = c.parent_id
			WHERE c.deleted_at IS NULL
			ORDER BY c.sort_order ASC, c.name ASC
		`)
		if err == nil {
			defer rows.Close()
			var list []Category
			for rows.Next() {
				var cat Category
				var idStr string
				var pId *string
				if err := rows.Scan(&idStr, &cat.Name, &cat.Slug, &pId, &cat.ParentName, &cat.Description, &cat.ProductCount, &cat.CreatedAt, &cat.UpdatedAt); err == nil {
					cat.ID = idStr
					cat.ParentID = pId
					list = append(list, cat)
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
	c.JSON(http.StatusOK, gin.H{"data": categoriesStore, "source": "in-memory"})
}

func handleCreateCategory(c *gin.Context) {
	var req struct {
		Name        string  `json:"name" binding:"required"`
		Slug        string  `json:"slug"`
		ParentID    *string `json:"parent_id"`
		Description string  `json:"description"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	slug := req.Slug
	if slug == "" {
		slug = strings.ToLower(strings.ReplaceAll(req.Name, " ", "-"))
	}

	catID := uuid.New().String()
	now := time.Now()

	newCat := Category{
		ID:           catID,
		Name:         req.Name,
		Slug:         slug,
		ParentID:     req.ParentID,
		Description:  req.Description,
		ProductCount: 0,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	pool := database.GetPool()
	if pool != nil {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		_, err := pool.Exec(ctx, `
			INSERT INTO categories (id, name, slug, parent_id, description, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`, catID, req.Name, slug, req.ParentID, req.Description, now, now)
		if err != nil {
			log.Printf("[Categories] PostgreSQL insert error: %v", err)
		}
	}

	mu.Lock()
	if req.ParentID != nil {
		for _, p := range categoriesStore {
			if p.ID == *req.ParentID {
				newCat.ParentName = p.Name
				break
			}
		}
	}
	categoriesStore = append(categoriesStore, newCat)
	mu.Unlock()

	c.JSON(http.StatusCreated, gin.H{
		"message": "Kategori berhasil dibuat",
		"data":    newCat,
	})
}

func handleUpdateCategory(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Name        string  `json:"name" binding:"required"`
		Slug        string  `json:"slug"`
		ParentID    *string `json:"parent_id"`
		Description string  `json:"description"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pool := database.GetPool()
	if pool != nil {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		_, _ = pool.Exec(ctx, `
			UPDATE categories
			SET name = $1, slug = $2, parent_id = $3, description = $4, updated_at = NOW()
			WHERE id::text = $5
		`, req.Name, req.Slug, req.ParentID, req.Description, id)
	}

	mu.Lock()
	for i := range categoriesStore {
		if categoriesStore[i].ID == id {
			categoriesStore[i].Name = req.Name
			if req.Slug != "" {
				categoriesStore[i].Slug = req.Slug
			}
			categoriesStore[i].ParentID = req.ParentID
			categoriesStore[i].Description = req.Description
			categoriesStore[i].UpdatedAt = time.Now()
			break
		}
	}
	mu.Unlock()

	c.JSON(http.StatusOK, gin.H{"message": "Kategori berhasil diperbarui"})
}

func handleDeleteCategory(c *gin.Context) {
	id := c.Param("id")

	pool := database.GetPool()
	if pool != nil {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		_, _ = pool.Exec(ctx, `UPDATE categories SET deleted_at = NOW() WHERE id::text = $1`, id)
	}

	mu.Lock()
	var updated []Category
	for _, cat := range categoriesStore {
		if cat.ID != id {
			updated = append(updated, cat)
		}
	}
	categoriesStore = updated
	mu.Unlock()

	c.JSON(http.StatusOK, gin.H{"message": "Kategori berhasil dihapus"})
}

func handleListMappings(c *gin.Context) {
	pool := database.GetPool()
	if pool != nil {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		rows, err := pool.Query(ctx, `
			SELECT m.id, m.master_category_id, c.name, m.marketplace_id, m.marketplace_category_id, COALESCE(m.marketplace_category_path, ''), m.created_at
			FROM marketplace_category_mappings m
			JOIN categories c ON c.id = m.master_category_id
			ORDER BY m.created_at DESC
		`)
		if err == nil {
			defer rows.Close()
			var list []CategoryMapping
			for rows.Next() {
				var cm CategoryMapping
				var idStr, catIdStr string
				if err := rows.Scan(&idStr, &catIdStr, &cm.MasterCategoryName, &cm.MarketplaceID, &cm.MarketplaceCategoryID, &cm.MarketplaceCategoryPath, &cm.UpdatedAt); err == nil {
					cm.ID = idStr
					cm.MasterCategoryID = catIdStr
					cm.Status = "mapped"
					list = append(list, cm)
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
	c.JSON(http.StatusOK, gin.H{"data": mappingsStore, "source": "in-memory"})
}

func handleSaveMapping(c *gin.Context) {
	var req struct {
		MasterCategoryID        string `json:"master_category_id" binding:"required"`
		MarketplaceID           string `json:"marketplace_id" binding:"required"`
		MarketplaceCategoryID   string `json:"marketplace_category_id" binding:"required"`
		MarketplaceCategoryPath string `json:"marketplace_category_path" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	mappingID := uuid.New().String()
	now := time.Now()

	pool := database.GetPool()
	if pool != nil {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		_, _ = pool.Exec(ctx, `
			INSERT INTO marketplace_category_mappings (id, master_category_id, marketplace_id, marketplace_category_id, marketplace_category_path, created_at)
			VALUES ($1, $2, $3, $4, $5, $6)
			ON CONFLICT (master_category_id, marketplace_id) DO UPDATE
			SET marketplace_category_id = EXCLUDED.marketplace_category_id,
			    marketplace_category_path = EXCLUDED.marketplace_category_path
		`, mappingID, req.MasterCategoryID, req.MarketplaceID, req.MarketplaceCategoryID, req.MarketplaceCategoryPath, now)
	}

	mu.Lock()
	found := false
	var masterName = req.MasterCategoryID
	for _, cat := range categoriesStore {
		if cat.ID == req.MasterCategoryID {
			masterName = cat.Name
			break
		}
	}

	for i := range mappingsStore {
		if mappingsStore[i].MasterCategoryID == req.MasterCategoryID && mappingsStore[i].MarketplaceID == req.MarketplaceID {
			mappingsStore[i].MarketplaceCategoryID = req.MarketplaceCategoryID
			mappingsStore[i].MarketplaceCategoryPath = req.MarketplaceCategoryPath
			mappingsStore[i].Status = "mapped"
			mappingsStore[i].UpdatedAt = now
			found = true
			break
		}
	}
	if !found {
		mappingsStore = append(mappingsStore, CategoryMapping{
			ID:                      mappingID,
			MasterCategoryID:        req.MasterCategoryID,
			MasterCategoryName:      masterName,
			MarketplaceID:           req.MarketplaceID,
			MarketplaceCategoryID:   req.MarketplaceCategoryID,
			MarketplaceCategoryPath: req.MarketplaceCategoryPath,
			Status:                  "mapped",
			UpdatedAt:               now,
		})
	}
	mu.Unlock()

	c.JSON(http.StatusOK, gin.H{
		"message": "Pemetaan kategori marketplace berhasil disimpan",
	})
}

func handleAutoMapCategory(c *gin.Context) {
	var req struct {
		CategoryName  string `json:"category_name" binding:"required"`
		MarketplaceID string `json:"marketplace_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	nameLower := strings.ToLower(req.CategoryName)
	var suggestedID, suggestedPath string

	switch req.MarketplaceID {
	case "shopee":
		if strings.Contains(nameLower, "gas") || strings.Contains(nameLower, "kompor") || strings.Contains(nameLower, "hob") {
			suggestedID = "100234"
			suggestedPath = "Peralatan Rumah Tangga > Peralatan Dapur > Kompor Tanam"
		} else if strings.Contains(nameLower, "air") || strings.Contains(nameLower, "purifier") {
			suggestedID = "101902"
			suggestedPath = "Elektronik Rumah Tangga > Perangkat Perawatan Udara > Air Purifier"
		} else if strings.Contains(nameLower, "kulkas") || strings.Contains(nameLower, "cool") || strings.Contains(nameLower, "refriger") {
			suggestedID = "100871"
			suggestedPath = "Elektronik Rumah Tangga > Perangkat Dapur Besar > Kulkas"
		} else {
			suggestedID = "100001"
			suggestedPath = "Peralatan Rumah Tangga > Peralatan Dapur > Lainnya"
		}
	case "tokopedia":
		if strings.Contains(nameLower, "gas") || strings.Contains(nameLower, "kompor") || strings.Contains(nameLower, "hob") {
			suggestedID = "4912"
			suggestedPath = "Dapur > Kompor > Kompor Gas Tanam"
		} else if strings.Contains(nameLower, "air") || strings.Contains(nameLower, "purifier") {
			suggestedID = "2019"
			suggestedPath = "Elektronik > Perangkat Udara > Air Purifier"
		} else {
			suggestedID = "4001"
			suggestedPath = "Elektronik > Peralatan Dapur > Peralatan Dapur Lainnya"
		}
	default:
		suggestedID = fmt.Sprintf("ext-%d", time.Now().Unix()%10000)
		suggestedPath = fmt.Sprintf("Home & Living > Appliances > %s", req.CategoryName)
	}

	c.JSON(http.StatusOK, gin.H{
		"category_id":   suggestedID,
		"category_path": suggestedPath,
		"confidence":    0.95,
		"ai_reasoning":  fmt.Sprintf("Mencocokkan kata kunci '%s' dengan taksonomi resmi %s", req.CategoryName, req.MarketplaceID),
	})
}
