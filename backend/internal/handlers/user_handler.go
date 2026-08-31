package handlers

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/middleware"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/models"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/services"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/utils"
)

type UserHandler struct {
	service *services.UserService
	authz   *services.AuthorizationService
}

func NewUserHandler(service *services.UserService, authz *services.AuthorizationService) *UserHandler {
	return &UserHandler{service: service, authz: authz}
}

func (h *UserHandler) CreateUser(c *gin.Context) {
	currentUser := GetCurrentUser(c)

	var req models.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Admin can create users and optionally specify upline
	// Non-admin users can create users and must set upline to themselves
	if currentUser.Role == "admin" {
		// Admin can optionally specify upline_id, defaults to no upline
	} else {
		// Non-admin can only create users under themselves
		req.UplineID = &currentUser.ID
	}

	user, err := h.service.CreateUserWithPromotion(c.Request.Context(), currentUser, &req)
	if err != nil {
		if isUniqueConstraintError(err) {
			c.JSON(http.StatusConflict, gin.H{"error": "User with this email, phone, or ir_id already exists"})
			return
		}
		if strings.Contains(err.Error(), "forbidden") {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, user)
}

func (h *UserHandler) GetUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	user, err := h.service.GetUserByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	currentUser := GetCurrentUser(c)
	if !h.authz.CanAccessUser(c.Request.Context(), currentUser, user) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) UpdateUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	targetUser, err := h.service.GetUserByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if targetUser == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	currentUser := GetCurrentUser(c)
	if !h.authz.CanAccessUser(c.Request.Context(), currentUser, targetUser) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	var req models.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Non-admin users cannot change upline_id of their downlines
	if currentUser.Role != "admin" && req.UplineID != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden: non-admin users cannot change upline"})
		return
	}

	user, err := h.service.UpdateUser(c.Request.Context(), id, &req)
	if err != nil {
		if strings.Contains(err.Error(), "user not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		if isUniqueConstraintError(err) {
			c.JSON(http.StatusConflict, gin.H{"error": "User with this email, phone, or ir_id already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) DeleteUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	targetUser, err := h.service.GetUserByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if targetUser == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	currentUser := GetCurrentUser(c)

	// Only admin can delete users
	if currentUser.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only admin can delete users"})
		return
	}

	// Users cannot delete themselves
	if currentUser.ID == targetUser.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Users cannot delete themselves"})
		return
	}

	err = h.service.DeleteUser(c.Request.Context(), id)
	if err != nil {
		if strings.Contains(err.Error(), "user not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *UserHandler) ListUsers(c *gin.Context) {
	var query models.ListUsersQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if query.Page == 0 {
		query.Page = 1
	}
	if query.Limit == 0 {
		query.Limit = 20
	}
	if query.Limit > 100 {
		query.Limit = 100
	}

	currentUser := GetCurrentUser(c)

	// Admin can see all users, non-admin can only see themselves and downlines
	if currentUser.Role != "admin" {
		// For non-admin, filter to show only accessible users
		// For now, we'll get all and filter in memory (max 50 users)
		resp, err := h.service.ListUsers(c.Request.Context(), &models.ListUsersQuery{Page: 1, Limit: 1000})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Filter to only include users that current user can access
		filtered := []models.User{*currentUser}
		downlineMap := make(map[uuid.UUID]bool)
		buildDownlineMap(currentUser.ID, resp.Data, downlineMap)

		for _, user := range resp.Data {
			if user.ID != currentUser.ID && downlineMap[user.ID] {
				filtered = append(filtered, user)
			}
		}

		// Recalculate total after filtering
		total := int64(len(filtered))
		offset := (query.Page - 1) * query.Limit
		end := offset + query.Limit
		if offset >= len(filtered) {
			filtered = []models.User{}
		} else if end >= len(filtered) {
			filtered = filtered[offset:]
		} else {
			filtered = filtered[offset:end]
		}

		c.JSON(http.StatusOK, models.ListUsersResponse{
			Data:  filtered,
			Total: total,
			Page:  query.Page,
			Limit: query.Limit,
		})
		return
	}

	resp, err := h.service.ListUsers(c.Request.Context(), &query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required"`
}

type SetPasswordRequest struct {
	NewPassword string `json:"new_password" binding:"required"`
}

func (h *UserHandler) ChangePassword(c *gin.Context) {
	user := GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing current_password or new_password"})
		return
	}

	if user.PasswordHash == nil || *user.PasswordHash == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user does not have a password"})
		return
	}

	if !utils.VerifyPassword(*user.PasswordHash, req.CurrentPassword) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "current password is incorrect"})
		return
	}

	hash, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	updateReq := &models.UpdateUserRequest{
		Password: hash,
	}

	_, err = h.service.UpdateUser(c.Request.Context(), user.ID, updateReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "password updated"})
}

func (h *UserHandler) SetPassword(c *gin.Context) {
	user := GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req SetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing new_password"})
		return
	}

	if user.PasswordHash != nil && *user.PasswordHash != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user already has a password"})
		return
	}

	hash, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	updateReq := &models.UpdateUserRequest{
		Password: hash,
	}

	_, err = h.service.UpdateUser(c.Request.Context(), user.ID, updateReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to set password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "password set"})
}

func buildDownlineMap(userID uuid.UUID, allUsers []models.User, downlineMap map[uuid.UUID]bool) {
	for _, user := range allUsers {
		if user.UplineID != nil && *user.UplineID == userID {
			downlineMap[user.ID] = true
			buildDownlineMap(user.ID, allUsers, downlineMap)
		}
	}
}

func GetCurrentUser(c *gin.Context) *models.User {
	return middleware.GetUser(c)
}

func isUniqueConstraintError(err error) bool {
	if err == nil {
		return false
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return true
	}
	return strings.Contains(err.Error(), "duplicate key value violates unique constraint")
}
