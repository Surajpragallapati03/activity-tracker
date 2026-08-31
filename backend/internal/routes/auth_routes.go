package routes

import (
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/config"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/handlers"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/repository"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func SetupAuthRoutes(r *gin.Engine, db *pgxpool.Pool, cfg *config.Config) {
	userRepo := repository.NewUserRepository(db)
	tokenService := services.NewTokenService(cfg.JWTAccessSecret, cfg.JWTRefreshSecret, cfg.JWTAccessExpiry, cfg.JWTRefreshExpiry)
	authService := services.NewAuthService(cfg, userRepo, tokenService)
	authHandler := handlers.NewAuthHandler(authService)

	authGroup := r.Group("/auth")
	{
		authGroup.GET("/login", authHandler.Login)
		authGroup.POST("/login", authHandler.LoginPassword)
		authGroup.GET("/callback", authHandler.Callback)
		authGroup.POST("/refresh", authHandler.Refresh)
	}
}
