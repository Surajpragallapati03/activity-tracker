package services

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/models"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/repository"
)

type FeelGoodService struct {
	feelGoodRepo *repository.FeelGoodRepository
	fgInviteRepo *repository.FGInviteRepository
}

func NewFeelGoodService(feelGoodRepo *repository.FeelGoodRepository, fgInviteRepo *repository.FGInviteRepository) *FeelGoodService {
	return &FeelGoodService{
		feelGoodRepo: feelGoodRepo,
		fgInviteRepo: fgInviteRepo,
	}
}

func (s *FeelGoodService) CreateFeelGood(ctx context.Context, req *models.CreateFeelGoodRequest) (*models.FeelGoodResponse, error) {
	if err := s.validateCreateRequest(ctx, req); err != nil {
		return nil, err
	}

	fgInviteID, err := uuid.Parse(req.FGInviteID)
	if err != nil {
		return nil, errors.New("invalid fg_invite_id format")
	}

	fgInvite, err := s.fgInviteRepo.GetByID(ctx, fgInviteID)
	if err != nil {
		return nil, errors.New("fg invite not found")
	}

	feelGood := &models.FeelGood{
		FGInviteID: fgInviteID,
		IRID:       fgInvite.IRID,
		UL1:        strings.TrimSpace(req.UL1),
		UL2:        strings.TrimSpace(req.UL2),
		Status:     normalizeString(req.Status),
		Remarks:    normalizeString(req.Remarks),
	}

	err = s.feelGoodRepo.Create(ctx, feelGood)
	if err != nil {
		if strings.Contains(err.Error(), "unique constraint") {
			return nil, errors.New("feel good already exists for this fg invite")
		}
		return nil, err
	}

	return feelGood.ToResponse(), nil
}

func (s *FeelGoodService) GetFeelGood(ctx context.Context, id string) (*models.FeelGoodResponse, error) {
	feelGoodID, err := uuid.Parse(id)
	if err != nil {
		return nil, errors.New("invalid feel_good_id format")
	}

	feelGood, err := s.feelGoodRepo.GetByID(ctx, feelGoodID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, errors.New("feel good not found")
		}
		return nil, err
	}
	return feelGood.ToResponse(), nil
}

func (s *FeelGoodService) UpdateFeelGood(ctx context.Context, id string, req *models.UpdateFeelGoodRequest) (*models.FeelGoodResponse, error) {
	feelGoodID, err := uuid.Parse(id)
	if err != nil {
		return nil, errors.New("invalid feel_good_id format")
	}

	feelGood, err := s.feelGoodRepo.GetByID(ctx, feelGoodID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, errors.New("feel good not found")
		}
		return nil, err
	}

	updates := &models.UpdateFeelGoodRequestWithoutBinding{}

	if req.UL1 != nil {
		trimmed := strings.TrimSpace(*req.UL1)
		if trimmed == "" {
			return nil, errors.New("ul1 cannot be empty")
		}
		updates.UL1 = &trimmed
	}

	if req.UL2 != nil {
		trimmed := strings.TrimSpace(*req.UL2)
		if trimmed == "" {
			return nil, errors.New("ul2 cannot be empty")
		}
		updates.UL2 = &trimmed
	}

	if req.Status != nil {
		trimmed := strings.TrimSpace(*req.Status)
		if trimmed == "" {
			return nil, errors.New("status cannot be empty")
		}
		updates.Status = &trimmed
	}

	if req.Remarks != nil {
		updates.Remarks = normalizeString(req.Remarks)
	}

	err = s.feelGoodRepo.Update(ctx, feelGoodID, updates)
	if err != nil {
		return nil, err
	}

	feelGood, err = s.feelGoodRepo.GetByID(ctx, feelGoodID)
	if err != nil {
		return nil, err
	}
	return feelGood.ToResponse(), nil
}

func (s *FeelGoodService) DeleteFeelGood(ctx context.Context, id string) error {
	feelGoodID, err := uuid.Parse(id)
	if err != nil {
		return errors.New("invalid feel_good_id format")
	}

	_, err = s.feelGoodRepo.GetByID(ctx, feelGoodID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return errors.New("feel good not found")
		}
		return err
	}

	return s.feelGoodRepo.Delete(ctx, feelGoodID)
}

func (s *FeelGoodService) ListFeelGoods(ctx context.Context, page, limit int) ([]models.FeelGoodResponse, int64, error) {
	if page < 1 || limit < 1 {
		return nil, 0, errors.New("invalid pagination parameters")
	}
	feelGoods, total, err := s.feelGoodRepo.List(ctx, page, limit)
	if err != nil {
		return nil, 0, err
	}

	responses := make([]models.FeelGoodResponse, len(feelGoods))
	for i, feelGood := range feelGoods {
		responses[i] = *feelGood.ToResponse()
	}
	return responses, total, nil
}

func (s *FeelGoodService) ListFeelGoodsByFGInviteID(ctx context.Context, fgInviteID string, page, limit int) ([]models.FeelGoodResponse, int64, error) {
	if page < 1 || limit < 1 {
		return nil, 0, errors.New("invalid pagination parameters")
	}
	if fgInviteID = strings.TrimSpace(fgInviteID); fgInviteID == "" {
		return nil, 0, errors.New("fg_invite_id is required")
	}
	feelGoods, total, err := s.feelGoodRepo.ListByFGInviteID(ctx, fgInviteID, page, limit)
	if err != nil {
		return nil, 0, err
	}

	responses := make([]models.FeelGoodResponse, len(feelGoods))
	for i, feelGood := range feelGoods {
		responses[i] = *feelGood.ToResponse()
	}
	return responses, total, nil
}

func (s *FeelGoodService) ListFeelGoodsByIRID(ctx context.Context, irID string, page, limit int) ([]models.FeelGoodResponse, int64, error) {
	if page < 1 || limit < 1 {
		return nil, 0, errors.New("invalid pagination parameters")
	}
	if irID = strings.TrimSpace(irID); irID == "" {
		return nil, 0, errors.New("ir_id is required")
	}
	feelGoods, total, err := s.feelGoodRepo.ListByIRID(ctx, irID, page, limit)
	if err != nil {
		return nil, 0, err
	}

	responses := make([]models.FeelGoodResponse, len(feelGoods))
	for i, feelGood := range feelGoods {
		responses[i] = *feelGood.ToResponse()
	}
	return responses, total, nil
}

func (s *FeelGoodService) validateCreateRequest(ctx context.Context, req *models.CreateFeelGoodRequest) error {
	if strings.TrimSpace(req.FGInviteID) == "" {
		return errors.New("fg_invite_id is required")
	}

	if _, err := uuid.Parse(req.FGInviteID); err != nil {
		return errors.New("invalid fg_invite_id format")
	}

	if strings.TrimSpace(req.UL1) == "" {
		return errors.New("ul1 is required")
	}

	if strings.TrimSpace(req.UL2) == "" {
		return errors.New("ul2 is required")
	}


	fgInviteID, _ := uuid.Parse(req.FGInviteID)
	_, err := s.fgInviteRepo.GetByID(ctx, fgInviteID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return errors.New("fg invite not found")
		}
		return err
	}

	_, err = s.feelGoodRepo.GetByFGInviteID(ctx, fgInviteID)
	if err == nil {
		return errors.New("feel good already exists for this fg invite")
	}
	if err != pgx.ErrNoRows {
		return err
	}

	return nil
}
