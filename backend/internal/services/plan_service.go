package services

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/models"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/repository"
)

type PlanService struct {
	repo       *repository.PlanRepository
	inviteRepo *repository.InviteRepository
	userRepo   *repository.UserRepository
}

func NewPlanService(repo *repository.PlanRepository, inviteRepo *repository.InviteRepository, userRepo *repository.UserRepository) *PlanService {
	return &PlanService{repo: repo, inviteRepo: inviteRepo, userRepo: userRepo}
}

func (s *PlanService) CreatePlan(ctx context.Context, req *models.CreatePlanRequest) (*models.Plan, error) {
	inviteID, err := uuid.Parse(req.InviteID)
	if err != nil {
		return nil, fmt.Errorf("invalid invite_id: %s", req.InviteID)
	}

	invite, err := s.inviteRepo.GetByID(ctx, inviteID)
	if err != nil {
		return nil, err
	}
	if invite == nil {
		return nil, fmt.Errorf("invite not found")
	}

	pipelineStatus := req.PipelineStatus
	if pipelineStatus == "" {
		pipelineStatus = "tentative"
	}

	plan := &models.Plan{
		InviteID:       inviteID,
		IRID:           req.IRID,
		UL1:            req.UL1,
		UL2:            req.UL2,
		QuotedAmount:   req.QuotedAmount,
		ExpectedUVs:    req.ExpectedUVs,
		Status:         req.Status,
		Remarks:        req.Remarks,
		PipelineStatus: pipelineStatus,
	}

	err = s.repo.Create(ctx, plan)
	if err != nil {
		return nil, err
	}

	// Increment plans_shown for the plan owner
	user, err := s.userRepo.GetByIRID(ctx, req.IRID)
	if err != nil {
		return nil, err
	}
	if user != nil {
		newPlansShown := user.PlansShown + 1
		updateReq := &models.UpdateUserRequest{
			PlansShown: &newPlansShown,
		}
		err = s.userRepo.Update(ctx, user.ID, updateReq)
		if err != nil {
			return nil, err
		}
	}

	return plan, nil
}

func (s *PlanService) GetPlanByID(ctx context.Context, id uuid.UUID) (*models.Plan, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *PlanService) UpdatePlan(ctx context.Context, id uuid.UUID, req *models.UpdatePlanRequest) (*models.Plan, error) {
	err := s.repo.Update(ctx, id, req)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("plan not found")
		}
		return nil, err
	}

	return s.repo.GetByID(ctx, id)
}

func (s *PlanService) DeletePlan(ctx context.Context, id uuid.UUID) error {
	err := s.repo.Delete(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return fmt.Errorf("plan not found")
		}
		return err
	}
	return nil
}

func (s *PlanService) ListPlans(ctx context.Context, query *models.ListPlansQuery) (*models.ListPlansResponse, error) {
	plans, total, err := s.repo.List(ctx, query)
	if err != nil {
		return nil, err
	}

	if plans == nil {
		plans = []models.Plan{}
	}

	return &models.ListPlansResponse{
		Data:  plans,
		Total: total,
		Page:  query.Page,
		Limit: query.Limit,
	}, nil
}
