package repository

import (
	"context"
	"fmt"

	"github.com/Surajpragallapati03/activity-tracker/backend/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ClosingRepository struct {
	db *pgxpool.Pool
}

func NewClosingRepository(db *pgxpool.Pool) *ClosingRepository {
	return &ClosingRepository{db: db}
}

func (r *ClosingRepository) Create(ctx context.Context, closing *models.Closing) error {
	query := `
		INSERT INTO closings (plan_id, ir_id, closing_date, status, remarks)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at
	`

	err := r.db.QueryRow(ctx, query,
		closing.PlanID,
		closing.IRID,
		closing.ClosingDate,
		closing.Status,
		closing.Remarks,
	).Scan(&closing.ID, &closing.CreatedAt, &closing.UpdatedAt)

	return err
}

func (r *ClosingRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Closing, error) {
	query := `
		SELECT id, plan_id, ir_id, closing_date, status, remarks, created_at, updated_at
		FROM closings
		WHERE id = $1
	`

	closing := &models.Closing{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&closing.ID,
		&closing.PlanID,
		&closing.IRID,
		&closing.ClosingDate,
		&closing.Status,
		&closing.Remarks,
		&closing.CreatedAt,
		&closing.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}
	return closing, nil
}

func (r *ClosingRepository) GetByPlanID(ctx context.Context, planID uuid.UUID) (*models.Closing, error) {
	query := `
		SELECT id, plan_id, ir_id, closing_date, status, remarks, created_at, updated_at
		FROM closings
		WHERE plan_id = $1
	`

	closing := &models.Closing{}
	err := r.db.QueryRow(ctx, query, planID).Scan(
		&closing.ID,
		&closing.PlanID,
		&closing.IRID,
		&closing.ClosingDate,
		&closing.Status,
		&closing.Remarks,
		&closing.CreatedAt,
		&closing.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}
	return closing, nil
}

func (r *ClosingRepository) Update(ctx context.Context, id uuid.UUID, updates *models.UpdateClosingRequestWithTime) error {
	query := `UPDATE closings SET updated_at = CURRENT_TIMESTAMP`
	args := []interface{}{}
	argNum := 1

	if updates.ClosingDate != nil {
		query += fmt.Sprintf(`, closing_date = $%d`, argNum)
		args = append(args, updates.ClosingDate)
		argNum++
	}
	if updates.Status != nil {
		query += fmt.Sprintf(`, status = $%d`, argNum)
		args = append(args, updates.Status)
		argNum++
	}
	if updates.Remarks != nil {
		query += fmt.Sprintf(`, remarks = $%d`, argNum)
		args = append(args, updates.Remarks)
		argNum++
	}

	query += fmt.Sprintf(` WHERE id = $%d`, argNum)
	args = append(args, id)

	_, err := r.db.Exec(ctx, query, args...)
	return err
}

func (r *ClosingRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, `DELETE FROM closings WHERE id = $1`, id)
	return err
}

func (r *ClosingRepository) List(ctx context.Context, startDate, endDate string, page, limit int) ([]models.Closing, int64, error) {
	offset := (page - 1) * limit

	whereClause := ""
	args := []interface{}{}
	argNum := 1

	if startDate != "" && endDate != "" {
		whereClause = fmt.Sprintf("WHERE closing_date >= $%d::date AND closing_date < ($%d::date + interval '1 day')", argNum, argNum+1)
		args = append(args, startDate, endDate)
		argNum += 2
	}

	var total int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM closings %s", whereClause)
	err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	queryArgs := append(args, limit, offset)
	rows, err := r.db.Query(
		ctx,
		fmt.Sprintf(`SELECT id, plan_id, ir_id, closing_date, status, remarks, created_at, updated_at
		 FROM closings %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, whereClause, argNum+1, argNum+2),
		queryArgs...,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	closings := []models.Closing{}
	for rows.Next() {
		closing := models.Closing{}
		err := rows.Scan(
			&closing.ID,
			&closing.PlanID,
			&closing.IRID,
			&closing.ClosingDate,
			&closing.Status,
			&closing.Remarks,
			&closing.CreatedAt,
			&closing.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		closings = append(closings, closing)
	}
	return closings, total, rows.Err()
}

func (r *ClosingRepository) ListByIRID(ctx context.Context, irID, startDate, endDate string, page, limit int) ([]models.Closing, int64, error) {
	offset := (page - 1) * limit

	whereClause := "WHERE ir_id = $1"
	args := []interface{}{irID}
	argNum := 2

	if startDate != "" && endDate != "" {
		whereClause += fmt.Sprintf(" AND closing_date >= $%d::date AND closing_date < ($%d::date + interval '1 day')", argNum, argNum+1)
		args = append(args, startDate, endDate)
		argNum += 2
	}

	var total int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM closings %s", whereClause)
	err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	queryArgs := append(args, limit, offset)
	rows, err := r.db.Query(
		ctx,
		fmt.Sprintf(`SELECT id, plan_id, ir_id, closing_date, status, remarks, created_at, updated_at
		 FROM closings %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, whereClause, argNum+1, argNum+2),
		queryArgs...,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	closings := []models.Closing{}
	for rows.Next() {
		closing := models.Closing{}
		err := rows.Scan(
			&closing.ID,
			&closing.PlanID,
			&closing.IRID,
			&closing.ClosingDate,
			&closing.Status,
			&closing.Remarks,
			&closing.CreatedAt,
			&closing.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		closings = append(closings, closing)
	}
	return closings, total, rows.Err()
}
