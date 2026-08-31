package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/models"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/services"
)

type ReportHandler struct {
	service *services.ReportService
}

func NewReportHandler(service *services.ReportService) *ReportHandler {
	return &ReportHandler{service: service}
}

func (h *ReportHandler) GetIndividualReport(c *gin.Context) {
	currentUser := GetCurrentUser(c)

	var req models.IndividualReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate date range
	if err := h.service.ValidateDateRange(req.StartDate, req.EndDate); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	report, err := h.service.GetIndividualReport(c.Request.Context(), currentUser, &req)
	if err != nil {
		if err.Error() == "forbidden" || err.Error() == "forbidden: can only view own data in individual report" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, report)
}

func (h *ReportHandler) GetTeamReport(c *gin.Context) {
	currentUser := GetCurrentUser(c)

	var req models.TeamReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate date range
	if err := h.service.ValidateDateRange(req.StartDate, req.EndDate); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	report, err := h.service.GetTeamReport(c.Request.Context(), currentUser, &req)
	if err != nil {
		if err.Error() == "forbidden" || err.Error() == "forbidden: cannot access this vertical" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, report)
}

func (h *ReportHandler) ExportIndividualReport(c *gin.Context) {
	currentUser := GetCurrentUser(c)
	format := c.Param("format")

	var req models.IndividualReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.ValidateDateRange(req.StartDate, req.EndDate); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	report, err := h.service.GetIndividualReport(c.Request.Context(), currentUser, &req)
	if err != nil {
		if err.Error() == "forbidden" || err.Error() == "forbidden: can only view own data in individual report" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	fileData, contentType, filename, err := h.service.ExportIndividualReport(report, format)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Type", contentType)
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Data(http.StatusOK, contentType, fileData)
}

func (h *ReportHandler) ExportTeamReport(c *gin.Context) {
	currentUser := GetCurrentUser(c)
	format := c.Param("format")

	var req models.TeamReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.ValidateDateRange(req.StartDate, req.EndDate); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	report, err := h.service.GetTeamReport(c.Request.Context(), currentUser, &req)
	if err != nil {
		if err.Error() == "forbidden" || err.Error() == "forbidden: cannot access this vertical" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	fileData, contentType, filename, err := h.service.ExportTeamReport(report, format)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Type", contentType)
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Data(http.StatusOK, contentType, fileData)
}
