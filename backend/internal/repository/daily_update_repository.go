package repository

import (
	"context"
	"time"

	"github.com/Surajpragallapati03/activity-tracker/backend/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DailyUpdateRepository struct {
	db *pgxpool.Pool
}

func NewDailyUpdateRepository(db *pgxpool.Pool) *DailyUpdateRepository {
	return &DailyUpdateRepository{db: db}
}

func (r *DailyUpdateRepository) GetInfosForDate(ctx context.Context, irID string, date string) ([]models.Info, error) {
	dateTime, err := time.Parse("2006-01-02", date)
	if err != nil {
		return nil, err
	}

	endDate := dateTime.AddDate(0, 0, 1)

	query := `
		SELECT id, ir_id, prospect_name, phone, response, status, remarks, created_by, created_at, updated_at
		FROM infos
		WHERE ir_id = $1 AND created_at >= $2 AND created_at < $3
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(ctx, query, irID, dateTime, endDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var infos []models.Info
	for rows.Next() {
		var info models.Info
		err := rows.Scan(
			&info.ID, &info.IRID, &info.ProspectName, &info.Phone, &info.Response,
			&info.Status, &info.Remarks, &info.CreatedBy, &info.CreatedAt, &info.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		infos = append(infos, info)
	}

	return infos, rows.Err()
}

func (r *DailyUpdateRepository) GetInvitesForDate(ctx context.Context, irID string, date string) ([]models.InviteResponse, error) {
	dateTime, err := time.Parse("2006-01-02", date)
	if err != nil {
		return nil, err
	}

	query := `
		SELECT id, info_id, ir_id, meeting_date, meeting_time, mode, status, remarks, created_at, updated_at
		FROM invites
		WHERE ir_id = $1 AND (COALESCE(meeting_date, created_at::date) = $2::date OR (meeting_date IS NULL AND created_at >= $2::date AND created_at < ($2::date + interval '1 day')))
		ORDER BY COALESCE(meeting_date, created_at::date), created_at DESC
	`

	rows, err := r.db.Query(ctx, query, irID, dateTime)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var invites []models.InviteResponse
	for rows.Next() {
		var invite models.Invite
		err := rows.Scan(
			&invite.ID, &invite.InfoID, &invite.IRID, &invite.MeetingDate, &invite.MeetingTime,
			&invite.Mode, &invite.Status, &invite.Remarks, &invite.CreatedAt, &invite.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		invites = append(invites, *invite.ToResponse())
	}

	return invites, rows.Err()
}

func (r *DailyUpdateRepository) GetPlansForDate(ctx context.Context, irID string, date string) ([]models.Plan, error) {
	dateTime, err := time.Parse("2006-01-02", date)
	if err != nil {
		return nil, err
	}

	endDate := dateTime.AddDate(0, 0, 1)

	query := `
		SELECT id, invite_id, ir_id, ul1, ul2, quoted_amount, expected_uvs, status, remarks, pipeline_status, created_at, updated_at
		FROM plans
		WHERE ir_id = $1 AND created_at >= $2 AND created_at < $3
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(ctx, query, irID, dateTime, endDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var plans []models.Plan
	for rows.Next() {
		var plan models.Plan
		err := rows.Scan(
			&plan.ID, &plan.InviteID, &plan.IRID, &plan.UL1, &plan.UL2, &plan.QuotedAmount,
			&plan.ExpectedUVs, &plan.Status, &plan.Remarks, &plan.PipelineStatus, &plan.CreatedAt, &plan.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		plans = append(plans, plan)
	}

	return plans, rows.Err()
}

func (r *DailyUpdateRepository) GetClosingsForDate(ctx context.Context, irID string, date string) ([]models.ClosingResponse, error) {
	dateTime, err := time.Parse("2006-01-02", date)
	if err != nil {
		return nil, err
	}

	query := `
		SELECT id, plan_id, ir_id, closing_date, status, remarks, created_at, updated_at
		FROM closings
		WHERE ir_id = $1 AND (COALESCE(closing_date, created_at::date) = $2::date OR (closing_date IS NULL AND created_at >= $2::date AND created_at < ($2::date + interval '1 day')))
		ORDER BY COALESCE(closing_date, created_at::date), created_at DESC
	`

	rows, err := r.db.Query(ctx, query, irID, dateTime)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var closings []models.ClosingResponse
	for rows.Next() {
		var closing models.Closing
		err := rows.Scan(
			&closing.ID, &closing.PlanID, &closing.IRID, &closing.ClosingDate,
			&closing.Status, &closing.Remarks, &closing.CreatedAt, &closing.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		closings = append(closings, *closing.ToResponse())
	}

	return closings, rows.Err()
}

func (r *DailyUpdateRepository) GetFGInvitesForDate(ctx context.Context, irID string, date string) ([]models.FGInviteResponse, error) {
	dateTime, err := time.Parse("2006-01-02", date)
	if err != nil {
		return nil, err
	}

	query := `
		SELECT id, closing_id, ir_id, meeting_date, meeting_time, mode, status, remarks, created_at, updated_at
		FROM fg_invites
		WHERE ir_id = $1 AND (COALESCE(meeting_date, created_at::date) = $2::date OR (meeting_date IS NULL AND created_at >= $2::date AND created_at < ($2::date + interval '1 day')))
		ORDER BY COALESCE(meeting_date, created_at::date), created_at DESC
	`

	rows, err := r.db.Query(ctx, query, irID, dateTime)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var fgInvites []models.FGInviteResponse
	for rows.Next() {
		var fgInvite models.FGInvite
		err := rows.Scan(
			&fgInvite.ID, &fgInvite.ClosingID, &fgInvite.IRID, &fgInvite.MeetingDate, &fgInvite.MeetingTime,
			&fgInvite.Mode, &fgInvite.Status, &fgInvite.Remarks, &fgInvite.CreatedAt, &fgInvite.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		fgInvites = append(fgInvites, *fgInvite.ToResponse())
	}

	return fgInvites, rows.Err()
}

func (r *DailyUpdateRepository) GetFeelGoodsForDate(ctx context.Context, irID string, date string) ([]models.FeelGoodResponse, error) {
	dateTime, err := time.Parse("2006-01-02", date)
	if err != nil {
		return nil, err
	}

	endDate := dateTime.AddDate(0, 0, 1)

	query := `
		SELECT id, fg_invite_id, ir_id, ul1, ul2, status, remarks, created_at, updated_at
		FROM feel_goods
		WHERE ir_id = $1 AND created_at >= $2 AND created_at < $3
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(ctx, query, irID, dateTime, endDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var feelGoods []models.FeelGoodResponse
	for rows.Next() {
		var feelGood models.FeelGood
		err := rows.Scan(
			&feelGood.ID, &feelGood.FGInviteID, &feelGood.IRID, &feelGood.UL1, &feelGood.UL2,
			&feelGood.Status, &feelGood.Remarks, &feelGood.CreatedAt, &feelGood.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		feelGoods = append(feelGoods, *feelGood.ToResponse())
	}

	return feelGoods, rows.Err()
}

func (r *DailyUpdateRepository) GetInfoIRID(ctx context.Context, id string) (string, error) {
	var irID string
	err := r.db.QueryRow(ctx, "SELECT ir_id FROM infos WHERE id = $1", id).Scan(&irID)
	return irID, err
}

func (r *DailyUpdateRepository) GetInviteIRID(ctx context.Context, id string) (string, error) {
	var irID string
	err := r.db.QueryRow(ctx, "SELECT ir_id FROM invites WHERE id = $1", id).Scan(&irID)
	return irID, err
}

func (r *DailyUpdateRepository) GetPlanIRID(ctx context.Context, id string) (string, error) {
	var irID string
	err := r.db.QueryRow(ctx, "SELECT ir_id FROM plans WHERE id = $1", id).Scan(&irID)
	return irID, err
}

func (r *DailyUpdateRepository) GetClosingIRID(ctx context.Context, id string) (string, error) {
	var irID string
	err := r.db.QueryRow(ctx, "SELECT ir_id FROM closings WHERE id = $1", id).Scan(&irID)
	return irID, err
}

func (r *DailyUpdateRepository) GetFGInviteIRID(ctx context.Context, id string) (string, error) {
	var irID string
	err := r.db.QueryRow(ctx, "SELECT ir_id FROM fg_invites WHERE id = $1", id).Scan(&irID)
	return irID, err
}

func (r *DailyUpdateRepository) GetFeelGoodIRID(ctx context.Context, id string) (string, error) {
	var irID string
	err := r.db.QueryRow(ctx, "SELECT ir_id FROM feel_goods WHERE id = $1", id).Scan(&irID)
	return irID, err
}
