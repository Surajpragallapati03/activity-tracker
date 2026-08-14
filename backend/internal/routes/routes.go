package routes

import (
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/config"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/handlers"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/middleware"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/repository"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func Setup(r *gin.Engine, db *pgxpool.Pool, cfg *config.Config) {
	r.GET("/health", handlers.Health)
	SetupAuthRoutes(r, db, cfg)

	tokenService := services.NewTokenService(cfg.JWTAccessSecret, cfg.JWTRefreshSecret, cfg.JWTAccessExpiry, cfg.JWTRefreshExpiry)
	userRepo := repository.NewUserRepository(db)
	authzService := services.NewAuthorizationService(userRepo)
	protected := r.Group("", middleware.JWT(tokenService, userRepo))

	SetupUserRoutes(protected, db, authzService)
	SetupInfoRoutes(protected, db, authzService)
	SetupInviteRoutes(protected, db, authzService)
	SetupPlanRoutes(protected, db, authzService)
	SetupClosingRoutes(protected, db, authzService)
	SetupFGInviteRoutes(protected, db, authzService)
	SetupFeelGoodRoutes(protected, db, authzService)
}
