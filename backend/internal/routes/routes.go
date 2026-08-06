package routes

import (
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/handlers"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func Setup(r *gin.Engine, db *pgxpool.Pool) {
	r.GET("/health", handlers.Health)
	SetupUserRoutes(r, db)
	SetupInfoRoutes(r, db)
}
