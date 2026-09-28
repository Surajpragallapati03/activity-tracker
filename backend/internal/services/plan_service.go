package services

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/models"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/repository"
)

type PlanService struct {
	repo       *repository.PlanRepository
	inviteRepo *repository.InviteRepository
	userRepo   *repository.UserRepository
	infoRepo   *repository.InfoRepository
}

func NewPlanService(repo *repository.PlanRepository, inviteRepo *repository.InviteRepository, userRepo *repository.UserRepository) *PlanService {
	return &PlanService{repo: repo, inviteRepo: inviteRepo, userRepo: userRepo}
}

func NewPlanServiceWithInfo(repo *repository.PlanRepository, inviteRepo *repository.InviteRepository, userRepo *repository.UserRepository, infoRepo *repository.InfoRepository) *PlanService {
	return &PlanService{repo: repo, inviteRepo: inviteRepo, userRepo: userRepo, infoRepo: infoRepo}
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

func (s *PlanService) CreatePlanWithDKD(ctx context.Context, req *models.CreatePlanWithDKDRequest, currentUser *models.User, db *pgxpool.Pool) (*models.PlanWithChainResponse, error) {
	tx, err := db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback(ctx)

	// Create Info with response='A'
	infoID := uuid.New()
	infoQuery := `INSERT INTO infos (id, ir_id, prospect_name, phone, response, status, remarks, created_by, created_at, updated_at)
	              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())`
	_, err = tx.Exec(ctx, infoQuery, infoID, req.IRID, req.ProspectName, req.Phone, "A", req.InfoStatus, nil, currentUser.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to create info: %v", err)
	}

	// Create Invite using the Info ID
	inviteID := uuid.New()
	mode := "virtual"
	if req.Mode != nil {
		mode = *req.Mode
	}

	inviteQuery := `INSERT INTO invites (id, info_id, ir_id, mode, status, remarks, created_at, updated_at)
	               VALUES ($1, $2, $3, $4, $5, $6, now(), now())`
	_, err = tx.Exec(ctx, inviteQuery, inviteID, infoID, req.IRID, mode, req.InviteStatus, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create invite: %v", err)
	}

	// Create Plan using the Invite ID
	planID := uuid.New()
	pipelineStatus := req.PipelineStatus
	if pipelineStatus == "" {
		pipelineStatus = "tentative"
	}

	planQuery := `INSERT INTO plans (id, invite_id, ir_id, ul1, ul2, quoted_amount, expected_uvs, status, remarks, pipeline_status, created_at, updated_at)
	             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now())`
	_, err = tx.Exec(ctx, planQuery, planID, inviteID, req.IRID, req.UL1, req.UL2, req.QuotedAmount, req.ExpectedUVs, req.Status, req.Remarks, pipelineStatus)
	if err != nil {
		return nil, fmt.Errorf("failed to create plan: %v", err)
	}

	// Increment plans_shown for the plan owner
	userQuery := `UPDATE users SET plans_shown = plans_shown + 1 WHERE ir_id = $1`
	_, err = tx.Exec(ctx, userQuery, req.IRID)
	if err != nil {
		return nil, fmt.Errorf("failed to increment plans_shown: %v", err)
	}

	// Commit transaction
	err = tx.Commit(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	// Fetch the created records
	plan, _ := s.GetPlanByID(ctx, planID)
	invite, _ := s.inviteRepo.GetByID(ctx, inviteID)
	info, _ := s.infoRepo.GetByID(ctx, infoID)

	return &models.PlanWithChainResponse{
		Plan:   plan,
		Invite: invite.ToResponse(),
		Info:   info,
	}, nil
}
