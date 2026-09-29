package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/handlers"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/repository"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/services"
)

func SetupInviteRoutes(r gin.IRouter, db *pgxpool.Pool, authzService *services.AuthorizationService) {
	infoRepo := repository.NewInfoRepository(db)
	inviteRepo := repository.NewInviteRepository(db)
	inviteService := services.NewInviteService(inviteRepo, infoRepo)
	handler := handlers.NewInviteHandler(inviteService, authzService, db)

	invites := r.Group("/invites")
	{
		invites.POST("", handler.CreateInvite)
		invites.POST("/create-with-dkd", handler.CreateInviteWithDKD)
		invites.GET("", handler.ListInvites)
		invites.GET("/:id", handler.GetInvite)
		invites.PUT("/:id", handler.UpdateInvite)
		invites.DELETE("/:id", handler.DeleteInvite)
	}
}
