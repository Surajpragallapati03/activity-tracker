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

type PlanHandler struct {
	service *services.PlanService
	authz   *services.AuthorizationService
}

func NewPlanHandler(service *services.PlanService, authz *services.AuthorizationService) *PlanHandler {
	return &PlanHandler{service: service, authz: authz}
}

func (h *PlanHandler) CreatePlan(c *gin.Context) {
	var req models.CreatePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := middleware.GetUser(c)
	if !h.authz.CanAccessActivityForIR(c.Request.Context(), user, req.IRID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	plan, err := h.service.CreatePlan(c.Request.Context(), &req)
	if err != nil {
		if strings.Contains(err.Error(), "invite not found") || strings.Contains(err.Error(), "invalid invite_id") {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if isUniqueConstraintError(err) {
			c.JSON(http.StatusConflict, gin.H{"error": "A plan already exists for this invite"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, plan)
}

func (h *PlanHandler) GetPlan(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid plan ID"})
		return
	}

	plan, err := h.service.GetPlanByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if plan == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Plan not found"})
		return
	}

	user := middleware.GetUser(c)
	if !h.authz.CanAccessActivityForIR(c.Request.Context(), user, plan.IRID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	c.JSON(http.StatusOK, plan)
}

func (h *PlanHandler) UpdatePlan(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid plan ID"})
		return
	}

	plan, err := h.service.GetPlanByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if plan == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Plan not found"})
		return
	}

	user := middleware.GetUser(c)
	if !h.authz.CanAccessActivityForIR(c.Request.Context(), user, plan.IRID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	var req models.UpdatePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	plan, err = h.service.UpdatePlan(c.Request.Context(), id, &req)
	if err != nil {
		if strings.Contains(err.Error(), "plan not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": "Plan not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, plan)
}

func (h *PlanHandler) DeletePlan(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid plan ID"})
		return
	}

	plan, err := h.service.GetPlanByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if plan == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Plan not found"})
		return
	}

	user := middleware.GetUser(c)
	if !h.authz.CanAccessActivityForIR(c.Request.Context(), user, plan.IRID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	err = h.service.DeletePlan(c.Request.Context(), id)
	if err != nil {
		if strings.Contains(err.Error(), "plan not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": "Plan not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *PlanHandler) ListPlans(c *gin.Context) {
	var query models.ListPlansQuery
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

	resp, err := h.service.ListPlans(c.Request.Context(), &query)
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
			filtered := []models.Plan{}
			accessibleMap := make(map[string]bool)
			for _, ir := range accessibleIRs {
				accessibleMap[ir] = true
			}
			for _, plan := range resp.Data {
				if accessibleMap[plan.IRID] {
					filtered = append(filtered, plan)
				}
			}
			resp.Data = filtered
		}
	}

	c.JSON(http.StatusOK, resp)
}
