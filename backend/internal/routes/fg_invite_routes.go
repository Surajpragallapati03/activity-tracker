package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/handlers"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/repository"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/services"
)

func SetupFGInviteRoutes(r gin.IRouter, db *pgxpool.Pool, authzService *services.AuthorizationService) {
	fgInviteRepo := repository.NewFGInviteRepository(db)
	closingRepo := repository.NewClosingRepository(db)
	fgInviteService := services.NewFGInviteService(fgInviteRepo, closingRepo)
	handler := handlers.NewFGInviteHandler(fgInviteService, authzService)

	fgInvites := r.Group("/fg-invites")
	{
		fgInvites.POST("", handler.CreateFGInvite)
		fgInvites.GET("", handler.ListFGInvites)
		fgInvites.GET("/:id", handler.GetFGInvite)
		fgInvites.PUT("/:id", handler.UpdateFGInvite)
		fgInvites.DELETE("/:id", handler.DeleteFGInvite)
	}
}
