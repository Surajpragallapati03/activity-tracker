package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/handlers"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/repository"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/services"
)

func SetupClosingRoutes(r gin.IRouter, db *pgxpool.Pool, authzService *services.AuthorizationService) {
	closingRepo := repository.NewClosingRepository(db)
	planRepo := repository.NewPlanRepository(db)
	closingService := services.NewClosingService(closingRepo, planRepo)
	handler := handlers.NewClosingHandler(closingService, authzService)

	closings := r.Group("/closings")
	{
		closings.POST("", handler.CreateClosing)
		closings.GET("", handler.ListClosings)
		closings.GET("/:id", handler.GetClosing)
		closings.PUT("/:id", handler.UpdateClosing)
		closings.DELETE("/:id", handler.DeleteClosing)
	}
}
