package config

import (
	"fmt"
	"os"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost             string
	DBPort             string
	DBUser             string
	DBPassword         string
	DBName             string
	Port               string
	Env                string
	DefaultAdminName   string
	DefaultAdminEmail  string
	DefaultAdminIRID   string
	DefaultAdminPhone  string
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string
	FrontendURL        string
	JWTAccessSecret    string
	JWTRefreshSecret   string
	JWTAccessExpiry    time.Duration
	JWTRefreshExpiry   time.Duration
}

func Load() (*Config, error) {
	godotenv.Load()

	accessExpiry, _ := time.ParseDuration(getEnv("JWT_ACCESS_EXPIRY", "15m"))
	refreshExpiry, _ := time.ParseDuration(getEnv("JWT_REFRESH_EXPIRY", "168h"))

	cfg := &Config{
		DBHost:             getEnv("DB_HOST", "localhost"),
		DBPort:             getEnv("DB_PORT", "5432"),
		DBUser:             getEnv("DB_USER", "postgres"),
		DBPassword:         getEnv("DB_PASSWORD", "postgres"),
		DBName:             getEnv("DB_NAME", "activity_tracker"),
		Port:               getEnv("PORT", "8080"),
		Env:                getEnv("ENV", "development"),
		DefaultAdminName:   getEnv("DEFAULT_ADMIN_NAME", ""),
		DefaultAdminEmail:  getEnv("DEFAULT_ADMIN_EMAIL", ""),
		DefaultAdminIRID:   getEnv("DEFAULT_ADMIN_IR_ID", ""),
		DefaultAdminPhone:  getEnv("DEFAULT_ADMIN_PHONE", ""),
		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURL:  getEnv("GOOGLE_REDIRECT_URL", ""),
		FrontendURL:        getEnv("FRONTEND_URL", "http://localhost:5173"),
		JWTAccessSecret:    getEnv("JWT_ACCESS_SECRET", ""),
		JWTRefreshSecret:   getEnv("JWT_REFRESH_SECRET", ""),
		JWTAccessExpiry:    accessExpiry,
		JWTRefreshExpiry:   refreshExpiry,
	}

	return cfg, nil
}

func (c *Config) DatabaseURL() string {
	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		c.DBUser,
		c.DBPassword,
		c.DBHost,
		c.DBPort,
		c.DBName,
	)
}

func getEnv(key, defaultVal string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultVal
}
