package handlers

import (
	"net/http"
	"strconv"

	"github.com/Surajpragallapati03/activity-tracker/backend/internal/middleware"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/models"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type FGInviteHandler struct {
	service *services.FGInviteService
	authz   *services.AuthorizationService
}

func NewFGInviteHandler(service *services.FGInviteService, authz *services.AuthorizationService) *FGInviteHandler {
	return &FGInviteHandler{service: service, authz: authz}
}

func (h *FGInviteHandler) CreateFGInvite(c *gin.Context) {
	var req models.CreateFGInviteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := middleware.GetUser(c)
	if !h.authz.CanAccessActivityForIR(c.Request.Context(), user, req.IRID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	fgInvite, err := h.service.CreateFGInvite(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, fgInvite)
}

func (h *FGInviteHandler) GetFGInvite(c *gin.Context) {
	id := c.Param("id")
	fgInvite, err := h.service.GetFGInvite(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	user := middleware.GetUser(c)
	if !h.authz.CanAccessActivityForIR(c.Request.Context(), user, fgInvite.IRID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	c.JSON(http.StatusOK, fgInvite)
}

func (h *FGInviteHandler) UpdateFGInvite(c *gin.Context) {
	id := c.Param("id")
	fgInvite, err := h.service.GetFGInvite(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	user := middleware.GetUser(c)
	if !h.authz.CanAccessActivityForIR(c.Request.Context(), user, fgInvite.IRID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	var req models.UpdateFGInviteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fgInvite, err = h.service.UpdateFGInvite(c.Request.Context(), id, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, fgInvite)
}

func (h *FGInviteHandler) DeleteFGInvite(c *gin.Context) {
	id := c.Param("id")
	fgInvite, err := h.service.GetFGInvite(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	user := middleware.GetUser(c)
	if !h.authz.CanAccessActivityForIR(c.Request.Context(), user, fgInvite.IRID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	err = h.service.DeleteFGInvite(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "fg invite deleted"})
}

func (h *FGInviteHandler) ListFGInvites(c *gin.Context) {
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

	closingID := c.Query("closing_id")
	if closingID != "" {
		fgInvites, total, err := h.service.ListFGInvitesByClosingID(c.Request.Context(), closingID, page, limit)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if fgInvites == nil {
			fgInvites = []models.FGInviteResponse{}
		}
		c.JSON(http.StatusOK, gin.H{"data": fgInvites, "total": total, "page": page, "limit": limit})
		return
	}

	irID := c.Query("ir_id")
	if irID != "" {
		if !h.authz.CanAccessActivityForIR(c.Request.Context(), user, irID) {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		fgInvites, total, err := h.service.ListFGInvitesByIRID(c.Request.Context(), irID, page, limit)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if fgInvites == nil {
			fgInvites = []models.FGInviteResponse{}
		}
		c.JSON(http.StatusOK, gin.H{"data": fgInvites, "total": total, "page": page, "limit": limit})
		return
	}

	// For list without ir_id filter, check authorization and apply filtering
	accessibleIRs, err := h.authz.GetAccessibleIRIDs(c.Request.Context(), user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "authorization check failed"})
		return
	}

	fgInvites, total, err := h.service.ListFGInvites(c.Request.Context(), page, limit)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Filter results based on accessible IRs (only for non-admin)
	if accessibleIRs != nil {
		filtered := []models.FGInviteResponse{}
		accessibleMap := make(map[string]bool)
		for _, ir := range accessibleIRs {
			accessibleMap[ir] = true
		}
		for _, fgInvite := range fgInvites {
			if accessibleMap[fgInvite.IRID] {
				filtered = append(filtered, fgInvite)
			}
		}
		fgInvites = filtered
	}

	if fgInvites == nil {
		fgInvites = []models.FGInviteResponse{}
	}
	c.JSON(http.StatusOK, gin.H{"data": fgInvites, "total": total, "page": page, "limit": limit})
}
