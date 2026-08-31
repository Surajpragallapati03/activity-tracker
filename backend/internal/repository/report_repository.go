package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/models"
)

type ReportRepository struct {
	db *pgxpool.Pool
}

func NewReportRepository(db *pgxpool.Pool) *ReportRepository {
	return &ReportRepository{db: db}
}

func (r *ReportRepository) CountActivities(ctx context.Context, irID string, startDate, endDate string) (*models.ActivityCounts, error) {
	counts := &models.ActivityCounts{}

	query := fmt.Sprintf(`
		SELECT
			(SELECT COUNT(*) FROM infos WHERE ir_id = $1 AND created_at >= $2::date AND created_at < ($3::date + interval '1 day')) as infos,
			(SELECT COUNT(*) FROM invites WHERE ir_id = $1 AND created_at >= $2::date AND created_at < ($3::date + interval '1 day')) as invites,
			(SELECT COUNT(*) FROM plans WHERE ir_id = $1 AND created_at >= $2::date AND created_at < ($3::date + interval '1 day')) as plans,
			(SELECT COUNT(*) FROM closings WHERE ir_id = $1 AND created_at >= $2::date AND created_at < ($3::date + interval '1 day')) as closings,
			(SELECT COUNT(*) FROM fg_invites WHERE ir_id = $1 AND created_at >= $2::date AND created_at < ($3::date + interval '1 day')) as fg_invites,
			(SELECT COUNT(*) FROM feel_goods WHERE ir_id = $1 AND created_at >= $2::date AND created_at < ($3::date + interval '1 day')) as feel_goods,
			(SELECT COUNT(*) FROM plans WHERE ir_id = $1 AND pipeline_status = 'done' AND created_at >= $2::date AND created_at < ($3::date + interval '1 day')) as done,
			(SELECT COUNT(*) FROM plans WHERE ir_id = $1 AND pipeline_status = 'kiv' AND created_at >= $2::date AND created_at < ($3::date + interval '1 day')) as kiv
	`)

	err := r.db.QueryRow(ctx, query, irID, startDate, endDate).Scan(
		&counts.Infos,
		&counts.Invites,
		&counts.Plans,
		&counts.Closings,
		&counts.FGInvites,
		&counts.FeelGoods,
		&counts.Done,
		&counts.KIV,
	)

	return counts, err
}

func (r *ReportRepository) GetPipelineSummary(ctx context.Context, irID string, startDate, endDate string) (*models.PipelineSummary, error) {
	summary := &models.PipelineSummary{}

	query := `
		SELECT
			COALESCE(SUM(CASE WHEN pipeline_status = 'tentative' THEN expected_uvs ELSE 0 END), 0) as tentative_uv,
			COALESCE(SUM(CASE WHEN pipeline_status = 'strong' THEN expected_uvs ELSE 0 END), 0) as strong_uv,
			COALESCE(SUM(CASE WHEN pipeline_status = 'sureshot' THEN expected_uvs ELSE 0 END), 0) as sureshot_uv
		FROM plans
		WHERE ir_id = $1 AND pipeline_status IN ('tentative', 'strong', 'sureshot')
		AND created_at >= $2::date AND created_at < ($3::date + interval '1 day')
	`

	err := r.db.QueryRow(ctx, query, irID, startDate, endDate).Scan(
		&summary.TentativeUV,
		&summary.StrongUV,
		&summary.SureshotUV,
	)

	if err == nil {
		summary.TotalUV = summary.TentativeUV + summary.StrongUV + summary.SureshotUV
	}

	return summary, err
}

func (r *ReportRepository) GetPipelineDetails(ctx context.Context, irID string, pipelineStatus string, startDate, endDate string) ([]models.PipelineDetail, error) {
	details := []models.PipelineDetail{}

	query := `
		SELECT
			u.name,
			COALESCE(i.prospect_name, '') as prospect_name,
			p.expected_uvs,
			COALESCE(p.remarks, '')
		FROM plans p
		LEFT JOIN users u ON p.ir_id = u.ir_id
		LEFT JOIN invites inv ON p.invite_id = inv.id
		LEFT JOIN infos i ON inv.info_id = i.id
		WHERE p.ir_id = $1 AND p.pipeline_status = $2
		AND p.created_at >= $3::date AND p.created_at < ($4::date + interval '1 day')
		ORDER BY p.created_at DESC
	`

	rows, err := r.db.Query(ctx, query, irID, pipelineStatus, startDate, endDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	slNo := 1
	for rows.Next() {
		var detail models.PipelineDetail
		err := rows.Scan(&detail.IRName, &detail.ProspectName, &detail.ExpectedUVs, &detail.Remarks)
		if err != nil {
			return nil, err
		}
		detail.SlNo = slNo
		slNo++
		details = append(details, detail)
	}

	return details, rows.Err()
}

func (r *ReportRepository) GetDownlineIRIDs(ctx context.Context, userID uuid.UUID) ([]string, error) {
	query := `
		WITH RECURSIVE downlines AS (
			SELECT id, ir_id FROM users WHERE upline_id = $1
			UNION ALL
			SELECT u.id, u.ir_id FROM users u
			INNER JOIN downlines d ON u.upline_id = d.id
		)
		SELECT ir_id FROM downlines
	`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	irids := []string{}
	for rows.Next() {
		var irID string
		if err := rows.Scan(&irID); err != nil {
			return nil, err
		}
		irids = append(irids, irID)
	}

	return irids, rows.Err()
}

func (r *ReportRepository) CountActivitiesForMultipleIRs(ctx context.Context, irIDs []string, startDate, endDate string) (*models.ActivityCounts, error) {
	counts := &models.ActivityCounts{}

	query := `
		SELECT
			COUNT(DISTINCT CASE WHEN type = 'info' THEN id END) as infos,
			COUNT(DISTINCT CASE WHEN type = 'invite' THEN id END) as invites,
			COUNT(DISTINCT CASE WHEN type = 'plan' THEN id END) as plans,
			COUNT(DISTINCT CASE WHEN type = 'closing' THEN id END) as closings,
			COUNT(DISTINCT CASE WHEN type = 'fg_invite' THEN id END) as fg_invites,
			COUNT(DISTINCT CASE WHEN type = 'feel_good' THEN id END) as feel_goods,
			COUNT(DISTINCT CASE WHEN type = 'plan' AND status = 'done' THEN id END) as done,
			COUNT(DISTINCT CASE WHEN type = 'plan' AND status = 'kiv' THEN id END) as kiv
		FROM (
			SELECT id, 'info' as type, ir_id, created_at, '' as status FROM infos
			WHERE ir_id = ANY($1) AND created_at >= $2::date AND created_at < ($3::date + interval '1 day')
			UNION ALL
			SELECT id, 'invite', ir_id, created_at, '' FROM invites
			WHERE ir_id = ANY($1) AND created_at >= $2::date AND created_at < ($3::date + interval '1 day')
			UNION ALL
			SELECT id, 'plan', ir_id, created_at, pipeline_status FROM plans
			WHERE ir_id = ANY($1) AND created_at >= $2::date AND created_at < ($3::date + interval '1 day')
			UNION ALL
			SELECT id, 'closing', ir_id, created_at, status FROM closings
			WHERE ir_id = ANY($1) AND created_at >= $2::date AND created_at < ($3::date + interval '1 day')
			UNION ALL
			SELECT id, 'fg_invite', ir_id, created_at, '' FROM fg_invites
			WHERE ir_id = ANY($1) AND created_at >= $2::date AND created_at < ($3::date + interval '1 day')
			UNION ALL
			SELECT id, 'feel_good', ir_id, created_at, '' FROM feel_goods
			WHERE ir_id = ANY($1) AND created_at >= $2::date AND created_at < ($3::date + interval '1 day')
		) activities
	`

	err := r.db.QueryRow(ctx, query, irIDs, startDate, endDate).Scan(
		&counts.Infos,
		&counts.Invites,
		&counts.Plans,
		&counts.Closings,
		&counts.FGInvites,
		&counts.FeelGoods,
		&counts.Done,
		&counts.KIV,
	)

	return counts, err
}

func (r *ReportRepository) GetPipelineSummaryForMultipleIRs(ctx context.Context, irIDs []string, startDate, endDate string) (*models.PipelineSummary, error) {
	summary := &models.PipelineSummary{}

	query := `
		SELECT
			COALESCE(SUM(CASE WHEN pipeline_status = 'tentative' THEN expected_uvs ELSE 0 END), 0) as tentative_uv,
			COALESCE(SUM(CASE WHEN pipeline_status = 'strong' THEN expected_uvs ELSE 0 END), 0) as strong_uv,
			COALESCE(SUM(CASE WHEN pipeline_status = 'sureshot' THEN expected_uvs ELSE 0 END), 0) as sureshot_uv
		FROM plans
		WHERE ir_id = ANY($1) AND pipeline_status IN ('tentative', 'strong', 'sureshot')
		AND created_at >= $2::date AND created_at < ($3::date + interval '1 day')
	`

	err := r.db.QueryRow(ctx, query, irIDs, startDate, endDate).Scan(
		&summary.TentativeUV,
		&summary.StrongUV,
		&summary.SureshotUV,
	)

	if err == nil {
		summary.TotalUV = summary.TentativeUV + summary.StrongUV + summary.SureshotUV
	}

	return summary, err
}

func (r *ReportRepository) GetPipelineDetailsForMultipleIRs(ctx context.Context, irIDs []string, pipelineStatus string, startDate, endDate string) ([]models.PipelineDetail, error) {
	details := []models.PipelineDetail{}

	query := `
		SELECT
			u.name,
			COALESCE(i.prospect_name, '') as prospect_name,
			p.expected_uvs,
			COALESCE(p.remarks, '')
		FROM plans p
		LEFT JOIN users u ON p.ir_id = u.ir_id
		LEFT JOIN invites inv ON p.invite_id = inv.id
		LEFT JOIN infos i ON inv.info_id = i.id
		WHERE p.ir_id = ANY($1) AND p.pipeline_status = $2
		AND p.created_at >= $3::date AND p.created_at < ($4::date + interval '1 day')
		ORDER BY p.ir_id, p.created_at DESC
	`

	rows, err := r.db.Query(ctx, query, irIDs, pipelineStatus, startDate, endDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	slNo := 1
	for rows.Next() {
		var detail models.PipelineDetail
		err := rows.Scan(&detail.IRName, &detail.ProspectName, &detail.ExpectedUVs, &detail.Remarks)
		if err != nil {
			return nil, err
		}
		detail.SlNo = slNo
		slNo++
		details = append(details, detail)
	}

	return details, rows.Err()
}

func (r *ReportRepository) GetUserNameByIRID(ctx context.Context, irID string) (string, error) {
	var name string
	query := `SELECT name FROM users WHERE ir_id = $1`
	err := r.db.QueryRow(ctx, query, irID).Scan(&name)
	if err != nil {
		return "", err
	}
	return name, nil
}

func (r *ReportRepository) IsDescendantOf(ctx context.Context, potentialDescendantID uuid.UUID, potentialAncestorID uuid.UUID) (bool, error) {
	query := `
		WITH RECURSIVE ancestors AS (
			SELECT id, upline_id FROM users WHERE id = $1
			UNION ALL
			SELECT u.id, u.upline_id FROM users u
			INNER JOIN ancestors a ON u.id = a.upline_id
		)
		SELECT EXISTS(SELECT 1 FROM ancestors WHERE id = $2)
	`
	var isDescendant bool
	err := r.db.QueryRow(ctx, query, potentialDescendantID, potentialAncestorID).Scan(&isDescendant)
	return isDescendant, err
}
