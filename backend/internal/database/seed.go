package database

import (
	"context"
	"log"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/config"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/models"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/repository"
)

func SeedDefaultAdmin(ctx context.Context, db *pgxpool.Pool, cfg *config.Config) error {
	if cfg.DefaultAdminEmail == "" {
		return nil
	}

	log.Println("Checking default admin...")

	userRepo := repository.NewUserRepository(db)

	existingUser, err := userRepo.GetByEmail(ctx, cfg.DefaultAdminEmail)
	if err != nil {
		return err
	}

	if existingUser != nil {
		log.Println("Default admin already exists.")
		return nil
	}

	user := &models.User{
		ID:     uuid.New(),
		IRID:   cfg.DefaultAdminIRID,
		Name:   cfg.DefaultAdminName,
		Email:  cfg.DefaultAdminEmail,
		Phone:  cfg.DefaultAdminPhone,
		Role:   "admin",
		Status: "active",
	}

	if err := userRepo.Create(ctx, user); err != nil {
		return err
	}

	log.Println("Default admin created successfully.")
	return nil
}
