package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/Surajpragallapati03/activity-tracker/backend/internal/middleware"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/models"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/services"
)

type InfoHandler struct {
	service *services.InfoService
	authz   *services.AuthorizationService
}

func NewInfoHandler(service *services.InfoService, authz *services.AuthorizationService) *InfoHandler {
	return &InfoHandler{service: service, authz: authz}
}

func (h *InfoHandler) CreateInfo(c *gin.Context) {
	var req models.CreateInfoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := middleware.GetUser(c)
	if !h.authz.CanAccessActivityForIR(c.Request.Context(), user, req.IRID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	info, err := h.service.CreateInfo(c.Request.Context(), &req)
	if err != nil {
		if isUniqueConstraintError(err) {
			c.JSON(http.StatusConflict, gin.H{"error": "Phone number already exists"})
			return
		}
		if strings.Contains(err.Error(), "user not found") || strings.Contains(err.Error(), "invalid created_by") {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, info)
}

func (h *InfoHandler) GetInfo(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid info ID"})
		return
	}

	info, err := h.service.GetInfoByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if info == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Info not found"})
		return
	}

	user := middleware.GetUser(c)
	if !h.authz.CanAccessActivityForIR(c.Request.Context(), user, info.IRID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	c.JSON(http.StatusOK, info)
}

func (h *InfoHandler) UpdateInfo(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid info ID"})
		return
	}

	info, err := h.service.GetInfoByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if info == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Info not found"})
		return
	}

	user := middleware.GetUser(c)
	if !h.authz.CanAccessActivityForIR(c.Request.Context(), user, info.IRID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	var req models.UpdateInfoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	info, err = h.service.UpdateInfo(c.Request.Context(), id, &req)
	if err != nil {
		if strings.Contains(err.Error(), "info not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": "Info not found"})
			return
		}
		if isUniqueConstraintError(err) {
			c.JSON(http.StatusConflict, gin.H{"error": "Phone number already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, info)
}

func (h *InfoHandler) DeleteInfo(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid info ID"})
		return
	}

	info, err := h.service.GetInfoByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if info == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Info not found"})
		return
	}

	user := middleware.GetUser(c)
	if !h.authz.CanAccessActivityForIR(c.Request.Context(), user, info.IRID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	err = h.service.DeleteInfo(c.Request.Context(), id)
	if err != nil {
		if strings.Contains(err.Error(), "info not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": "Info not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *InfoHandler) ListInfos(c *gin.Context) {
	var query models.ListInfosQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if query.Page == 0 {
		query.Page = 1
	}
	if query.Limit == 0 {
		query.Limit = 10
	}
	if query.Limit > 100 {
		query.Limit = 100
	}

	resp, err := h.service.ListInfos(c.Request.Context(), &query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}
