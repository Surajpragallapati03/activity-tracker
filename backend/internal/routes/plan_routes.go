package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/handlers"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/repository"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/services"
)

func SetupPlanRoutes(r gin.IRouter, db *pgxpool.Pool, authzService *services.AuthorizationService) {
	inviteRepo := repository.NewInviteRepository(db)
	planRepo := repository.NewPlanRepository(db)
	userRepo := repository.NewUserRepository(db)
	planService := services.NewPlanService(planRepo, inviteRepo, userRepo)
	handler := handlers.NewPlanHandler(planService, authzService)

	plans := r.Group("/plans")
	{
		plans.POST("", handler.CreatePlan)
		plans.GET("", handler.ListPlans)
		plans.GET("/:id", handler.GetPlan)
		plans.PUT("/:id", handler.UpdatePlan)
		plans.DELETE("/:id", handler.DeletePlan)
	}
}
