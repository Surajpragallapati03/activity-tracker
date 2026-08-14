package repository

import (
	"context"
	"fmt"

	"github.com/Surajpragallapati03/activity-tracker/backend/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type FeelGoodRepository struct {
	db *pgxpool.Pool
}

func NewFeelGoodRepository(db *pgxpool.Pool) *FeelGoodRepository {
	return &FeelGoodRepository{db: db}
}

func (r *FeelGoodRepository) Create(ctx context.Context, feelGood *models.FeelGood) error {
	query := `
		INSERT INTO feel_goods (fg_invite_id, ir_id, ul1, ul2, status, remarks)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at
	`

	err := r.db.QueryRow(ctx, query,
		feelGood.FGInviteID,
		feelGood.IRID,
		feelGood.UL1,
		feelGood.UL2,
		feelGood.Status,
		feelGood.Remarks,
	).Scan(&feelGood.ID, &feelGood.CreatedAt, &feelGood.UpdatedAt)

	return err
}

func (r *FeelGoodRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.FeelGood, error) {
	query := `
		SELECT id, fg_invite_id, ir_id, ul1, ul2, status, remarks, created_at, updated_at
		FROM feel_goods
		WHERE id = $1
	`

	feelGood := &models.FeelGood{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&feelGood.ID,
		&feelGood.FGInviteID,
		&feelGood.IRID,
		&feelGood.UL1,
		&feelGood.UL2,
		&feelGood.Status,
		&feelGood.Remarks,
		&feelGood.CreatedAt,
		&feelGood.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}
	return feelGood, nil
}

func (r *FeelGoodRepository) GetByFGInviteID(ctx context.Context, fgInviteID uuid.UUID) (*models.FeelGood, error) {
	query := `
		SELECT id, fg_invite_id, ir_id, ul1, ul2, status, remarks, created_at, updated_at
		FROM feel_goods
		WHERE fg_invite_id = $1
	`

	feelGood := &models.FeelGood{}
	err := r.db.QueryRow(ctx, query, fgInviteID).Scan(
		&feelGood.ID,
		&feelGood.FGInviteID,
		&feelGood.IRID,
		&feelGood.UL1,
		&feelGood.UL2,
		&feelGood.Status,
		&feelGood.Remarks,
		&feelGood.CreatedAt,
		&feelGood.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}
	return feelGood, nil
}

func (r *FeelGoodRepository) Update(ctx context.Context, id uuid.UUID, updates *models.UpdateFeelGoodRequestWithoutBinding) error {
	query := `UPDATE feel_goods SET updated_at = CURRENT_TIMESTAMP`
	args := []interface{}{}
	argNum := 1

	if updates.UL1 != nil {
		query += fmt.Sprintf(`, ul1 = $%d`, argNum)
		args = append(args, updates.UL1)
		argNum++
	}
	if updates.UL2 != nil {
		query += fmt.Sprintf(`, ul2 = $%d`, argNum)
		args = append(args, updates.UL2)
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

func (r *FeelGoodRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, `DELETE FROM feel_goods WHERE id = $1`, id)
	return err
}

func (r *FeelGoodRepository) List(ctx context.Context, page, limit int) ([]models.FeelGood, int64, error) {
	offset := (page - 1) * limit

	var total int64
	err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM feel_goods`).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := r.db.Query(
		ctx,
		`SELECT id, fg_invite_id, ir_id, ul1, ul2, status, remarks, created_at, updated_at
		 FROM feel_goods ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
		limit,
		offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	feelGoods := []models.FeelGood{}
	for rows.Next() {
		feelGood := models.FeelGood{}
		err := rows.Scan(
			&feelGood.ID,
			&feelGood.FGInviteID,
			&feelGood.IRID,
			&feelGood.UL1,
			&feelGood.UL2,
			&feelGood.Status,
			&feelGood.Remarks,
			&feelGood.CreatedAt,
			&feelGood.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		feelGoods = append(feelGoods, feelGood)
	}
	return feelGoods, total, rows.Err()
}

func (r *FeelGoodRepository) ListByFGInviteID(ctx context.Context, fgInviteID string, page, limit int) ([]models.FeelGood, int64, error) {
	offset := (page - 1) * limit

	var total int64
	err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM feel_goods WHERE fg_invite_id = $1`, fgInviteID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := r.db.Query(
		ctx,
		`SELECT id, fg_invite_id, ir_id, ul1, ul2, status, remarks, created_at, updated_at
		 FROM feel_goods WHERE fg_invite_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
		fgInviteID,
		limit,
		offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	feelGoods := []models.FeelGood{}
	for rows.Next() {
		feelGood := models.FeelGood{}
		err := rows.Scan(
			&feelGood.ID,
			&feelGood.FGInviteID,
			&feelGood.IRID,
			&feelGood.UL1,
			&feelGood.UL2,
			&feelGood.Status,
			&feelGood.Remarks,
			&feelGood.CreatedAt,
			&feelGood.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		feelGoods = append(feelGoods, feelGood)
	}
	return feelGoods, total, rows.Err()
}

func (r *FeelGoodRepository) ListByIRID(ctx context.Context, irID string, page, limit int) ([]models.FeelGood, int64, error) {
	offset := (page - 1) * limit

	var total int64
	err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM feel_goods WHERE ir_id = $1`, irID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := r.db.Query(
		ctx,
		`SELECT id, fg_invite_id, ir_id, ul1, ul2, status, remarks, created_at, updated_at
		 FROM feel_goods WHERE ir_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
		irID,
		limit,
		offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	feelGoods := []models.FeelGood{}
	for rows.Next() {
		feelGood := models.FeelGood{}
		err := rows.Scan(
			&feelGood.ID,
			&feelGood.FGInviteID,
			&feelGood.IRID,
			&feelGood.UL1,
			&feelGood.UL2,
			&feelGood.Status,
			&feelGood.Remarks,
			&feelGood.CreatedAt,
			&feelGood.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		feelGoods = append(feelGoods, feelGood)
	}
	return feelGoods, total, rows.Err()
}
