package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type LoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type UserResponse struct {
	ID       string `json:"id"`
	Email    string `json:"email"`
	Name     string `json:"name"`
	Role     string `json:"role"`
	Avatar   string `json:"avatar"`
	Token    string `json:"token"`
}

func RegisterRoutes(rg *gin.RouterGroup) {
	rg.POST("/login", handleLogin)
	rg.GET("/me", handleMe)
}

func handleLogin(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	role := "content_manager"
	name := "Content Manager"
	if req.Email == "admin@example.com" || req.Email == "ryantriananda@gmail.com" {
		role = "admin"
		name = "Ryan Ananda (Admin)"
	}

	c.JSON(http.StatusOK, gin.H{
		"token": "demo-admin-token",
		"user": UserResponse{
			ID:     "usr-1",
			Email:  req.Email,
			Name:   name,
			Role:   role,
			Avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop",
			Token:  "demo-admin-token",
		},
	})
}

func handleMe(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"user": UserResponse{
			ID:     "usr-1",
			Email:  "admin@example.com",
			Name:   "Ryan Ananda",
			Role:   "admin",
			Avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop",
		},
	})
}
