package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/models"
)

type PlanRepository struct {
	db *pgxpool.Pool
}

func NewPlanRepository(db *pgxpool.Pool) *PlanRepository {
	return &PlanRepository{db: db}
}

func (r *PlanRepository) Create(ctx context.Context, plan *models.Plan) error {
	query := `
		INSERT INTO plans (invite_id, ir_id, ul1, ul2, quoted_amount, expected_uvs, status, remarks)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at, updated_at
	`

	err := r.db.QueryRow(ctx, query,
		plan.InviteID,
		plan.IRID,
		plan.UL1,
		plan.UL2,
		plan.QuotedAmount,
		plan.ExpectedUVs,
		plan.Status,
		plan.Remarks,
	).Scan(&plan.ID, &plan.CreatedAt, &plan.UpdatedAt)

	return err
}

func (r *PlanRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Plan, error) {
	query := `
		SELECT id, invite_id, ir_id, ul1, ul2, quoted_amount, expected_uvs, status, remarks, created_at, updated_at
		FROM plans
		WHERE id = $1
	`

	plan := &models.Plan{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&plan.ID,
		&plan.InviteID,
		&plan.IRID,
		&plan.UL1,
		&plan.UL2,
		&plan.QuotedAmount,
		&plan.ExpectedUVs,
		&plan.Status,
		&plan.Remarks,
		&plan.CreatedAt,
		&plan.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return plan, nil
}

func (r *PlanRepository) Update(ctx context.Context, id uuid.UUID, updates *models.UpdatePlanRequest) error {
	query := `
		UPDATE plans
		SET ul1 = COALESCE($1, ul1),
		    ul2 = COALESCE($2, ul2),
		    quoted_amount = COALESCE($3, quoted_amount),
		    expected_uvs = COALESCE($4, expected_uvs),
		    status = COALESCE($5, status),
		    remarks = COALESCE($6, remarks),
		    updated_at = now()
		WHERE id = $7
	`

	cmdTag, err := r.db.Exec(ctx, query,
		updates.UL1,
		updates.UL2,
		updates.QuotedAmount,
		updates.ExpectedUVs,
		updates.Status,
		updates.Remarks,
		id,
	)

	if err != nil {
		return err
	}

	if cmdTag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}

	return nil
}

func (r *PlanRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM plans WHERE id = $1`

	cmdTag, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return err
	}

	if cmdTag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}

	return nil
}

func (r *PlanRepository) List(ctx context.Context, query *models.ListPlansQuery) ([]models.Plan, int64, error) {
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argNum := 1

	if query.InviteID != "" {
		whereClause += fmt.Sprintf(" AND invite_id = $%d", argNum)
		args = append(args, query.InviteID)
		argNum++
	}

	if query.IRID != "" {
		whereClause += fmt.Sprintf(" AND ir_id = $%d", argNum)
		args = append(args, query.IRID)
		argNum++
	}

	countQuery := "SELECT COUNT(*) FROM plans " + whereClause
	var total int64
	err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	offset := (query.Page - 1) * query.Limit
	sqlQuery := fmt.Sprintf("SELECT id, invite_id, ir_id, ul1, ul2, quoted_amount, expected_uvs, status, remarks, created_at, updated_at FROM plans %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d", whereClause, argNum, argNum+1)
	listArgs := append(args, query.Limit, offset)

	rows, err := r.db.Query(ctx, sqlQuery, listArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	plans := []models.Plan{}
	for rows.Next() {
		plan := models.Plan{}
		err := rows.Scan(
			&plan.ID,
			&plan.InviteID,
			&plan.IRID,
			&plan.UL1,
			&plan.UL2,
			&plan.QuotedAmount,
			&plan.ExpectedUVs,
			&plan.Status,
			&plan.Remarks,
			&plan.CreatedAt,
			&plan.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		plans = append(plans, plan)
	}

	if err = rows.Err(); err != nil {
		return nil, 0, err
	}

	return plans, total, nil
}
