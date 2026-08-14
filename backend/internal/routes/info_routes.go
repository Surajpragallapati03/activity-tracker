package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/handlers"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/repository"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/services"
)

func SetupInfoRoutes(r gin.IRouter, db *pgxpool.Pool, authzService *services.AuthorizationService) {
	userRepo := repository.NewUserRepository(db)
	infoRepo := repository.NewInfoRepository(db)
	infoService := services.NewInfoService(infoRepo, userRepo)
	handler := handlers.NewInfoHandler(infoService, authzService)

	infos := r.Group("/infos")
	{
		infos.POST("", handler.CreateInfo)
		infos.GET("", handler.ListInfos)
		infos.GET("/:id", handler.GetInfo)
		infos.PUT("/:id", handler.UpdateInfo)
		infos.DELETE("/:id", handler.DeleteInfo)
	}
}
