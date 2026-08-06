package services

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/models"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/repository"
)

type InfoService struct {
	repo       *repository.InfoRepository
	userRepo   *repository.UserRepository
}

func NewInfoService(repo *repository.InfoRepository, userRepo *repository.UserRepository) *InfoService {
	return &InfoService{repo: repo, userRepo: userRepo}
}

func (s *InfoService) CreateInfo(ctx context.Context, req *models.CreateInfoRequest) (*models.Info, error) {
	if req.Response != nil && !isValidResponse(*req.Response) {
		return nil, fmt.Errorf("invalid response: %s", *req.Response)
	}

	createdByID, err := uuid.Parse(req.CreatedBy)
	if err != nil {
		return nil, fmt.Errorf("invalid created_by: %s", req.CreatedBy)
	}

	user, err := s.userRepo.GetByID(ctx, createdByID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, fmt.Errorf("user not found")
	}

	info := &models.Info{
		IRID:         req.IRID,
		ProspectName: req.ProspectName,
		Phone:        req.Phone,
		Response:     req.Response,
		Status:       req.Status,
		Remarks:      req.Remarks,
		CreatedBy:    createdByID,
	}

	err = s.repo.Create(ctx, info)
	if err != nil {
		return nil, err
	}

	return info, nil
}

func (s *InfoService) GetInfoByID(ctx context.Context, id uuid.UUID) (*models.Info, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *InfoService) UpdateInfo(ctx context.Context, id uuid.UUID, req *models.UpdateInfoRequest) (*models.Info, error) {
	if req.Response != nil && *req.Response != "" && !isValidResponse(*req.Response) {
		return nil, fmt.Errorf("invalid response: %s", *req.Response)
	}

	err := s.repo.Update(ctx, id, req)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("info not found")
		}
		return nil, err
	}

	return s.repo.GetByID(ctx, id)
}

func (s *InfoService) DeleteInfo(ctx context.Context, id uuid.UUID) error {
	err := s.repo.Delete(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return fmt.Errorf("info not found")
		}
		return err
	}
	return nil
}

func (s *InfoService) ListInfos(ctx context.Context, query *models.ListInfosQuery) (*models.ListInfosResponse, error) {
	infos, total, err := s.repo.List(ctx, query)
	if err != nil {
		return nil, err
	}

	if infos == nil {
		infos = []models.Info{}
	}

	return &models.ListInfosResponse{
		Data:  infos,
		Total: total,
		Page:  query.Page,
		Limit: query.Limit,
	}, nil
}

func isValidResponse(response string) bool {
	validResponses := map[string]bool{
		"A":  true,
		"AB": true,
		"B":  true,
		"BC": true,
		"C":  true,
	}
	return validResponses[response]
}
