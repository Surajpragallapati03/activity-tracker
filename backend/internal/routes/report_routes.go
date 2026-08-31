package routes

import (
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/handlers"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/repository"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func SetupReportRoutes(r *gin.RouterGroup, db *pgxpool.Pool, authz *services.AuthorizationService) {
	reportRepo := repository.NewReportRepository(db)
	userRepo := repository.NewUserRepository(db)
	reportService := services.NewReportService(reportRepo, userRepo, authz)
	reportHandler := handlers.NewReportHandler(reportService)

	reportGroup := r.Group("/reports")
	{
		reportGroup.POST("/individual", reportHandler.GetIndividualReport)
		reportGroup.POST("/team", reportHandler.GetTeamReport)
		reportGroup.POST("/individual/export/:format", reportHandler.ExportIndividualReport)
		reportGroup.POST("/team/export/:format", reportHandler.ExportTeamReport)
	}
}
