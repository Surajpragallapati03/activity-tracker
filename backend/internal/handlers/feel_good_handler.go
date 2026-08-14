package handlers

import (
	"net/http"
	"strconv"

	"github.com/Surajpragallapati03/activity-tracker/backend/internal/middleware"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/models"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type FeelGoodHandler struct {
	service *services.FeelGoodService
	authz   *services.AuthorizationService
}

func NewFeelGoodHandler(service *services.FeelGoodService, authz *services.AuthorizationService) *FeelGoodHandler {
	return &FeelGoodHandler{service: service, authz: authz}
}

func (h *FeelGoodHandler) CreateFeelGood(c *gin.Context) {
	var req models.CreateFeelGoodRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := middleware.GetUser(c)
	if !h.authz.CanAccessActivityForIR(c.Request.Context(), user, req.IRID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	feelGood, err := h.service.CreateFeelGood(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, feelGood)
}

func (h *FeelGoodHandler) GetFeelGood(c *gin.Context) {
	id := c.Param("id")
	feelGood, err := h.service.GetFeelGood(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	user := middleware.GetUser(c)
	if !h.authz.CanAccessActivityForIR(c.Request.Context(), user, feelGood.IRID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	c.JSON(http.StatusOK, feelGood)
}

func (h *FeelGoodHandler) UpdateFeelGood(c *gin.Context) {
	id := c.Param("id")
	feelGood, err := h.service.GetFeelGood(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	user := middleware.GetUser(c)
	if !h.authz.CanAccessActivityForIR(c.Request.Context(), user, feelGood.IRID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	var req models.UpdateFeelGoodRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	feelGood, err = h.service.UpdateFeelGood(c.Request.Context(), id, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, feelGood)
}

func (h *FeelGoodHandler) DeleteFeelGood(c *gin.Context) {
	id := c.Param("id")
	feelGood, err := h.service.GetFeelGood(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	user := middleware.GetUser(c)
	if !h.authz.CanAccessActivityForIR(c.Request.Context(), user, feelGood.IRID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	err = h.service.DeleteFeelGood(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "feel good deleted"})
}

func (h *FeelGoodHandler) ListFeelGoods(c *gin.Context) {
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

	fgInviteID := c.Query("fg_invite_id")
	if fgInviteID != "" {
		feelGoods, total, err := h.service.ListFeelGoodsByFGInviteID(c.Request.Context(), fgInviteID, page, limit)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if feelGoods == nil {
			feelGoods = []models.FeelGoodResponse{}
		}
		c.JSON(http.StatusOK, gin.H{"data": feelGoods, "total": total, "page": page, "limit": limit})
		return
	}

	irID := c.Query("ir_id")
	if irID != "" {
		if !h.authz.CanAccessActivityForIR(c.Request.Context(), user, irID) {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		feelGoods, total, err := h.service.ListFeelGoodsByIRID(c.Request.Context(), irID, page, limit)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if feelGoods == nil {
			feelGoods = []models.FeelGoodResponse{}
		}
		c.JSON(http.StatusOK, gin.H{"data": feelGoods, "total": total, "page": page, "limit": limit})
		return
	}

	// For list without ir_id filter, check authorization and apply filtering
	accessibleIRs, err := h.authz.GetAccessibleIRIDs(c.Request.Context(), user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "authorization check failed"})
		return
	}

	feelGoods, total, err := h.service.ListFeelGoods(c.Request.Context(), page, limit)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Filter results based on accessible IRs (only for non-admin)
	if accessibleIRs != nil {
		filtered := []models.FeelGoodResponse{}
		accessibleMap := make(map[string]bool)
		for _, ir := range accessibleIRs {
			accessibleMap[ir] = true
		}
		for _, fg := range feelGoods {
			if accessibleMap[fg.IRID] {
				filtered = append(filtered, fg)
			}
		}
		feelGoods = filtered
	}

	if feelGoods == nil {
		feelGoods = []models.FeelGoodResponse{}
	}
	c.JSON(http.StatusOK, gin.H{"data": feelGoods, "total": total, "page": page, "limit": limit})
}
