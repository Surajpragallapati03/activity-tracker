package services

import (
	"context"
	"errors"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/models"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/repository"
)

type ClosingService struct {
	closingRepo *repository.ClosingRepository
	planRepo    *repository.PlanRepository
}

func NewClosingService(closingRepo *repository.ClosingRepository, planRepo *repository.PlanRepository) *ClosingService {
	return &ClosingService{
		closingRepo: closingRepo,
		planRepo:    planRepo,
	}
}

func (s *ClosingService) CreateClosing(ctx context.Context, req *models.CreateClosingRequest) (*models.ClosingResponse, error) {
	if err := s.validateCreateRequest(ctx, req); err != nil {
		return nil, err
	}

	planID, err := uuid.Parse(req.PlanID)
	if err != nil {
		return nil, errors.New("invalid plan_id format")
	}

	date, _ := time.Parse("2006-01-02", req.ClosingDate)
	closing := &models.Closing{
		PlanID:      planID,
		ClosingDate: &date,
		Status:      normalizeString(req.Status),
		Remarks:     req.Remarks,
	}

	plan, err := s.planRepo.GetByID(ctx, planID)
	if err != nil {
		return nil, errors.New("plan not found")
	}
	closing.IRID = plan.IRID

	err = s.closingRepo.Create(ctx, closing)
	if err != nil {
		if strings.Contains(err.Error(), "unique constraint") {
			return nil, errors.New("closing already exists for this plan")
		}
		return nil, err
	}

	return closing.ToResponse(), nil
}

func (s *ClosingService) GetClosing(ctx context.Context, id string) (*models.ClosingResponse, error) {
	closingID, err := uuid.Parse(id)
	if err != nil {
		return nil, errors.New("invalid closing_id format")
	}

	closing, err := s.closingRepo.GetByID(ctx, closingID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, errors.New("closing not found")
		}
		return nil, err
	}
	return closing.ToResponse(), nil
}

func (s *ClosingService) UpdateClosing(ctx context.Context, id string, req *models.UpdateClosingRequest) (*models.ClosingResponse, error) {
	closingID, err := uuid.Parse(id)
	if err != nil {
		return nil, errors.New("invalid closing_id format")
	}

	closing, err := s.closingRepo.GetByID(ctx, closingID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, errors.New("closing not found")
		}
		return nil, err
	}

	updates := &models.UpdateClosingRequestWithTime{}

	if req.ClosingDate != nil {
		if !isValidDate(*req.ClosingDate) {
			return nil, errors.New("invalid closing_date format, use YYYY-MM-DD")
		}
		date, _ := time.Parse("2006-01-02", *req.ClosingDate)
		updates.ClosingDate = &date
	}

	if req.Status != nil {
		updates.Status = req.Status
	}

	if req.Remarks != nil {
		remarks := strings.TrimSpace(*req.Remarks)
		if remarks == "" {
			updates.Remarks = nil
		} else {
			updates.Remarks = &remarks
		}
	}

	err = s.closingRepo.Update(ctx, closingID, updates)
	if err != nil {
		return nil, err
	}

	closing, err = s.closingRepo.GetByID(ctx, closingID)
	if err != nil {
		return nil, err
	}
	return closing.ToResponse(), nil
}

func (s *ClosingService) DeleteClosing(ctx context.Context, id string) error {
	closingID, err := uuid.Parse(id)
	if err != nil {
		return errors.New("invalid closing_id format")
	}

	_, err = s.closingRepo.GetByID(ctx, closingID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return errors.New("closing not found")
		}
		return err
	}

	return s.closingRepo.Delete(ctx, closingID)
}

func (s *ClosingService) ListClosings(ctx context.Context, page, limit int) ([]models.ClosingResponse, int64, error) {
	if page < 1 || limit < 1 {
		return nil, 0, errors.New("invalid pagination parameters")
	}
	closings, total, err := s.closingRepo.List(ctx, page, limit)
	if err != nil {
		return nil, 0, err
	}

	responses := make([]models.ClosingResponse, len(closings))
	for i, closing := range closings {
		responses[i] = *closing.ToResponse()
	}
	return responses, total, nil
}

func (s *ClosingService) ListClosingsByIRID(ctx context.Context, irID string, page, limit int) ([]models.ClosingResponse, int64, error) {
	if page < 1 || limit < 1 {
		return nil, 0, errors.New("invalid pagination parameters")
	}
	if irID = strings.TrimSpace(irID); irID == "" {
		return nil, 0, errors.New("ir_id is required")
	}
	closings, total, err := s.closingRepo.ListByIRID(ctx, irID, page, limit)
	if err != nil {
		return nil, 0, err
	}

	responses := make([]models.ClosingResponse, len(closings))
	for i, closing := range closings {
		responses[i] = *closing.ToResponse()
	}
	return responses, total, nil
}

func (s *ClosingService) validateCreateRequest(ctx context.Context, req *models.CreateClosingRequest) error {
	if strings.TrimSpace(req.PlanID) == "" {
		return errors.New("plan_id is required")
	}

	if _, err := uuid.Parse(req.PlanID); err != nil {
		return errors.New("invalid plan_id format")
	}

	if !isValidDate(req.ClosingDate) {
		return errors.New("invalid closing_date format, use YYYY-MM-DD")
	}

	if req.Status != nil && *req.Status != "done" && *req.Status != "pending" {
		return errors.New("status must be either 'done' or 'pending'")
	}

	planID, _ := uuid.Parse(req.PlanID)
	_, err := s.planRepo.GetByID(ctx, planID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return errors.New("plan not found")
		}
		return err
	}

	_, err = s.closingRepo.GetByPlanID(ctx, planID)
	if err == nil {
		return errors.New("closing already exists for this plan")
	}
	if err != pgx.ErrNoRows {
		return err
	}

	if req.Remarks != nil {
		*req.Remarks = strings.TrimSpace(*req.Remarks)
	}

	return nil
}

func isValidDate(date string) bool {
	pattern := `^\d{4}-\d{2}-\d{2}$`
	match, _ := regexp.MatchString(pattern, date)
	return match
}

func normalizeString(s *string) *string {
	if s == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*s)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}
