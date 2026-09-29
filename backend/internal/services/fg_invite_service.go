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

type FGInviteService struct {
	fgInviteRepo *repository.FGInviteRepository
	closingRepo  *repository.ClosingRepository
}

func NewFGInviteService(fgInviteRepo *repository.FGInviteRepository, closingRepo *repository.ClosingRepository) *FGInviteService {
	return &FGInviteService{
		fgInviteRepo: fgInviteRepo,
		closingRepo:  closingRepo,
	}
}

func (s *FGInviteService) CreateFGInvite(ctx context.Context, req *models.CreateFGInviteRequest) (*models.FGInviteResponse, error) {
	if err := s.validateCreateRequest(ctx, req); err != nil {
		return nil, err
	}

	closingID, err := uuid.Parse(req.ClosingID)
	if err != nil {
		return nil, errors.New("invalid closing_id format")
	}

	closing, err := s.closingRepo.GetByID(ctx, closingID)
	if err != nil {
		return nil, errors.New("closing not found")
	}

	fgInvite := &models.FGInvite{
		ClosingID: closingID,
		IRID:      closing.IRID,
		Status:    req.Status,
		Mode:      normalizeString(req.Mode),
		Remarks:   normalizeString(req.Remarks),
	}

	if req.MeetingDate != nil && *req.MeetingDate != "" {
		date, _ := time.Parse("2006-01-02", *req.MeetingDate)
		fgInvite.MeetingDate = &date
	}

	if req.MeetingTime != nil && *req.MeetingTime != "" {
		t, _ := time.Parse("15:04:05", *req.MeetingTime)
		fgInvite.MeetingTime = &t
	}

	err = s.fgInviteRepo.Create(ctx, fgInvite)
	if err != nil {
		if strings.Contains(err.Error(), "unique constraint") {
			return nil, errors.New("fg invite already exists for this closing")
		}
		return nil, err
	}

	return fgInvite.ToResponse(), nil
}

func (s *FGInviteService) GetFGInvite(ctx context.Context, id string) (*models.FGInviteResponse, error) {
	fgInviteID, err := uuid.Parse(id)
	if err != nil {
		return nil, errors.New("invalid fg_invite_id format")
	}

	fgInvite, err := s.fgInviteRepo.GetByID(ctx, fgInviteID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, errors.New("fg invite not found")
		}
		return nil, err
	}
	return fgInvite.ToResponse(), nil
}

func (s *FGInviteService) UpdateFGInvite(ctx context.Context, id string, req *models.UpdateFGInviteRequest) (*models.FGInviteResponse, error) {
	fgInviteID, err := uuid.Parse(id)
	if err != nil {
		return nil, errors.New("invalid fg_invite_id format")
	}

	fgInvite, err := s.fgInviteRepo.GetByID(ctx, fgInviteID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, errors.New("fg invite not found")
		}
		return nil, err
	}

	updates := &models.UpdateFGInviteRequestWithTime{}

	if req.MeetingDate != nil {
		if *req.MeetingDate == "" {
			updates.MeetingDate = nil
		} else {
			if !isValidDate(*req.MeetingDate) {
				return nil, errors.New("invalid meeting_date format, use YYYY-MM-DD")
			}
			date, _ := time.Parse("2006-01-02", *req.MeetingDate)
			updates.MeetingDate = &date
		}
	}

	if req.MeetingTime != nil {
		if *req.MeetingTime == "" {
			updates.MeetingTime = nil
		} else {
			if !isValidTime(*req.MeetingTime) {
				return nil, errors.New("invalid meeting_time format, use HH:MM:SS")
			}
			t, _ := time.Parse("15:04:05", *req.MeetingTime)
			updates.MeetingTime = &t
		}
	}

	if req.Mode != nil {
		updates.Mode = normalizeString(req.Mode)
	}

	if req.Status != nil {
		updates.Status = req.Status
	}

	if req.Remarks != nil {
		updates.Remarks = normalizeString(req.Remarks)
	}

	err = s.fgInviteRepo.Update(ctx, fgInviteID, updates)
	if err != nil {
		return nil, err
	}

	fgInvite, err = s.fgInviteRepo.GetByID(ctx, fgInviteID)
	if err != nil {
		return nil, err
	}
	return fgInvite.ToResponse(), nil
}

func (s *FGInviteService) DeleteFGInvite(ctx context.Context, id string) error {
	fgInviteID, err := uuid.Parse(id)
	if err != nil {
		return errors.New("invalid fg_invite_id format")
	}

	_, err = s.fgInviteRepo.GetByID(ctx, fgInviteID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return errors.New("fg invite not found")
		}
		return err
	}

	return s.fgInviteRepo.Delete(ctx, fgInviteID)
}

func (s *FGInviteService) ListFGInvites(ctx context.Context, page, limit int) ([]models.FGInviteResponse, int64, error) {
	if page < 1 || limit < 1 {
		return nil, 0, errors.New("invalid pagination parameters")
	}
	fgInvites, total, err := s.fgInviteRepo.List(ctx, page, limit)
	if err != nil {
		return nil, 0, err
	}

	responses := make([]models.FGInviteResponse, len(fgInvites))
	for i, fgInvite := range fgInvites {
		responses[i] = *fgInvite.ToResponse()
	}
	return responses, total, nil
}

func (s *FGInviteService) ListFGInvitesByIRID(ctx context.Context, irID string, page, limit int) ([]models.FGInviteResponse, int64, error) {
	if page < 1 || limit < 1 {
		return nil, 0, errors.New("invalid pagination parameters")
	}
	if irID = strings.TrimSpace(irID); irID == "" {
		return nil, 0, errors.New("ir_id is required")
	}
	fgInvites, total, err := s.fgInviteRepo.ListByIRID(ctx, irID, page, limit)
	if err != nil {
		return nil, 0, err
	}

	responses := make([]models.FGInviteResponse, len(fgInvites))
	for i, fgInvite := range fgInvites {
		responses[i] = *fgInvite.ToResponse()
	}
	return responses, total, nil
}

func (s *FGInviteService) ListFGInvitesByClosingID(ctx context.Context, closingID string, page, limit int) ([]models.FGInviteResponse, int64, error) {
	if page < 1 || limit < 1 {
		return nil, 0, errors.New("invalid pagination parameters")
	}
	if closingID = strings.TrimSpace(closingID); closingID == "" {
		return nil, 0, errors.New("closing_id is required")
	}
	fgInvites, total, err := s.fgInviteRepo.ListByClosingID(ctx, closingID, page, limit)
	if err != nil {
		return nil, 0, err
	}

	responses := make([]models.FGInviteResponse, len(fgInvites))
	for i, fgInvite := range fgInvites {
		responses[i] = *fgInvite.ToResponse()
	}
	return responses, total, nil
}

func (s *FGInviteService) validateCreateRequest(ctx context.Context, req *models.CreateFGInviteRequest) error {
	if strings.TrimSpace(req.ClosingID) == "" {
		return errors.New("closing_id is required")
	}

	if _, err := uuid.Parse(req.ClosingID); err != nil {
		return errors.New("invalid closing_id format")
	}


	closingID, _ := uuid.Parse(req.ClosingID)
	_, err := s.closingRepo.GetByID(ctx, closingID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return errors.New("closing not found")
		}
		return err
	}

	_, err = s.fgInviteRepo.GetByClosingID(ctx, closingID)
	if err == nil {
		return errors.New("fg invite already exists for this closing")
	}
	if err != pgx.ErrNoRows {
		return err
	}

	if req.MeetingDate != nil && *req.MeetingDate != "" {
		if !isValidDate(*req.MeetingDate) {
			return errors.New("invalid meeting_date format, use YYYY-MM-DD")
		}
	}

	if req.MeetingTime != nil && *req.MeetingTime != "" {
		if !isValidTime(*req.MeetingTime) {
			return errors.New("invalid meeting_time format, use HH:MM:SS")
		}
	}

	if req.Remarks != nil {
		*req.Remarks = strings.TrimSpace(*req.Remarks)
	}

	return nil
}


func isValidTime(timeStr string) bool {
	pattern := `^\d{2}:\d{2}:\d{2}$`
	match, _ := regexp.MatchString(pattern, timeStr)
	return match
}
