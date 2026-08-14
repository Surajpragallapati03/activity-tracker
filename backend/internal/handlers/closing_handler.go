package handlers

import (
	"net/http"
	"strconv"

	"github.com/Surajpragallapati03/activity-tracker/backend/internal/middleware"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/models"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type ClosingHandler struct {
	service *services.ClosingService
	authz   *services.AuthorizationService
}

func NewClosingHandler(service *services.ClosingService, authz *services.AuthorizationService) *ClosingHandler {
	return &ClosingHandler{service: service, authz: authz}
}

func (h *ClosingHandler) CreateClosing(c *gin.Context) {
	var req models.CreateClosingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := middleware.GetUser(c)
	if !h.authz.CanAccessActivityForIR(c.Request.Context(), user, req.IRID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	closing, err := h.service.CreateClosing(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, closing)
}

func (h *ClosingHandler) GetClosing(c *gin.Context) {
	id := c.Param("id")
	closing, err := h.service.GetClosing(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	user := middleware.GetUser(c)
	if !h.authz.CanAccessActivityForIR(c.Request.Context(), user, closing.IRID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	c.JSON(http.StatusOK, closing)
}

func (h *ClosingHandler) UpdateClosing(c *gin.Context) {
	id := c.Param("id")
	closing, err := h.service.GetClosing(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	user := middleware.GetUser(c)
	if !h.authz.CanAccessActivityForIR(c.Request.Context(), user, closing.IRID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	var req models.UpdateClosingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	closing, err = h.service.UpdateClosing(c.Request.Context(), id, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, closing)
}

func (h *ClosingHandler) DeleteClosing(c *gin.Context) {
	id := c.Param("id")
	closing, err := h.service.GetClosing(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	user := middleware.GetUser(c)
	if !h.authz.CanAccessActivityForIR(c.Request.Context(), user, closing.IRID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	err = h.service.DeleteClosing(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "closing deleted"})
}

func (h *ClosingHandler) ListClosings(c *gin.Context) {
	page := 1
	limit := 20

	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}

	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	user := middleware.GetUser(c)
	irID := c.Query("ir_id")
	if irID != "" {
		if !h.authz.CanAccessActivityForIR(c.Request.Context(), user, irID) {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		closings, total, err := h.service.ListClosingsByIRID(c.Request.Context(), irID, page, limit)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if closings == nil {
			closings = []models.ClosingResponse{}
		}
		c.JSON(http.StatusOK, gin.H{"data": closings, "total": total, "page": page, "limit": limit})
		return
	}

	// For list without ir_id filter, check authorization and apply filtering
	accessibleIRs, err := h.authz.GetAccessibleIRIDs(c.Request.Context(), user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "authorization check failed"})
		return
	}

	closings, total, err := h.service.ListClosings(c.Request.Context(), page, limit)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Filter results based on accessible IRs (only for non-admin)
	if accessibleIRs != nil {
		filtered := []models.ClosingResponse{}
		accessibleMap := make(map[string]bool)
		for _, ir := range accessibleIRs {
			accessibleMap[ir] = true
		}
		for _, closing := range closings {
			if accessibleMap[closing.IRID] {
				filtered = append(filtered, closing)
			}
		}
		closings = filtered
		// Note: total count is approximate after filtering, accurate count would require filtering in DB
	}

	if closings == nil {
		closings = []models.ClosingResponse{}
	}
	c.JSON(http.StatusOK, gin.H{"data": closings, "total": total, "page": page, "limit": limit})
}
