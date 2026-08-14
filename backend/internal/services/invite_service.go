package services

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/models"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/repository"
)

type InviteService struct {
	repo     *repository.InviteRepository
	infoRepo *repository.InfoRepository
}

func NewInviteService(repo *repository.InviteRepository, infoRepo *repository.InfoRepository) *InviteService {
	return &InviteService{repo: repo, infoRepo: infoRepo}
}

func normalizeOptionalString(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func (s *InviteService) CreateInvite(ctx context.Context, req *models.CreateInviteRequest) (*models.InviteResponse, error) {
	normalizedMeetingDate := normalizeOptionalString(req.MeetingDate)
	normalizedMeetingTime := normalizeOptionalString(req.MeetingTime)
	normalizedMode := normalizeOptionalString(req.Mode)
	normalizedRemarks := normalizeOptionalString(req.Remarks)

	if normalizedMode != nil && !isValidMode(*normalizedMode) {
		return nil, fmt.Errorf("invalid mode: %s", *normalizedMode)
	}

	var meetingDatePtr *time.Time
	if normalizedMeetingDate != nil {
		if err := validateDateFormat(*normalizedMeetingDate); err != nil {
			return nil, err
		}
		date, _ := time.Parse("2006-01-02", *normalizedMeetingDate)
		meetingDatePtr = &date
	}

	var meetingTimePtr *time.Time
	if normalizedMeetingTime != nil {
		if err := validateTimeFormat(*normalizedMeetingTime); err != nil {
			return nil, err
		}
		parsedTime, _ := time.Parse("15:04:05", *normalizedMeetingTime)
		meetingTimePtr = &parsedTime
	}

	infoID, err := uuid.Parse(req.InfoID)
	if err != nil {
		return nil, fmt.Errorf("invalid info_id: %s", req.InfoID)
	}

	info, err := s.infoRepo.GetByID(ctx, infoID)
	if err != nil {
		return nil, err
	}
	if info == nil {
		return nil, fmt.Errorf("info not found")
	}

	invite := &models.Invite{
		InfoID:      infoID,
		IRID:        req.IRID,
		MeetingDate: meetingDatePtr,
		MeetingTime: meetingTimePtr,
		Mode:        normalizedMode,
		Status:      req.Status,
		Remarks:     normalizedRemarks,
	}

	err = s.repo.Create(ctx, invite)
	if err != nil {
		return nil, err
	}

	return invite.ToResponse(), nil
}

func (s *InviteService) GetInviteByID(ctx context.Context, id uuid.UUID) (*models.InviteResponse, error) {
	invite, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if invite == nil {
		return nil, nil
	}
	return invite.ToResponse(), nil
}

func (s *InviteService) UpdateInvite(ctx context.Context, id uuid.UUID, req *models.UpdateInviteRequest) (*models.InviteResponse, error) {
	normalizedMeetingDate := normalizeOptionalString(req.MeetingDate)
	normalizedMeetingTime := normalizeOptionalString(req.MeetingTime)
	normalizedMode := normalizeOptionalString(req.Mode)
	normalizedStatus := normalizeOptionalString(req.Status)
	normalizedRemarks := normalizeOptionalString(req.Remarks)

	if normalizedMode != nil && !isValidMode(*normalizedMode) {
		return nil, fmt.Errorf("invalid mode: %s", *normalizedMode)
	}

	var meetingDatePtr *time.Time
	if normalizedMeetingDate != nil {
		if err := validateDateFormat(*normalizedMeetingDate); err != nil {
			return nil, err
		}
		date, _ := time.Parse("2006-01-02", *normalizedMeetingDate)
		meetingDatePtr = &date
	}

	var meetingTimePtr *time.Time
	if normalizedMeetingTime != nil {
		if err := validateTimeFormat(*normalizedMeetingTime); err != nil {
			return nil, err
		}
		parsedTime, _ := time.Parse("15:04:05", *normalizedMeetingTime)
		meetingTimePtr = &parsedTime
	}

	updates := &models.UpdateInviteRequestWithTime{
		MeetingDate: meetingDatePtr,
		MeetingTime: meetingTimePtr,
		Mode:        normalizedMode,
		Status:      normalizedStatus,
		Remarks:     normalizedRemarks,
	}

	err := s.repo.Update(ctx, id, updates)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("invite not found")
		}
		return nil, err
	}

	invite, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return invite.ToResponse(), nil
}

func (s *InviteService) DeleteInvite(ctx context.Context, id uuid.UUID) error {
	err := s.repo.Delete(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return fmt.Errorf("invite not found")
		}
		return err
	}
	return nil
}

func (s *InviteService) ListInvites(ctx context.Context, query *models.ListInvitesQuery) (*models.ListInvitesResponse, error) {
	invites, total, err := s.repo.List(ctx, query)
	if err != nil {
		return nil, err
	}

	if invites == nil {
		invites = []models.Invite{}
	}

	responses := make([]models.InviteResponse, len(invites))
	for i, invite := range invites {
		responses[i] = *invite.ToResponse()
	}

	return &models.ListInvitesResponse{
		Data:  responses,
		Total: total,
		Page:  query.Page,
		Limit: query.Limit,
	}, nil
}

func isValidMode(mode string) bool {
	validModes := map[string]bool{
		"virtual":  true,
		"physical": true,
	}
	return validModes[mode]
}

func validateDateFormat(dateStr string) error {
	re := regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)
	if !re.MatchString(dateStr) {
		return fmt.Errorf("invalid date format, expected YYYY-MM-DD")
	}
	_, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return fmt.Errorf("invalid date: %s", dateStr)
	}
	return nil
}

func validateTimeFormat(timeStr string) error {
	re := regexp.MustCompile(`^\d{2}:\d{2}:\d{2}$`)
	if !re.MatchString(timeStr) {
		return fmt.Errorf("invalid time format, expected HH:MM:SS")
	}
	_, err := time.Parse("15:04:05", timeStr)
	if err != nil {
		return fmt.Errorf("invalid time: %s", timeStr)
	}
	return nil
}
