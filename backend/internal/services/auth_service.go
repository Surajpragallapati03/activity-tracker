package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"

	"github.com/Surajpragallapati03/activity-tracker/backend/internal/config"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/models"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/repository"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/utils"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

type AuthService struct {
	config         *config.Config
	oauthConfig    *oauth2.Config
	userRepository *repository.UserRepository
	tokenService   *TokenService
}

type GoogleTokenClaims struct {
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

func NewAuthService(cfg *config.Config, userRepo *repository.UserRepository, tokenService *TokenService) *AuthService {
	oauthConfig := &oauth2.Config{
		ClientID:     cfg.GoogleClientID,
		ClientSecret: cfg.GoogleClientSecret,
		RedirectURL:  cfg.GoogleRedirectURL,
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}

	return &AuthService{
		config:         cfg,
		oauthConfig:    oauthConfig,
		userRepository: userRepo,
		tokenService:   tokenService,
	}
}

func (s *AuthService) Config() *config.Config {
	return s.config
}

func (s *AuthService) GetLoginURL(state string) string {
	return s.oauthConfig.AuthCodeURL(state)
}

type GoogleIDToken struct {
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

func (s *AuthService) HandleCallback(ctx context.Context, code string) (*models.User, *Tokens, error) {
	token, err := s.oauthConfig.Exchange(ctx, code)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to exchange token: %w", err)
	}

	claims, err := s.getGoogleIDTokenClaims(ctx, token.AccessToken)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get token claims: %w", err)
	}

	user, err := s.userRepository.GetByEmail(ctx, claims.Email)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to lookup user: %w", err)
	}

	if user == nil {
		return nil, nil, fmt.Errorf("user not found")
	}

	if claims.Picture != "" {
		user.PictureURL = &claims.Picture
	}

	tokens, err := s.tokenService.GenerateTokens(user.ID, user.Email, user.Role)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	return user, tokens, nil
}

func (s *AuthService) LoginWithPassword(ctx context.Context, irID, password string) (*models.User, *Tokens, error) {
	user, err := s.userRepository.GetByIRID(ctx, irID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to lookup user: %w", err)
	}

	if user == nil || user.PasswordHash == nil {
		return nil, nil, fmt.Errorf("invalid credentials")
	}

	if !utils.VerifyPassword(*user.PasswordHash, password) {
		return nil, nil, fmt.Errorf("invalid credentials")
	}

	if user.Status != "active" {
		return nil, nil, fmt.Errorf("inactive user")
	}

	tokens, err := s.tokenService.GenerateTokens(user.ID, user.Email, user.Role)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	return user, tokens, nil
}

func (s *AuthService) RefreshAccessToken(ctx context.Context, refreshToken string) (string, error) {
	claims, err := s.tokenService.ValidateRefreshToken(refreshToken)
	if err != nil {
		return "", fmt.Errorf("invalid token: %w", err)
	}

	if claims.Type != "refresh" {
		return "", fmt.Errorf("invalid token: wrong token type")
	}

	user, err := s.userRepository.GetByID(ctx, claims.UserID)
	if err != nil {
		return "", fmt.Errorf("failed to lookup user: %w", err)
	}

	if user == nil {
		return "", fmt.Errorf("user not found")
	}

	if user.Status != "active" {
		return "", fmt.Errorf("inactive user")
	}

	accessToken, err := s.tokenService.GenerateAccessToken(user.ID, user.Email, user.Role)
	if err != nil {
		return "", fmt.Errorf("failed to generate access token: %w", err)
	}

	return accessToken, nil
}

func (s *AuthService) getGoogleIDTokenClaims(ctx context.Context, accessToken string) (*GoogleIDToken, error) {
	resp, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + url.QueryEscape(accessToken))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// Parse the response
	var claims GoogleIDToken
	err = parseJSONResponse(body, &claims)
	if err != nil {
		return nil, err
	}

	return &claims, nil
}

func parseJSONResponse(data []byte, v interface{}) error {
	return json.Unmarshal(data, v)
}
