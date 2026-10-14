package ai

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

var service = NewAIService()

func RegisterRoutes(rg *gin.RouterGroup) {
	rg.POST("/generate", handleGenerate)
}

func handleGenerate(c *gin.Context) {
	var req AIRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	if req.ProductName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "product_name is required"})
		return
	}

	resp, err := service.GenerateContent(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI generation failed: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": resp,
	})
}
