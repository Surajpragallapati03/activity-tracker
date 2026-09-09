package handlers

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/middleware"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/models"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/repository"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/services"
)

type DailyUpdateHandler struct {
	service *services.DailyUpdateService
	authz   *services.AuthorizationService
	repo    *repository.DailyUpdateRepository
}

func NewDailyUpdateHandler(service *services.DailyUpdateService, authz *services.AuthorizationService, repo *repository.DailyUpdateRepository) *DailyUpdateHandler {
	return &DailyUpdateHandler{service: service, authz: authz, repo: repo}
}

func (h *DailyUpdateHandler) GetDailyUpdate(c *gin.Context) {
	var query models.GetDailyUpdateRequest
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := middleware.GetUser(c)

	update, err := h.service.GetDailyUpdate(c.Request.Context(), user.IRID, query.Date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, update)
}

func (h *DailyUpdateHandler) SaveDailyUpdate(c *gin.Context) {
	var req models.DailyUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := middleware.GetUser(c)

	// Verify authorization for all activities being created/updated/deleted
	if !h.verifyDailyUpdateAuthorization(c, user, &req) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	update, err := h.service.SaveDailyUpdate(c.Request.Context(), &req, user)
	if err != nil {
		if err.Error() == "invalid date format, use YYYY-MM-DD" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, update)
}

func (h *DailyUpdateHandler) verifyDailyUpdateAuthorization(ctx *gin.Context, user *models.User, req *models.DailyUpdateRequest) bool {
	requestContext := ctx.Request.Context()

	// Check Infos
	if req.Infos != nil {
		for _, activity := range req.Infos {
			if !h.verifyActivityAuthorization(requestContext, user, activity, "info") {
				return false
			}
		}
	}

	// Check Invites
	if req.Invites != nil {
		for _, activity := range req.Invites {
			if !h.verifyActivityAuthorization(requestContext, user, activity, "invite") {
				return false
			}
		}
	}

	// Check Plans
	if req.Plans != nil {
		for _, activity := range req.Plans {
			if !h.verifyActivityAuthorization(requestContext, user, activity, "plan") {
				return false
			}
		}
	}

	// Check Closings
	if req.Closings != nil {
		for _, activity := range req.Closings {
			if !h.verifyActivityAuthorization(requestContext, user, activity, "closing") {
				return false
			}
		}
	}

	// Check FG Invites
	if req.FGInvites != nil {
		for _, activity := range req.FGInvites {
			if !h.verifyActivityAuthorization(requestContext, user, activity, "fg_invite") {
				return false
			}
		}
	}

	// Check Feel Goods
	if req.FeelGoods != nil {
		for _, activity := range req.FeelGoods {
			if !h.verifyActivityAuthorization(requestContext, user, activity, "feel_good") {
				return false
			}
		}
	}

	return true
}

func (h *DailyUpdateHandler) verifyActivityAuthorization(ctx context.Context, user *models.User, activity models.DailyUpdateActivityRequest, activityType string) bool {
	var irID string
	var err error

	switch activity.Action {
	case "create":
		irID = user.IRID
	case "update", "delete":
		if activity.ID == "" {
			return false
		}
		switch activityType {
		case "info":
			irID, err = h.repo.GetInfoIRID(ctx, activity.ID)
		case "invite":
			irID, err = h.repo.GetInviteIRID(ctx, activity.ID)
		case "plan":
			irID, err = h.repo.GetPlanIRID(ctx, activity.ID)
		case "closing":
			irID, err = h.repo.GetClosingIRID(ctx, activity.ID)
		case "fg_invite":
			irID, err = h.repo.GetFGInviteIRID(ctx, activity.ID)
		case "feel_good":
			irID, err = h.repo.GetFeelGoodIRID(ctx, activity.ID)
		default:
			return false
		}
		if err != nil {
			return false
		}
	default:
		return false
	}

	return h.authz.CanAccessActivityForIR(ctx, user, irID)
}
