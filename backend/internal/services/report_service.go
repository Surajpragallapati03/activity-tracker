package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/models"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/repository"
)

type ReportService struct {
	reportRepo *repository.ReportRepository
	userRepo   *repository.UserRepository
	authz      *AuthorizationService
}

func NewReportService(reportRepo *repository.ReportRepository, userRepo *repository.UserRepository, authz *AuthorizationService) *ReportService {
	return &ReportService{
		reportRepo: reportRepo,
		userRepo:   userRepo,
		authz:      authz,
	}
}

func (s *ReportService) GetIndividualReport(ctx context.Context, currentUser *models.User, req *models.IndividualReportRequest) (*models.IndividualReportResponse, error) {
	targetUserID, err := uuid.Parse(req.UserID)
	if err != nil {
		return nil, errors.New("invalid user_id")
	}

	targetUser, err := s.userRepo.GetByID(ctx, targetUserID)
	if err != nil {
		return nil, err
	}
	if targetUser == nil {
		return nil, errors.New("user not found")
	}

	// Authorization check
	if currentUser.Role == "admin" {
		// Admin can view any user
	} else if currentUser.ID == targetUser.ID {
		// User can view own data
	} else if currentUser.Role == "upline" {
		// Upline can view self + authorized descendants
		if !s.authz.CanAccessActivityForIR(ctx, currentUser, targetUser.IRID) {
			return nil, errors.New("forbidden: cannot access this user's data")
		}
	} else if currentUser.Role == "ir" {
		// IR can only view own data
		return nil, errors.New("forbidden: can only view own data")
	} else {
		return nil, errors.New("forbidden")
	}

	startDate := req.StartDate
	endDate := req.EndDate

	report := &models.IndividualReportResponse{
		UserID:   req.UserID,
		UserIRID: targetUser.IRID,
		UserName: targetUser.Name,
	}

	// Get activity counts
	counts, err := s.reportRepo.CountActivities(ctx, targetUser.IRID, startDate, endDate)
	if err != nil {
		return nil, err
	}
	report.ActivityCounts = *counts

	// Get pipeline summary
	summary, err := s.reportRepo.GetPipelineSummary(ctx, targetUser.IRID, startDate, endDate)
	if err != nil {
		return nil, err
	}
	report.PipelineSummary = *summary

	// Get pipeline details
	tentative, err := s.reportRepo.GetPipelineDetails(ctx, targetUser.IRID, "tentative", startDate, endDate)
	if err != nil {
		return nil, err
	}
	report.TentativeDetails = tentative

	strong, err := s.reportRepo.GetPipelineDetails(ctx, targetUser.IRID, "strong", startDate, endDate)
	if err != nil {
		return nil, err
	}
	report.StrongDetails = strong

	sureshot, err := s.reportRepo.GetPipelineDetails(ctx, targetUser.IRID, "sureshot", startDate, endDate)
	if err != nil {
		return nil, err
	}
	report.SureshotDetails = sureshot

	return report, nil
}

func (s *ReportService) GetTeamReport(ctx context.Context, currentUser *models.User, req *models.TeamReportRequest) (*models.TeamReportResponse, error) {
	// Authorization: User can only select themselves and their downlines
	accessibleIRIDs, err := s.authz.GetAccessibleIRIDs(ctx, currentUser)
	if err != nil {
		return nil, err
	}

	// Build map for quick lookup
	accessible := make(map[string]bool)
	if accessibleIRIDs == nil {
		// Admin has access to all
		accessible = nil
	} else {
		for _, id := range accessibleIRIDs {
			accessible[id] = true
		}
	}

	// Validate requested vertical roots
	verticalRootsMap := make(map[string]*models.User)
	for _, verticalRoot := range req.VerticalRoots {
		user, err := s.userRepo.GetByIRID(ctx, verticalRoot)
		if err != nil {
			return nil, err
		}
		if user == nil {
			return nil, fmt.Errorf("user with ir_id '%s' not found", verticalRoot)
		}

		// Check authorization
		if accessible != nil && !accessible[verticalRoot] {
			// For non-admin, check if user is in accessible tree
			canAccess := false
			if currentUser.IRID == verticalRoot {
				canAccess = true
			} else {
				// Check if it's a downline
				if s.authz.CanAccessActivityForIR(ctx, currentUser, verticalRoot) {
					canAccess = true
				}
			}
			if !canAccess {
				return nil, errors.New("forbidden: cannot access this vertical")
			}
		}

		verticalRootsMap[verticalRoot] = user
	}

	// Deduplicate vertical roots: remove any that are descendants of other selected roots
	filteredVerticalRoots, err := s.filterOverlappingVerticals(ctx, req.VerticalRoots, verticalRootsMap)
	if err != nil {
		return nil, err
	}

	startDate := req.StartDate
	endDate := req.EndDate

	report := &models.TeamReportResponse{
		StartDate: startDate,
		EndDate:   endDate,
	}

	// For each non-overlapping vertical root, get all descendants and aggregate data
	for _, verticalRoot := range filteredVerticalRoots {
		rootUser := verticalRootsMap[verticalRoot]

		// Get all IRs in this vertical (root + descendants)
		descendantIRs, err := s.getVerticalIRs(ctx, rootUser)
		if err != nil {
			return nil, err
		}

		// Count activities for this vertical
		counts, err := s.reportRepo.CountActivitiesForMultipleIRs(ctx, descendantIRs, startDate, endDate)
		if err != nil {
			return nil, err
		}

		// Get pipeline summary
		summary, err := s.reportRepo.GetPipelineSummaryForMultipleIRs(ctx, descendantIRs, startDate, endDate)
		if err != nil {
			return nil, err
		}

		verticalSummary := models.VerticalSummary{
			VerticalRoot:    verticalRoot,
			VerticalIRID:    verticalRoot,
			UserName:        rootUser.Name,
			ActivityCounts:  *counts,
			PipelineSummary: *summary,
		}
		report.Verticals = append(report.Verticals, verticalSummary)

		// Get pipeline details for each status
		tentative, err := s.reportRepo.GetPipelineDetailsForMultipleIRs(ctx, descendantIRs, "tentative", startDate, endDate)
		if err != nil {
			return nil, err
		}

		strong, err := s.reportRepo.GetPipelineDetailsForMultipleIRs(ctx, descendantIRs, "strong", startDate, endDate)
		if err != nil {
			return nil, err
		}

		sureshot, err := s.reportRepo.GetPipelineDetailsForMultipleIRs(ctx, descendantIRs, "sureshot", startDate, endDate)
		if err != nil {
			return nil, err
		}

		verticalPipeline := models.VerticalPipeline{
			VerticalRoot:     verticalRoot,
			TentativeDetails: tentative,
			StrongDetails:    strong,
			SureshotDetails:  sureshot,
		}
		report.PipelineDetails = append(report.PipelineDetails, verticalPipeline)
	}

	return report, nil
}

func (s *ReportService) getVerticalIRs(ctx context.Context, rootUser *models.User) ([]string, error) {
	irids := []string{rootUser.IRID}

	// Get all descendants
	descendants, err := s.reportRepo.GetDownlineIRIDs(ctx, rootUser.ID)
	if err != nil {
		return nil, err
	}

	irids = append(irids, descendants...)
	return irids, nil
}

func (s *ReportService) filterOverlappingVerticals(ctx context.Context, verticalRoots []string, verticalRootsMap map[string]*models.User) ([]string, error) {
	if len(verticalRoots) <= 1 {
		return verticalRoots, nil
	}

	// Build a set of users to keep (not descendants of any other selected user)
	filtered := []string{}
	for _, candidateRoot := range verticalRoots {
		candidateUser := verticalRootsMap[candidateRoot]
		isDescendantOfOther := false

		// Check if this candidate is a descendant of any other selected user
		for _, potentialAncestor := range verticalRoots {
			if candidateRoot == potentialAncestor {
				continue // Can't be a descendant of itself
			}

			ancestorUser := verticalRootsMap[potentialAncestor]
			isDesc, err := s.reportRepo.IsDescendantOf(ctx, candidateUser.ID, ancestorUser.ID)
			if err != nil {
				return nil, err
			}

			if isDesc {
				isDescendantOfOther = true
				break
			}
		}

		if !isDescendantOfOther {
			filtered = append(filtered, candidateRoot)
		}
	}

	return filtered, nil
}

func (s *ReportService) ValidateDateRange(startDate, endDate string) error {
	start, err := time.Parse("2006-01-02", startDate)
	if err != nil {
		return fmt.Errorf("invalid start_date format, use YYYY-MM-DD")
	}

	end, err := time.Parse("2006-01-02", endDate)
	if err != nil {
		return fmt.Errorf("invalid end_date format, use YYYY-MM-DD")
	}

	if start.After(end) {
		return errors.New("start_date must be before or equal to end_date")
	}

	return nil
}

func (s *ReportService) ExportIndividualReport(report *models.IndividualReportResponse, format string) ([]byte, string, string, error) {
	switch format {
	case "excel":
		return exportIndividualToExcel(report)
	case "csv":
		return exportIndividualToCSV(report)
	case "pdf":
		return exportIndividualToPDF(report)
	default:
		return nil, "", "", fmt.Errorf("unsupported export format: %s", format)
	}
}

func (s *ReportService) ExportTeamReport(report *models.TeamReportResponse, format string) ([]byte, string, string, error) {
	switch format {
	case "excel":
		return exportTeamToExcel(report)
	case "csv":
		return exportTeamToCSV(report)
	case "pdf":
		return exportTeamToPDF(report)
	default:
		return nil, "", "", fmt.Errorf("unsupported export format: %s", format)
	}
}
