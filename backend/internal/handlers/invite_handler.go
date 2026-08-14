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

type InviteHandler struct {
	service *services.InviteService
	authz   *services.AuthorizationService
}

func NewInviteHandler(service *services.InviteService, authz *services.AuthorizationService) *InviteHandler {
	return &InviteHandler{service: service, authz: authz}
}

func (h *InviteHandler) CreateInvite(c *gin.Context) {
	var req models.CreateInviteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := middleware.GetUser(c)
	if !h.authz.CanAccessActivityForIR(c.Request.Context(), user, req.IRID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	invite, err := h.service.CreateInvite(c.Request.Context(), &req)
	if err != nil {
		if strings.Contains(err.Error(), "invalid mode") || strings.Contains(err.Error(), "invalid date") || strings.Contains(err.Error(), "invalid time") {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if strings.Contains(err.Error(), "info not found") || strings.Contains(err.Error(), "invalid info_id") {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if isUniqueConstraintError(err) {
			c.JSON(http.StatusConflict, gin.H{"error": "An invite already exists for this info"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, invite)
}

func (h *InviteHandler) GetInvite(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invite ID"})
		return
	}

	invite, err := h.service.GetInviteByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if invite == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invite not found"})
		return
	}

	user := middleware.GetUser(c)
	if !h.authz.CanAccessActivityForIR(c.Request.Context(), user, invite.IRID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	c.JSON(http.StatusOK, invite)
}

func (h *InviteHandler) UpdateInvite(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invite ID"})
		return
	}

	invite, err := h.service.GetInviteByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if invite == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invite not found"})
		return
	}

	user := middleware.GetUser(c)
	if !h.authz.CanAccessActivityForIR(c.Request.Context(), user, invite.IRID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	var req models.UpdateInviteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	invite, err = h.service.UpdateInvite(c.Request.Context(), id, &req)
	if err != nil {
		if strings.Contains(err.Error(), "invite not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invite not found"})
			return
		}
		if strings.Contains(err.Error(), "invalid mode") || strings.Contains(err.Error(), "invalid date") || strings.Contains(err.Error(), "invalid time") {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, invite)
}

func (h *InviteHandler) DeleteInvite(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invite ID"})
		return
	}

	invite, err := h.service.GetInviteByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if invite == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invite not found"})
		return
	}

	user := middleware.GetUser(c)
	if !h.authz.CanAccessActivityForIR(c.Request.Context(), user, invite.IRID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	err = h.service.DeleteInvite(c.Request.Context(), id)
	if err != nil {
		if strings.Contains(err.Error(), "invite not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invite not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *InviteHandler) ListInvites(c *gin.Context) {
	var query models.ListInvitesQuery
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

	user := middleware.GetUser(c)

	// If ir_id filter is specified, check authorization
	if query.IRID != "" {
		if !h.authz.CanAccessActivityForIR(c.Request.Context(), user, query.IRID) {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
	}

	resp, err := h.service.ListInvites(c.Request.Context(), &query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// If no ir_id filter, apply authorization filtering
	if query.IRID == "" {
		accessibleIRs, err := h.authz.GetAccessibleIRIDs(c.Request.Context(), user)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "authorization check failed"})
			return
		}

		// Filter results based on accessible IRs (only for non-admin)
		if accessibleIRs != nil {
			filtered := []models.InviteResponse{}
			accessibleMap := make(map[string]bool)
			for _, ir := range accessibleIRs {
				accessibleMap[ir] = true
			}
			for _, invite := range resp.Data {
				if accessibleMap[invite.IRID] {
					filtered = append(filtered, invite)
				}
			}
			resp.Data = filtered
		}
	}

	c.JSON(http.StatusOK, resp)
}
