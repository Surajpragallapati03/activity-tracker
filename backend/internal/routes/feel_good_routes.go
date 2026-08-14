package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/handlers"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/repository"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/services"
)

func SetupFeelGoodRoutes(r gin.IRouter, db *pgxpool.Pool, authzService *services.AuthorizationService) {
	feelGoodRepo := repository.NewFeelGoodRepository(db)
	fgInviteRepo := repository.NewFGInviteRepository(db)
	feelGoodService := services.NewFeelGoodService(feelGoodRepo, fgInviteRepo)
	handler := handlers.NewFeelGoodHandler(feelGoodService, authzService)

	feelGoods := r.Group("/feel-goods")
	{
		feelGoods.POST("", handler.CreateFeelGood)
		feelGoods.GET("", handler.ListFeelGoods)
		feelGoods.GET("/:id", handler.GetFeelGood)
		feelGoods.PUT("/:id", handler.UpdateFeelGood)
		feelGoods.DELETE("/:id", handler.DeleteFeelGood)
	}
}
