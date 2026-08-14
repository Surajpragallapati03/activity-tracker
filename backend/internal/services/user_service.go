package services

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/models"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/repository"
)

type UserService struct {
	repo *repository.UserRepository
}

func NewUserService(repo *repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) CreateUser(ctx context.Context, req *models.CreateUserRequest) (*models.User, error) {
	if !isValidRole(req.Role) {
		return nil, fmt.Errorf("invalid role: %s", req.Role)
	}

	if req.Status == "" {
		req.Status = "active"
	}

	if req.Status != "" && !isValidStatus(req.Status) {
		return nil, fmt.Errorf("invalid status: %s", req.Status)
	}

	if req.UplineID != nil {
		upline, err := s.repo.GetByID(ctx, *req.UplineID)
		if err != nil {
			return nil, err
		}
		if upline == nil {
			return nil, fmt.Errorf("upline user not found")
		}
	}

	user := &models.User{
		IRID:     req.IRID,
		Name:     req.Name,
		Email:    req.Email,
		Phone:    req.Phone,
		Role:     req.Role,
		UplineID: req.UplineID,
		Status:   req.Status,
	}

	err := s.repo.Create(ctx, user)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (s *UserService) CreateUserWithPromotion(ctx context.Context, creator *models.User, req *models.CreateUserRequest) (*models.User, error) {
	if !isValidRole(req.Role) {
		return nil, fmt.Errorf("invalid role: %s", req.Role)
	}

	if req.Status == "" {
		req.Status = "active"
	}

	if req.Status != "" && !isValidStatus(req.Status) {
		return nil, fmt.Errorf("invalid status: %s", req.Status)
	}

	if req.UplineID != nil {
		upline, err := s.repo.GetByID(ctx, *req.UplineID)
		if err != nil {
			return nil, err
		}
		if upline == nil {
			return nil, fmt.Errorf("upline user not found")
		}

		// Non-admin users can only create under themselves or their downlines
		if creator.Role != "admin" {
			// Check if upline_id is creator themselves or a downline
			if *req.UplineID != creator.ID {
				return nil, fmt.Errorf("forbidden: non-admin users can only create users under themselves")
			}
		}
	}

	user := &models.User{
		IRID:     req.IRID,
		Name:     req.Name,
		Email:    req.Email,
		Phone:    req.Phone,
		Role:     req.Role,
		UplineID: req.UplineID,
		Status:   req.Status,
	}

	err := s.repo.Create(ctx, user)
	if err != nil {
		return nil, err
	}

	// If creator is IR (not admin, not upline), promote them to upline
	if creator.Role == "ir" {
		updateReq := &models.UpdateUserRequest{
			Role: "upline",
		}
		err = s.repo.Update(ctx, creator.ID, updateReq)
		if err != nil {
			return nil, err
		}
	}

	return user, nil
}

func (s *UserService) GetUserByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *UserService) UpdateUser(ctx context.Context, id uuid.UUID, req *models.UpdateUserRequest) (*models.User, error) {
	if req.Role != "" && !isValidRole(req.Role) {
		return nil, fmt.Errorf("invalid role: %s", req.Role)
	}

	if req.Status != "" && !isValidStatus(req.Status) {
		return nil, fmt.Errorf("invalid status: %s", req.Status)
	}

	if req.UplineID != nil {
		upline, err := s.repo.GetByID(ctx, *req.UplineID)
		if err != nil {
			return nil, err
		}
		if upline == nil {
			return nil, fmt.Errorf("upline user not found")
		}
	}

	err := s.repo.Update(ctx, id, req)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, err
	}

	return s.repo.GetByID(ctx, id)
}

func (s *UserService) DeleteUser(ctx context.Context, id uuid.UUID) error {
	err := s.repo.DeleteWithReparenting(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return fmt.Errorf("user not found")
		}
		return err
	}
	return nil
}

func (s *UserService) ListUsers(ctx context.Context, query *models.ListUsersQuery) (*models.ListUsersResponse, error) {
	users, total, err := s.repo.List(ctx, query)
	if err != nil {
		return nil, err
	}

	if users == nil {
		users = []models.User{}
	}

	return &models.ListUsersResponse{
		Data:  users,
		Total: total,
		Page:  query.Page,
		Limit: query.Limit,
	}, nil
}

func isValidRole(role string) bool {
	validRoles := map[string]bool{
		"admin":  true,
		"upline": true,
		"ir":     true,
	}
	return validRoles[role]
}

func isValidStatus(status string) bool {
	validStatus := map[string]bool{
		"active":   true,
		"inactive": true,
	}
	return validStatus[status]
}
