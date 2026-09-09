package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/models"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/repository"
)

type DailyUpdateService struct {
	db              *pgxpool.Pool
	dailyUpdateRepo *repository.DailyUpdateRepository
}

func NewDailyUpdateService(
	db *pgxpool.Pool,
	dailyUpdateRepo *repository.DailyUpdateRepository,
) *DailyUpdateService {
	return &DailyUpdateService{
		db:              db,
		dailyUpdateRepo: dailyUpdateRepo,
	}
}

func (s *DailyUpdateService) GetDailyUpdate(ctx context.Context, irID string, date string) (*models.DailyUpdateResponse, error) {
	// Validate date format
	_, err := time.Parse("2006-01-02", date)
	if err != nil {
		return nil, fmt.Errorf("invalid date format, use YYYY-MM-DD")
	}

	infos, err := s.dailyUpdateRepo.GetInfosForDate(ctx, irID, date)
	if err != nil {
		return nil, err
	}

	invites, err := s.dailyUpdateRepo.GetInvitesForDate(ctx, irID, date)
	if err != nil {
		return nil, err
	}

	plans, err := s.dailyUpdateRepo.GetPlansForDate(ctx, irID, date)
	if err != nil {
		return nil, err
	}

	closings, err := s.dailyUpdateRepo.GetClosingsForDate(ctx, irID, date)
	if err != nil {
		return nil, err
	}

	fgInvites, err := s.dailyUpdateRepo.GetFGInvitesForDate(ctx, irID, date)
	if err != nil {
		return nil, err
	}

	feelGoods, err := s.dailyUpdateRepo.GetFeelGoodsForDate(ctx, irID, date)
	if err != nil {
		return nil, err
	}

	// Handle nil slices
	if infos == nil {
		infos = []models.Info{}
	}
	if invites == nil {
		invites = []models.InviteResponse{}
	}
	if plans == nil {
		plans = []models.Plan{}
	}
	if closings == nil {
		closings = []models.ClosingResponse{}
	}
	if fgInvites == nil {
		fgInvites = []models.FGInviteResponse{}
	}
	if feelGoods == nil {
		feelGoods = []models.FeelGoodResponse{}
	}

	return &models.DailyUpdateResponse{
		Date:      date,
		Infos:     infos,
		Invites:   invites,
		Plans:     plans,
		Closings:  closings,
		FGInvites: fgInvites,
		FeelGoods: feelGoods,
	}, nil
}

func (s *DailyUpdateService) SaveDailyUpdate(ctx context.Context, req *models.DailyUpdateRequest, currentUser *models.User) (*models.DailyUpdateResponse, error) {
	// Validate and parse date
	activityDate, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		return nil, fmt.Errorf("invalid date format, use YYYY-MM-DD")
	}

	// Start transaction
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// Process all activities
	if req.Infos != nil {
		for _, activity := range req.Infos {
			err := s.processInfo(ctx, tx, activity, currentUser, activityDate)
			if err != nil {
				return nil, err
			}
		}
	}

	if req.Invites != nil {
		for _, activity := range req.Invites {
			err := s.processInvite(ctx, tx, activity, req.Date)
			if err != nil {
				return nil, err
			}
		}
	}

	if req.Plans != nil {
		for _, activity := range req.Plans {
			err := s.processPlan(ctx, tx, activity, currentUser, activityDate)
			if err != nil {
				return nil, err
			}
		}
	}

	if req.Closings != nil {
		for _, activity := range req.Closings {
			err := s.processClosing(ctx, tx, activity, req.Date)
			if err != nil {
				return nil, err
			}
		}
	}

	if req.FGInvites != nil {
		for _, activity := range req.FGInvites {
			err := s.processFGInvite(ctx, tx, activity, req.Date)
			if err != nil {
				return nil, err
			}
		}
	}

	if req.FeelGoods != nil {
		for _, activity := range req.FeelGoods {
			err := s.processFeelGood(ctx, tx, activity, currentUser, activityDate)
			if err != nil {
				return nil, err
			}
		}
	}

	// Commit transaction
	err = tx.Commit(ctx)
	if err != nil {
		return nil, err
	}

	// Fetch and return updated data
	return s.GetDailyUpdate(ctx, currentUser.IRID, req.Date)
}

func (s *DailyUpdateService) processInfo(ctx context.Context, tx pgx.Tx, activity models.DailyUpdateActivityRequest, currentUser *models.User, activityDate time.Time) error {
	switch activity.Action {
	case "create":
		return s.createInfoInTx(ctx, tx, activity, currentUser, activityDate)
	case "update":
		return s.updateInfoInTx(ctx, tx, activity)
	case "delete":
		return s.deleteInfoInTx(ctx, tx, activity)
	default:
		return fmt.Errorf("invalid action for info: %s", activity.Action)
	}
}

func (s *DailyUpdateService) createInfoInTx(ctx context.Context, tx pgx.Tx, activity models.DailyUpdateActivityRequest, currentUser *models.User, activityDate time.Time) error {
	data := activity.Data

	prospectName, ok := data["prospect_name"].(string)
	if !ok {
		return errors.New("missing or invalid prospect_name")
	}

	status, ok := data["status"].(string)
	if !ok {
		return errors.New("missing or invalid status")
	}

	response := extractOptionalString(data, "response")
	phone := extractOptionalString(data, "phone")
	remarks := extractOptionalString(data, "remarks")

	id := uuid.New()
	query := `INSERT INTO infos (id, ir_id, prospect_name, phone, response, status, remarks, created_by, created_at, updated_at)
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)`

	_, err := tx.Exec(ctx, query, id, currentUser.IRID, prospectName, phone, response, status, remarks, currentUser.ID, activityDate)
	return err
}

func (s *DailyUpdateService) updateInfoInTx(ctx context.Context, tx pgx.Tx, activity models.DailyUpdateActivityRequest) error {
	if activity.ID == "" {
		return errors.New("id required for update")
	}

	infoID, err := uuid.Parse(activity.ID)
	if err != nil {
		return fmt.Errorf("invalid info id")
	}

	updateClauses := []string{}
	args := []interface{}{}
	argNum := 1

	data := activity.Data

	if IRID, ok := data["ir_id"].(string); ok && IRID != "" {
		updateClauses = append(updateClauses, fmt.Sprintf("ir_id = $%d", argNum))
		args = append(args, IRID)
		argNum++
	}

	if prospectName, ok := data["prospect_name"].(string); ok && prospectName != "" {
		updateClauses = append(updateClauses, fmt.Sprintf("prospect_name = $%d", argNum))
		args = append(args, prospectName)
		argNum++
	}

	if status, ok := data["status"].(string); ok && status != "" {
		updateClauses = append(updateClauses, fmt.Sprintf("status = $%d", argNum))
		args = append(args, status)
		argNum++
	}

	if phone, ok := data["phone"]; ok {
		updateClauses = append(updateClauses, fmt.Sprintf("phone = $%d", argNum))
		args = append(args, phone)
		argNum++
	}

	if response, ok := data["response"]; ok {
		updateClauses = append(updateClauses, fmt.Sprintf("response = $%d", argNum))
		args = append(args, response)
		argNum++
	}

	if remarks, ok := data["remarks"]; ok {
		updateClauses = append(updateClauses, fmt.Sprintf("remarks = $%d", argNum))
		args = append(args, remarks)
		argNum++
	}

	if len(updateClauses) == 0 {
		return nil
	}

	updateClauses = append(updateClauses, fmt.Sprintf("updated_at = now()"))
	args = append(args, infoID)

	query := fmt.Sprintf("UPDATE infos SET %s WHERE id = $%d", buildUpdateClause(updateClauses), argNum)
	_, err = tx.Exec(ctx, query, args...)
	return err
}

func (s *DailyUpdateService) deleteInfoInTx(ctx context.Context, tx pgx.Tx, activity models.DailyUpdateActivityRequest) error {
	if activity.ID == "" {
		return errors.New("id required for delete")
	}

	infoID, err := uuid.Parse(activity.ID)
	if err != nil {
		return fmt.Errorf("invalid info id")
	}

	_, err = tx.Exec(ctx, "DELETE FROM infos WHERE id = $1", infoID)
	return err
}

func (s *DailyUpdateService) processInvite(ctx context.Context, tx pgx.Tx, activity models.DailyUpdateActivityRequest, dailyUpdateDate string) error {
	switch activity.Action {
	case "create":
		return s.createInviteInTx(ctx, tx, activity, dailyUpdateDate)
	case "update":
		return s.updateInviteInTx(ctx, tx, activity)
	case "delete":
		return s.deleteInviteInTx(ctx, tx, activity)
	default:
		return fmt.Errorf("invalid action for invite: %s", activity.Action)
	}
}

func (s *DailyUpdateService) createInviteInTx(ctx context.Context, tx pgx.Tx, activity models.DailyUpdateActivityRequest, dailyUpdateDate string) error {
	data := activity.Data

	infoID, ok := data["info_id"].(string)
	if !ok {
		return errors.New("missing or invalid info_id")
	}

	status, ok := data["status"].(string)
	if !ok {
		return errors.New("missing or invalid status")
	}

	infoUUID, err := uuid.Parse(infoID)
	if err != nil {
		return fmt.Errorf("invalid info_id")
	}

	var meetingDate *time.Time
	var meetingTime *time.Time

	// Default meeting_date to daily update date if not provided
	if mdStr, ok := data["meeting_date"].(string); ok && mdStr != "" {
		md, err := time.Parse("2006-01-02", mdStr)
		if err == nil {
			meetingDate = &md
		}
	} else {
		// Default to daily update date
		md, err := time.Parse("2006-01-02", dailyUpdateDate)
		if err == nil {
			meetingDate = &md
		}
	}

	if mtStr, ok := data["meeting_time"].(string); ok && mtStr != "" {
		mt, err := time.Parse("15:04:05", mtStr)
		if err == nil {
			meetingTime = &mt
		}
	}

	mode := extractOptionalString(data, "mode")
	remarks := extractOptionalString(data, "remarks")

	// Get ir_id from the info record
	var irID string
	err = tx.QueryRow(ctx, "SELECT ir_id FROM infos WHERE id = $1", infoUUID).Scan(&irID)
	if err != nil {
		return fmt.Errorf("cannot get ir_id from info: %w", err)
	}

	id := uuid.New()
	query := `INSERT INTO invites (id, info_id, ir_id, meeting_date, meeting_time, mode, status, remarks, created_at, updated_at)
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())`

	_, err = tx.Exec(ctx, query, id, infoUUID, irID, meetingDate, meetingTime, mode, status, remarks)
	return err
}

func (s *DailyUpdateService) updateInviteInTx(ctx context.Context, tx pgx.Tx, activity models.DailyUpdateActivityRequest) error {
	if activity.ID == "" {
		return errors.New("id required for update")
	}

	inviteID, err := uuid.Parse(activity.ID)
	if err != nil {
		return fmt.Errorf("invalid invite id")
	}

	updateClauses := []string{}
	args := []interface{}{}
	argNum := 1

	data := activity.Data

	if status, ok := data["status"].(string); ok && status != "" {
		updateClauses = append(updateClauses, fmt.Sprintf("status = $%d", argNum))
		args = append(args, status)
		argNum++
	}

	if mdStr, ok := data["meeting_date"].(string); ok {
		if mdStr == "" {
			updateClauses = append(updateClauses, fmt.Sprintf("meeting_date = NULL"))
		} else {
			md, err := time.Parse("2006-01-02", mdStr)
			if err == nil {
				updateClauses = append(updateClauses, fmt.Sprintf("meeting_date = $%d", argNum))
				args = append(args, md)
				argNum++
			}
		}
	}

	if mtStr, ok := data["meeting_time"].(string); ok {
		if mtStr == "" {
			updateClauses = append(updateClauses, fmt.Sprintf("meeting_time = NULL"))
		} else {
			mt, err := time.Parse("15:04:05", mtStr)
			if err == nil {
				updateClauses = append(updateClauses, fmt.Sprintf("meeting_time = $%d", argNum))
				args = append(args, mt)
				argNum++
			}
		}
	}

	if mode, ok := data["mode"]; ok {
		updateClauses = append(updateClauses, fmt.Sprintf("mode = $%d", argNum))
		args = append(args, mode)
		argNum++
	}

	if remarks, ok := data["remarks"]; ok {
		updateClauses = append(updateClauses, fmt.Sprintf("remarks = $%d", argNum))
		args = append(args, remarks)
		argNum++
	}

	if len(updateClauses) == 0 {
		return nil
	}

	updateClauses = append(updateClauses, fmt.Sprintf("updated_at = now()"))
	args = append(args, inviteID)

	query := fmt.Sprintf("UPDATE invites SET %s WHERE id = $%d", buildUpdateClause(updateClauses), argNum)
	_, err = tx.Exec(ctx, query, args...)
	return err
}

func (s *DailyUpdateService) deleteInviteInTx(ctx context.Context, tx pgx.Tx, activity models.DailyUpdateActivityRequest) error {
	if activity.ID == "" {
		return errors.New("id required for delete")
	}

	inviteID, err := uuid.Parse(activity.ID)
	if err != nil {
		return fmt.Errorf("invalid invite id")
	}

	_, err = tx.Exec(ctx, "DELETE FROM invites WHERE id = $1", inviteID)
	return err
}

func (s *DailyUpdateService) processPlan(ctx context.Context, tx pgx.Tx, activity models.DailyUpdateActivityRequest, currentUser *models.User, activityDate time.Time) error {
	switch activity.Action {
	case "create":
		return s.createPlanInTx(ctx, tx, activity, currentUser, activityDate)
	case "update":
		return s.updatePlanInTx(ctx, tx, activity)
	case "delete":
		return s.deletePlanInTx(ctx, tx, activity)
	default:
		return fmt.Errorf("invalid action for plan: %s", activity.Action)
	}
}

func (s *DailyUpdateService) createPlanInTx(ctx context.Context, tx pgx.Tx, activity models.DailyUpdateActivityRequest, currentUser *models.User, activityDate time.Time) error {
	data := activity.Data

	inviteID, ok := data["invite_id"].(string)
	if !ok {
		return errors.New("missing or invalid invite_id")
	}

	ul1, ok := data["ul1"].(string)
	if !ok {
		return errors.New("missing or invalid ul1")
	}

	ul2, ok := data["ul2"].(string)
	if !ok {
		return errors.New("missing or invalid ul2")
	}

	quotedAmount, ok := data["quoted_amount"].(string)
	if !ok {
		return errors.New("missing or invalid quoted_amount")
	}

	var expectedUVs float64
	if euv, ok := data["expected_uvs"].(float64); ok {
		expectedUVs = euv
	} else if euvStr, ok := data["expected_uvs"].(string); ok {
		_, err := fmt.Sscanf(euvStr, "%f", &expectedUVs)
		if err != nil {
			return errors.New("invalid expected_uvs")
		}
	} else {
		return errors.New("missing or invalid expected_uvs")
	}

	status, ok := data["status"].(string)
	if !ok {
		return errors.New("missing or invalid status")
	}

	remarks, ok := data["remarks"].(string)
	if !ok {
		remarks = ""
	}

	inviteUUID, err := uuid.Parse(inviteID)
	if err != nil {
		return fmt.Errorf("invalid invite_id")
	}

	// Get ir_id from the invite record
	var irID string
	err = tx.QueryRow(ctx, "SELECT ir_id FROM invites WHERE id = $1", inviteUUID).Scan(&irID)
	if err != nil {
		return fmt.Errorf("cannot get ir_id from invite: %w", err)
	}

	// New plans always have tentative status
	pipelineStatus := "tentative"

	id := uuid.New()
	query := `INSERT INTO plans (id, invite_id, ir_id, ul1, ul2, quoted_amount, expected_uvs, status, remarks, pipeline_status, created_at, updated_at)
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)`

	_, err = tx.Exec(ctx, query, id, inviteUUID, irID, ul1, ul2, quotedAmount, expectedUVs, status, remarks, pipelineStatus, activityDate)
	if err != nil {
		return err
	}

	// Increment plans_shown for the plan owner
	updateUserQuery := `UPDATE users SET plans_shown = plans_shown + 1, updated_at = now() WHERE ir_id = $1`
	_, err = tx.Exec(ctx, updateUserQuery, irID)

	return err
}

func (s *DailyUpdateService) updatePlanInTx(ctx context.Context, tx pgx.Tx, activity models.DailyUpdateActivityRequest) error {
	if activity.ID == "" {
		return errors.New("id required for update")
	}

	planID, err := uuid.Parse(activity.ID)
	if err != nil {
		return fmt.Errorf("invalid plan id")
	}

	updateClauses := []string{}
	args := []interface{}{}
	argNum := 1

	data := activity.Data

	if ul1, ok := data["ul1"].(string); ok && ul1 != "" {
		updateClauses = append(updateClauses, fmt.Sprintf("ul1 = $%d", argNum))
		args = append(args, ul1)
		argNum++
	}

	if ul2, ok := data["ul2"].(string); ok && ul2 != "" {
		updateClauses = append(updateClauses, fmt.Sprintf("ul2 = $%d", argNum))
		args = append(args, ul2)
		argNum++
	}

	if quotedAmount, ok := data["quoted_amount"].(string); ok && quotedAmount != "" {
		updateClauses = append(updateClauses, fmt.Sprintf("quoted_amount = $%d", argNum))
		args = append(args, quotedAmount)
		argNum++
	}

	if euv, ok := data["expected_uvs"].(float64); ok {
		updateClauses = append(updateClauses, fmt.Sprintf("expected_uvs = $%d", argNum))
		args = append(args, euv)
		argNum++
	}

	if status, ok := data["status"].(string); ok && status != "" {
		updateClauses = append(updateClauses, fmt.Sprintf("status = $%d", argNum))
		args = append(args, status)
		argNum++
	}

	if remarks, ok := data["remarks"].(string); ok {
		updateClauses = append(updateClauses, fmt.Sprintf("remarks = $%d", argNum))
		args = append(args, remarks)
		argNum++
	}

	if ps, ok := data["pipeline_status"].(string); ok && ps != "" {
		updateClauses = append(updateClauses, fmt.Sprintf("pipeline_status = $%d", argNum))
		args = append(args, ps)
		argNum++
	}

	if len(updateClauses) == 0 {
		return nil
	}

	updateClauses = append(updateClauses, fmt.Sprintf("updated_at = now()"))
	args = append(args, planID)

	query := fmt.Sprintf("UPDATE plans SET %s WHERE id = $%d", buildUpdateClause(updateClauses), argNum)
	_, err = tx.Exec(ctx, query, args...)
	return err
}

func (s *DailyUpdateService) deletePlanInTx(ctx context.Context, tx pgx.Tx, activity models.DailyUpdateActivityRequest) error {
	if activity.ID == "" {
		return errors.New("id required for delete")
	}

	planID, err := uuid.Parse(activity.ID)
	if err != nil {
		return fmt.Errorf("invalid plan id")
	}

	_, err = tx.Exec(ctx, "DELETE FROM plans WHERE id = $1", planID)
	return err
}

func (s *DailyUpdateService) processClosing(ctx context.Context, tx pgx.Tx, activity models.DailyUpdateActivityRequest, dailyUpdateDate string) error {
	switch activity.Action {
	case "create":
		return s.createClosingInTx(ctx, tx, activity, dailyUpdateDate)
	case "update":
		return s.updateClosingInTx(ctx, tx, activity)
	case "delete":
		return s.deleteClosingInTx(ctx, tx, activity)
	default:
		return fmt.Errorf("invalid action for closing: %s", activity.Action)
	}
}

func (s *DailyUpdateService) createClosingInTx(ctx context.Context, tx pgx.Tx, activity models.DailyUpdateActivityRequest, dailyUpdateDate string) error {
	data := activity.Data

	planID, ok := data["plan_id"].(string)
	if !ok {
		return errors.New("missing or invalid plan_id")
	}

	status, ok := data["status"].(string)
	if !ok {
		return errors.New("missing or invalid status")
	}

	planUUID, err := uuid.Parse(planID)
	if err != nil {
		return fmt.Errorf("invalid plan_id")
	}

	// Default closing_date to daily update date if not provided
	var closingDate time.Time
	if cdStr, ok := data["closing_date"].(string); ok && cdStr != "" {
		cd, err := time.Parse("2006-01-02", cdStr)
		if err != nil {
			return fmt.Errorf("invalid closing_date format")
		}
		closingDate = cd
	} else {
		// Default to daily update date
		cd, err := time.Parse("2006-01-02", dailyUpdateDate)
		if err != nil {
			return fmt.Errorf("invalid daily update date")
		}
		closingDate = cd
	}

	// Get ir_id from the plan record
	var irID string
	err = tx.QueryRow(ctx, "SELECT ir_id FROM plans WHERE id = $1", planUUID).Scan(&irID)
	if err != nil {
		return fmt.Errorf("cannot get ir_id from plan: %w", err)
	}

	remarks := extractOptionalString(data, "remarks")

	id := uuid.New()
	query := `INSERT INTO closings (id, plan_id, ir_id, closing_date, status, remarks, created_at, updated_at)
	          VALUES ($1, $2, $3, $4, $5, $6, now(), now())`

	_, err = tx.Exec(ctx, query, id, planUUID, irID, closingDate, status, remarks)
	return err
}

func (s *DailyUpdateService) updateClosingInTx(ctx context.Context, tx pgx.Tx, activity models.DailyUpdateActivityRequest) error {
	if activity.ID == "" {
		return errors.New("id required for update")
	}

	closingID, err := uuid.Parse(activity.ID)
	if err != nil {
		return fmt.Errorf("invalid closing id")
	}

	updateClauses := []string{}
	args := []interface{}{}
	argNum := 1

	data := activity.Data

	if cdStr, ok := data["closing_date"].(string); ok && cdStr != "" {
		cd, err := time.Parse("2006-01-02", cdStr)
		if err == nil {
			updateClauses = append(updateClauses, fmt.Sprintf("closing_date = $%d", argNum))
			args = append(args, cd)
			argNum++
		}
	}

	if status, ok := data["status"].(string); ok && status != "" {
		updateClauses = append(updateClauses, fmt.Sprintf("status = $%d", argNum))
		args = append(args, status)
		argNum++
	}

	if remarks, ok := data["remarks"]; ok {
		updateClauses = append(updateClauses, fmt.Sprintf("remarks = $%d", argNum))
		args = append(args, remarks)
		argNum++
	}

	if len(updateClauses) == 0 {
		return nil
	}

	updateClauses = append(updateClauses, fmt.Sprintf("updated_at = now()"))
	args = append(args, closingID)

	query := fmt.Sprintf("UPDATE closings SET %s WHERE id = $%d", buildUpdateClause(updateClauses), argNum)
	_, err = tx.Exec(ctx, query, args...)
	return err
}

func (s *DailyUpdateService) deleteClosingInTx(ctx context.Context, tx pgx.Tx, activity models.DailyUpdateActivityRequest) error {
	if activity.ID == "" {
		return errors.New("id required for delete")
	}

	closingID, err := uuid.Parse(activity.ID)
	if err != nil {
		return fmt.Errorf("invalid closing id")
	}

	_, err = tx.Exec(ctx, "DELETE FROM closings WHERE id = $1", closingID)
	return err
}

func (s *DailyUpdateService) processFGInvite(ctx context.Context, tx pgx.Tx, activity models.DailyUpdateActivityRequest, dailyUpdateDate string) error {
	switch activity.Action {
	case "create":
		return s.createFGInviteInTx(ctx, tx, activity, dailyUpdateDate)
	case "update":
		return s.updateFGInviteInTx(ctx, tx, activity)
	case "delete":
		return s.deleteFGInviteInTx(ctx, tx, activity)
	default:
		return fmt.Errorf("invalid action for fg_invite: %s", activity.Action)
	}
}

func (s *DailyUpdateService) createFGInviteInTx(ctx context.Context, tx pgx.Tx, activity models.DailyUpdateActivityRequest, dailyUpdateDate string) error {
	data := activity.Data

	closingID, ok := data["closing_id"].(string)
	if !ok {
		return errors.New("missing or invalid closing_id")
	}

	status, ok := data["status"].(string)
	if !ok {
		return errors.New("missing or invalid status")
	}

	closingUUID, err := uuid.Parse(closingID)
	if err != nil {
		return fmt.Errorf("invalid closing_id")
	}

	var meetingDate *time.Time
	var meetingTime *time.Time

	// Default meeting_date to daily update date if not provided
	if mdStr, ok := data["meeting_date"].(string); ok && mdStr != "" {
		md, err := time.Parse("2006-01-02", mdStr)
		if err == nil {
			meetingDate = &md
		}
	} else {
		// Default to daily update date
		md, err := time.Parse("2006-01-02", dailyUpdateDate)
		if err == nil {
			meetingDate = &md
		}
	}

	if mtStr, ok := data["meeting_time"].(string); ok && mtStr != "" {
		mt, err := time.Parse("15:04:05", mtStr)
		if err == nil {
			meetingTime = &mt
		}
	}

	// Get ir_id from the closing record
	var irID string
	err = tx.QueryRow(ctx, "SELECT ir_id FROM closings WHERE id = $1", closingUUID).Scan(&irID)
	if err != nil {
		return fmt.Errorf("cannot get ir_id from closing: %w", err)
	}

	mode := extractOptionalString(data, "mode")
	remarks := extractOptionalString(data, "remarks")

	id := uuid.New()
	query := `INSERT INTO fg_invites (id, closing_id, ir_id, meeting_date, meeting_time, mode, status, remarks, created_at, updated_at)
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())`

	_, err = tx.Exec(ctx, query, id, closingUUID, irID, meetingDate, meetingTime, mode, status, remarks)
	return err
}

func (s *DailyUpdateService) updateFGInviteInTx(ctx context.Context, tx pgx.Tx, activity models.DailyUpdateActivityRequest) error {
	if activity.ID == "" {
		return errors.New("id required for update")
	}

	fgInviteID, err := uuid.Parse(activity.ID)
	if err != nil {
		return fmt.Errorf("invalid fg_invite id")
	}

	updateClauses := []string{}
	args := []interface{}{}
	argNum := 1

	data := activity.Data

	if status, ok := data["status"].(string); ok && status != "" {
		updateClauses = append(updateClauses, fmt.Sprintf("status = $%d", argNum))
		args = append(args, status)
		argNum++
	}

	if mdStr, ok := data["meeting_date"].(string); ok {
		if mdStr == "" {
			updateClauses = append(updateClauses, fmt.Sprintf("meeting_date = NULL"))
		} else {
			md, err := time.Parse("2006-01-02", mdStr)
			if err == nil {
				updateClauses = append(updateClauses, fmt.Sprintf("meeting_date = $%d", argNum))
				args = append(args, md)
				argNum++
			}
		}
	}

	if mtStr, ok := data["meeting_time"].(string); ok {
		if mtStr == "" {
			updateClauses = append(updateClauses, fmt.Sprintf("meeting_time = NULL"))
		} else {
			mt, err := time.Parse("15:04:05", mtStr)
			if err == nil {
				updateClauses = append(updateClauses, fmt.Sprintf("meeting_time = $%d", argNum))
				args = append(args, mt)
				argNum++
			}
		}
	}

	if mode, ok := data["mode"]; ok {
		updateClauses = append(updateClauses, fmt.Sprintf("mode = $%d", argNum))
		args = append(args, mode)
		argNum++
	}

	if remarks, ok := data["remarks"]; ok {
		updateClauses = append(updateClauses, fmt.Sprintf("remarks = $%d", argNum))
		args = append(args, remarks)
		argNum++
	}

	if len(updateClauses) == 0 {
		return nil
	}

	updateClauses = append(updateClauses, fmt.Sprintf("updated_at = now()"))
	args = append(args, fgInviteID)

	query := fmt.Sprintf("UPDATE fg_invites SET %s WHERE id = $%d", buildUpdateClause(updateClauses), argNum)
	_, err = tx.Exec(ctx, query, args...)
	return err
}

func (s *DailyUpdateService) deleteFGInviteInTx(ctx context.Context, tx pgx.Tx, activity models.DailyUpdateActivityRequest) error {
	if activity.ID == "" {
		return errors.New("id required for delete")
	}

	fgInviteID, err := uuid.Parse(activity.ID)
	if err != nil {
		return fmt.Errorf("invalid fg_invite id")
	}

	_, err = tx.Exec(ctx, "DELETE FROM fg_invites WHERE id = $1", fgInviteID)
	return err
}

func (s *DailyUpdateService) processFeelGood(ctx context.Context, tx pgx.Tx, activity models.DailyUpdateActivityRequest, currentUser *models.User, activityDate time.Time) error {
	switch activity.Action {
	case "create":
		return s.createFeelGoodInTx(ctx, tx, activity, activityDate)
	case "update":
		return s.updateFeelGoodInTx(ctx, tx, activity)
	case "delete":
		return s.deleteFeelGoodInTx(ctx, tx, activity)
	default:
		return fmt.Errorf("invalid action for feel_good: %s", activity.Action)
	}
}

func (s *DailyUpdateService) createFeelGoodInTx(ctx context.Context, tx pgx.Tx, activity models.DailyUpdateActivityRequest, activityDate time.Time) error {
	data := activity.Data

	fgInviteID, ok := data["fg_invite_id"].(string)
	if !ok {
		return errors.New("missing or invalid fg_invite_id")
	}

	ul1, ok := data["ul1"].(string)
	if !ok {
		return errors.New("missing or invalid ul1")
	}

	ul2, ok := data["ul2"].(string)
	if !ok {
		return errors.New("missing or invalid ul2")
	}

	status, ok := data["status"].(string)
	if !ok {
		return errors.New("missing or invalid status")
	}

	fgInviteUUID, err := uuid.Parse(fgInviteID)
	if err != nil {
		return fmt.Errorf("invalid fg_invite_id")
	}

	// Get ir_id from the fg_invite record
	var irID string
	err = tx.QueryRow(ctx, "SELECT ir_id FROM fg_invites WHERE id = $1", fgInviteUUID).Scan(&irID)
	if err != nil {
		return fmt.Errorf("cannot get ir_id from fg_invite: %w", err)
	}

	remarks := extractOptionalString(data, "remarks")

	id := uuid.New()
	query := `INSERT INTO feel_goods (id, fg_invite_id, ir_id, ul1, ul2, status, remarks, created_at, updated_at)
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)`

	_, err = tx.Exec(ctx, query, id, fgInviteUUID, irID, ul1, ul2, status, remarks, activityDate)
	return err
}

func (s *DailyUpdateService) updateFeelGoodInTx(ctx context.Context, tx pgx.Tx, activity models.DailyUpdateActivityRequest) error {
	if activity.ID == "" {
		return errors.New("id required for update")
	}

	feelGoodID, err := uuid.Parse(activity.ID)
	if err != nil {
		return fmt.Errorf("invalid feel_good id")
	}

	updateClauses := []string{}
	args := []interface{}{}
	argNum := 1

	data := activity.Data

	if ul1, ok := data["ul1"].(string); ok && ul1 != "" {
		updateClauses = append(updateClauses, fmt.Sprintf("ul1 = $%d", argNum))
		args = append(args, ul1)
		argNum++
	}

	if ul2, ok := data["ul2"].(string); ok && ul2 != "" {
		updateClauses = append(updateClauses, fmt.Sprintf("ul2 = $%d", argNum))
		args = append(args, ul2)
		argNum++
	}

	if status, ok := data["status"].(string); ok && status != "" {
		updateClauses = append(updateClauses, fmt.Sprintf("status = $%d", argNum))
		args = append(args, status)
		argNum++
	}

	if remarks, ok := data["remarks"]; ok {
		updateClauses = append(updateClauses, fmt.Sprintf("remarks = $%d", argNum))
		args = append(args, remarks)
		argNum++
	}

	if len(updateClauses) == 0 {
		return nil
	}

	updateClauses = append(updateClauses, fmt.Sprintf("updated_at = now()"))
	args = append(args, feelGoodID)

	query := fmt.Sprintf("UPDATE feel_goods SET %s WHERE id = $%d", buildUpdateClause(updateClauses), argNum)
	_, err = tx.Exec(ctx, query, args...)
	return err
}

func (s *DailyUpdateService) deleteFeelGoodInTx(ctx context.Context, tx pgx.Tx, activity models.DailyUpdateActivityRequest) error {
	if activity.ID == "" {
		return errors.New("id required for delete")
	}

	feelGoodID, err := uuid.Parse(activity.ID)
	if err != nil {
		return fmt.Errorf("invalid feel_good id")
	}

	_, err = tx.Exec(ctx, "DELETE FROM feel_goods WHERE id = $1", feelGoodID)
	return err
}

func buildUpdateClause(clauses []string) string {
	result := ""
	for i, clause := range clauses {
		if i > 0 {
			result += ", "
		}
		result += clause
	}
	return result
}

func extractOptionalString(data map[string]interface{}, key string) *string {
	if val, ok := data[key]; ok {
		if strVal, ok := val.(string); ok && strVal != "" {
			return &strVal
		}
	}
	return nil
}
