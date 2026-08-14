package database

import (
	"fmt"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func RunMigrations(databaseURL string) (bool, error) {
	m, err := migrate.New("file://migrations", databaseURL)
	if err != nil {
		return false, fmt.Errorf("failed to create migrate instance: %w", err)
	}
	defer m.Close()

	err = m.Up()
	if err == migrate.ErrNoChange {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("failed to run migrations: %w", err)
	}

	return true, nil
}
