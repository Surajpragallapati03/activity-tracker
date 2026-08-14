package services

import (
	"context"

	"github.com/google/uuid"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/models"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/repository"
)

type AuthorizationService struct {
	userRepo *repository.UserRepository
}

func NewAuthorizationService(userRepo *repository.UserRepository) *AuthorizationService {
	return &AuthorizationService{
		userRepo: userRepo,
	}
}

// CanViewActivity checks if user can view an activity owned by the given IR.
// Admin can view all. User can view own and downline activities.
func (s *AuthorizationService) CanViewActivity(ctx context.Context, user *models.User, activityIRID string) bool {
	return s.CanAccessActivityForIR(ctx, user, activityIRID)
}

// CanCreateActivityForIR checks if user can create an activity for the given IR.
// Admin can create for any IR. User can create for own and downline IRs.
func (s *AuthorizationService) CanCreateActivityForIR(ctx context.Context, user *models.User, irID string) bool {
	return s.CanAccessActivityForIR(ctx, user, irID)
}

// CanUpdateActivity checks if user can update an activity owned by the given IR.
// Admin can update any. User can update own and downline activities.
func (s *AuthorizationService) CanUpdateActivity(ctx context.Context, user *models.User, activityIRID string) bool {
	return s.CanAccessActivityForIR(ctx, user, activityIRID)
}

// CanDeleteActivity checks if user can delete an activity owned by the given IR.
// Admin can delete any. User can delete own and downline activities.
func (s *AuthorizationService) CanDeleteActivity(ctx context.Context, user *models.User, activityIRID string) bool {
	return s.CanAccessActivityForIR(ctx, user, activityIRID)
}

// CanAccessActivityForIR is the core authorization check.
// Admin always has access. User has access to own activities and all downline activities.
func (s *AuthorizationService) CanAccessActivityForIR(ctx context.Context, user *models.User, activityIRID string) bool {
	if user.Role == "admin" {
		return true
	}

	if user.IRID == activityIRID {
		return true
	}

	return s.isDownline(ctx, user.ID, activityIRID)
}

// CanAccessUser checks if user can view/manage another user.
// Admin always has access. User has access to self and all downlines.
func (s *AuthorizationService) CanAccessUser(ctx context.Context, user *models.User, targetUser *models.User) bool {
	if user.Role == "admin" {
		return true
	}

	if user.ID == targetUser.ID {
		return true
	}

	return s.isInUplineChain(ctx, targetUser, user.ID)
}

// CanCreateUserUnder checks if user can create a user under a specified upline.
// Admin can create under any upline. Non-admin can only create under themselves.
func (s *AuthorizationService) CanCreateUserUnder(ctx context.Context, user *models.User, uplineID *uuid.UUID) bool {
	if user.Role == "admin" {
		return true
	}

	// Non-admin can only create under themselves
	if uplineID == nil {
		return false // Must specify an upline for non-admin
	}

	return *uplineID == user.ID
}

// GetAccessibleIRIDs returns all IR IDs that the user can access.
// For admin, returns nil (meaning all IRs). For others, returns own and downline IRs.
func (s *AuthorizationService) GetAccessibleIRIDs(ctx context.Context, user *models.User) ([]string, error) {
	if user.Role == "admin" {
		return nil, nil // Admin has access to all, no filtering needed
	}

	irids := []string{user.IRID}
	downlines, err := s.getDownlineIRIDs(ctx, user.ID)
	if err != nil {
		return nil, err
	}
	irids = append(irids, downlines...)
	return irids, nil
}

// isDownline checks if activityIRID belongs to a downline of uplineID.
func (s *AuthorizationService) isDownline(ctx context.Context, uplineID uuid.UUID, irID string) bool {
	user, err := s.userRepo.GetByIRID(ctx, irID)
	if err != nil || user == nil {
		return false
	}

	return s.isInUplineChain(ctx, user, uplineID)
}

// isInUplineChain checks if targetID is in the upline chain of user.
func (s *AuthorizationService) isInUplineChain(ctx context.Context, user *models.User, targetID uuid.UUID) bool {
	current := user
	for current.UplineID != nil {
		if *current.UplineID == targetID {
			return true
		}

		uplineUser, err := s.userRepo.GetByID(ctx, *current.UplineID)
		if err != nil || uplineUser == nil {
			return false
		}
		current = uplineUser
	}
	return false
}

// getDownlineIRIDs recursively gets all IR IDs of downlines for a user.
func (s *AuthorizationService) getDownlineIRIDs(ctx context.Context, userID uuid.UUID) ([]string, error) {
	query := &models.ListUsersQuery{
		Page:  1,
		Limit: 1000, // Max 50 users per CLAUDE.md, but fetch enough to be safe
	}

	users, _, err := s.userRepo.List(ctx, query)
	if err != nil {
		return nil, err
	}

	// Build a map of user ID to user for quick lookup
	userMap := make(map[uuid.UUID]*models.User)
	for i := range users {
		userMap[users[i].ID] = &users[i]
	}

	var irids []string
	s.collectDownlineIRIDs(userID, userMap, &irids)
	return irids, nil
}

// collectDownlineIRIDs recursively collects IR IDs of all downlines.
func (s *AuthorizationService) collectDownlineIRIDs(userID uuid.UUID, userMap map[uuid.UUID]*models.User, irids *[]string) {
	for _, user := range userMap {
		if user.UplineID != nil && *user.UplineID == userID {
			*irids = append(*irids, user.IRID)
			// Recursively get downlines of this user
			s.collectDownlineIRIDs(user.ID, userMap, irids)
		}
	}
}
