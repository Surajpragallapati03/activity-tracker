package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/handlers"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/repository"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/services"
)

func SetupDailyUpdateRoutes(r *gin.RouterGroup, db *pgxpool.Pool, authz *services.AuthorizationService) {
	dailyUpdateRepo := repository.NewDailyUpdateRepository(db)
	dailyUpdateService := services.NewDailyUpdateService(db, dailyUpdateRepo)
	handler := handlers.NewDailyUpdateHandler(dailyUpdateService, authz, dailyUpdateRepo)

	r.GET("/daily-updates", handler.GetDailyUpdate)
	r.POST("/daily-updates", handler.SaveDailyUpdate)
}
