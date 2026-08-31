package handlers

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/url"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/services"
)

type AuthHandler struct {
	service *services.AuthService
}

func NewAuthHandler(service *services.AuthService) *AuthHandler {
	return &AuthHandler{service: service}
}

func (h *AuthHandler) Login(c *gin.Context) {
	state := generateRandomState(32)
	c.SetCookie("oauth_state", state, 3600, "/", "", false, true)

	loginURL := h.service.GetLoginURL(state)
	c.Redirect(http.StatusFound, loginURL)
}

func (h *AuthHandler) Callback(c *gin.Context) {
	code := c.Query("code")
	state := c.Query("state")

	if code == "" || state == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing code or state"})
		return
	}

	stateCookie, err := c.Cookie("oauth_state")
	if err != nil || stateCookie != state {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid state"})
		return
	}

	user, tokens, err := h.service.HandleCallback(c.Request.Context(), code)
	if err != nil {
		if strings.Contains(err.Error(), "user not found") {
			c.JSON(http.StatusForbidden, gin.H{"error": "user not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	userData := gin.H{
		"id":            user.ID,
		"ir_id":         user.IRID,
		"name":          user.Name,
		"email":         user.Email,
		"role":          user.Role,
		"status":        user.Status,
		"upline_id":     user.UplineID,
		"plans_shown":   user.PlansShown,
		"drs_hit":       user.DrsHit,
		"picture_url":   user.PictureURL,
	}

	userJSON, err := json.Marshal(userData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to encode user"})
		return
	}

	redirectURL := h.service.Config().FrontendURL + "?" + url.Values{
		"access_token":  {tokens.AccessToken},
		"refresh_token": {tokens.RefreshToken},
		"user":          {string(userJSON)},
	}.Encode()

	c.Redirect(http.StatusFound, redirectURL)
}

type LoginRequest struct {
	IRID     string `json:"ir_id" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

func (h *AuthHandler) LoginPassword(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing ir_id or password"})
		return
	}

	user, tokens, err := h.service.LoginWithPassword(c.Request.Context(), req.IRID, req.Password)
	if err != nil {
		if strings.Contains(err.Error(), "inactive user") {
			c.JSON(http.StatusForbidden, gin.H{"error": "inactive user"})
			return
		}
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	userData := gin.H{
		"id":            user.ID,
		"ir_id":         user.IRID,
		"name":          user.Name,
		"email":         user.Email,
		"role":          user.Role,
		"status":        user.Status,
		"upline_id":     user.UplineID,
		"plans_shown":   user.PlansShown,
		"drs_hit":       user.DrsHit,
		"picture_url":   user.PictureURL,
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token":  tokens.AccessToken,
		"refresh_token": tokens.RefreshToken,
		"token_type":    tokens.TokenType,
		"user":          userData,
	})
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing token"})
		return
	}

	accessToken, err := h.service.RefreshAccessToken(c.Request.Context(), req.RefreshToken)
	if err != nil {
		if strings.Contains(err.Error(), "inactive user") {
			c.JSON(http.StatusForbidden, gin.H{"error": "inactive user"})
			return
		}
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token": accessToken,
		"token_type":   "Bearer",
	})
}

func generateRandomState(length int) string {
	b := make([]byte, length)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}
