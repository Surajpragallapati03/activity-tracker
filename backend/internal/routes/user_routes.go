package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/handlers"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/repository"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/services"
)

func SetupUserRoutes(r *gin.Engine, db *pgxpool.Pool) {
	repo := repository.NewUserRepository(db)
	service := services.NewUserService(repo)
	handler := handlers.NewUserHandler(service)

	users := r.Group("/users")
	{
		users.POST("", handler.CreateUser)
		users.GET("", handler.ListUsers)
		users.GET("/:id", handler.GetUser)
		users.PUT("/:id", handler.UpdateUser)
		users.DELETE("/:id", handler.DeleteUser)
	}
}
