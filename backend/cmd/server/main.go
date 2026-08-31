package main

import (
	"context"
	"log"

	"github.com/Surajpragallapati03/activity-tracker/backend/internal/config"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/database"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/middleware"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/routes"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	ctx := context.Background()
	log.Println("Connecting to database...")
	db, err := database.New(ctx, cfg.GetDatabaseURL())
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()
	log.Println("Database connected successfully")

	log.Println("Running migrations...")
	applied, err := database.RunMigrations(cfg.GetDatabaseURL())
	if err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}
	if applied {
		log.Println("Database migrations completed successfully")
	} else {
		log.Println("Database is already up to date")
	}

	if err := database.SeedDefaultAdmin(ctx, db, cfg); err != nil {
		log.Fatalf("Failed to seed default admin: %v", err)
	}

	log.Printf("Starting HTTP server on :%s\n", cfg.Port)
	router := gin.Default()
	_ = router.SetTrustedProxies(nil)
	router.Use(middleware.CORS(cfg))
	routes.Setup(router, db, cfg)

	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
