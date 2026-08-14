package services

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

type TokenService struct {
	accessSecret  string
	refreshSecret string
	accessExpiry  time.Duration
	refreshExpiry time.Duration
}

type TokenClaims struct {
	UserID   uuid.UUID `json:"user_id"`
	Email    string    `json:"email"`
	Role     string    `json:"role"`
	Type     string    `json:"type"`
	IssuedAt int64     `json:"iat"`
	ExpiresAt int64    `json:"exp"`
}

type Tokens struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
}

func NewTokenService(accessSecret, refreshSecret string, accessExpiry, refreshExpiry time.Duration) *TokenService {
	return &TokenService{
		accessSecret:  accessSecret,
		refreshSecret: refreshSecret,
		accessExpiry:  accessExpiry,
		refreshExpiry: refreshExpiry,
	}
}

func (ts *TokenService) GenerateAccessToken(userID uuid.UUID, email, role string) (string, error) {
	return ts.generateToken(userID, email, role, "access", ts.accessSecret, ts.accessExpiry)
}

func (ts *TokenService) GenerateTokens(userID uuid.UUID, email, role string) (*Tokens, error) {
	accessToken, err := ts.generateToken(userID, email, role, "access", ts.accessSecret, ts.accessExpiry)
	if err != nil {
		return nil, err
	}

	refreshToken, err := ts.generateToken(userID, email, role, "refresh", ts.refreshSecret, ts.refreshExpiry)
	if err != nil {
		return nil, err
	}

	return &Tokens{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
	}, nil
}

func (ts *TokenService) generateToken(userID uuid.UUID, email, role, tokenType, secret string, expiry time.Duration) (string, error) {
	now := time.Now()
	claims := TokenClaims{
		UserID:    userID,
		Email:     email,
		Role:      role,
		Type:      tokenType,
		IssuedAt:  now.Unix(),
		ExpiresAt: now.Add(expiry).Unix(),
	}

	claimsJSON, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}

	header := map[string]string{"alg": "HS256", "typ": "JWT"}
	headerJSON, _ := json.Marshal(header)

	payload := base64.RawURLEncoding.EncodeToString(headerJSON) + "." + base64.RawURLEncoding.EncodeToString(claimsJSON)

	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(payload))
	signature := base64.RawURLEncoding.EncodeToString(h.Sum(nil))

	return payload + "." + signature, nil
}

func (ts *TokenService) ValidateToken(token, secret string) (*TokenClaims, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid token format")
	}

	payload := parts[0] + "." + parts[1]
	signature := parts[2]

	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(payload))
	expectedSignature := base64.RawURLEncoding.EncodeToString(h.Sum(nil))

	if signature != expectedSignature {
		return nil, fmt.Errorf("invalid token signature")
	}

	claimsJSON, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, fmt.Errorf("invalid token encoding")
	}

	var claims TokenClaims
	if err := json.Unmarshal(claimsJSON, &claims); err != nil {
		return nil, fmt.Errorf("invalid token claims")
	}

	if claims.ExpiresAt < time.Now().Unix() {
		return nil, fmt.Errorf("token expired")
	}

	return &claims, nil
}

func (ts *TokenService) ValidateAccessToken(token string) (*TokenClaims, error) {
	return ts.ValidateToken(token, ts.accessSecret)
}

func (ts *TokenService) ValidateRefreshToken(token string) (*TokenClaims, error) {
	return ts.ValidateToken(token, ts.refreshSecret)
}
