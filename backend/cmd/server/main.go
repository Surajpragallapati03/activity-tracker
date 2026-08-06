package main

import (
	"context"
	"log"

	"github.com/Surajpragallapati03/activity-tracker/backend/internal/config"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/database"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/routes"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	ctx := context.Background()
	db, err := database.New(ctx, cfg.DatabaseURL())
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := database.RunMigrations(cfg.DatabaseURL()); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	router := gin.Default()
	_ = router.SetTrustedProxies(nil)
	routes.Setup(router, db)

	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
