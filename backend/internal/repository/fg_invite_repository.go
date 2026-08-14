package repository

import (
	"context"
	"fmt"

	"github.com/Surajpragallapati03/activity-tracker/backend/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type FGInviteRepository struct {
	db *pgxpool.Pool
}

func NewFGInviteRepository(db *pgxpool.Pool) *FGInviteRepository {
	return &FGInviteRepository{db: db}
}

func (r *FGInviteRepository) Create(ctx context.Context, fgInvite *models.FGInvite) error {
	query := `
		INSERT INTO fg_invites (closing_id, ir_id, meeting_date, meeting_time, mode, status, remarks)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at, updated_at
	`

	err := r.db.QueryRow(ctx, query,
		fgInvite.ClosingID,
		fgInvite.IRID,
		fgInvite.MeetingDate,
		fgInvite.MeetingTime,
		fgInvite.Mode,
		fgInvite.Status,
		fgInvite.Remarks,
	).Scan(&fgInvite.ID, &fgInvite.CreatedAt, &fgInvite.UpdatedAt)

	return err
}

func (r *FGInviteRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.FGInvite, error) {
	query := `
		SELECT id, closing_id, ir_id, meeting_date, meeting_time, mode, status, remarks, created_at, updated_at
		FROM fg_invites
		WHERE id = $1
	`

	fgInvite := &models.FGInvite{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&fgInvite.ID,
		&fgInvite.ClosingID,
		&fgInvite.IRID,
		&fgInvite.MeetingDate,
		&fgInvite.MeetingTime,
		&fgInvite.Mode,
		&fgInvite.Status,
		&fgInvite.Remarks,
		&fgInvite.CreatedAt,
		&fgInvite.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}
	return fgInvite, nil
}

func (r *FGInviteRepository) GetByClosingID(ctx context.Context, closingID uuid.UUID) (*models.FGInvite, error) {
	query := `
		SELECT id, closing_id, ir_id, meeting_date, meeting_time, mode, status, remarks, created_at, updated_at
		FROM fg_invites
		WHERE closing_id = $1
	`

	fgInvite := &models.FGInvite{}
	err := r.db.QueryRow(ctx, query, closingID).Scan(
		&fgInvite.ID,
		&fgInvite.ClosingID,
		&fgInvite.IRID,
		&fgInvite.MeetingDate,
		&fgInvite.MeetingTime,
		&fgInvite.Mode,
		&fgInvite.Status,
		&fgInvite.Remarks,
		&fgInvite.CreatedAt,
		&fgInvite.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}
	return fgInvite, nil
}

func (r *FGInviteRepository) Update(ctx context.Context, id uuid.UUID, updates *models.UpdateFGInviteRequestWithTime) error {
	query := `UPDATE fg_invites SET updated_at = CURRENT_TIMESTAMP`
	args := []interface{}{}
	argNum := 1

	if updates.MeetingDate != nil {
		query += fmt.Sprintf(`, meeting_date = $%d`, argNum)
		args = append(args, updates.MeetingDate)
		argNum++
	}
	if updates.MeetingTime != nil {
		query += fmt.Sprintf(`, meeting_time = $%d`, argNum)
		args = append(args, updates.MeetingTime)
		argNum++
	}
	if updates.Mode != nil {
		query += fmt.Sprintf(`, mode = $%d`, argNum)
		args = append(args, updates.Mode)
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

func (r *FGInviteRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, `DELETE FROM fg_invites WHERE id = $1`, id)
	return err
}

func (r *FGInviteRepository) List(ctx context.Context, page, limit int) ([]models.FGInvite, int64, error) {
	offset := (page - 1) * limit

	var total int64
	err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM fg_invites`).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := r.db.Query(
		ctx,
		`SELECT id, closing_id, ir_id, meeting_date, meeting_time, mode, status, remarks, created_at, updated_at
		 FROM fg_invites ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
		limit,
		offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	fgInvites := []models.FGInvite{}
	for rows.Next() {
		fgInvite := models.FGInvite{}
		err := rows.Scan(
			&fgInvite.ID,
			&fgInvite.ClosingID,
			&fgInvite.IRID,
			&fgInvite.MeetingDate,
			&fgInvite.MeetingTime,
			&fgInvite.Mode,
			&fgInvite.Status,
			&fgInvite.Remarks,
			&fgInvite.CreatedAt,
			&fgInvite.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		fgInvites = append(fgInvites, fgInvite)
	}
	return fgInvites, total, rows.Err()
}

func (r *FGInviteRepository) ListByIRID(ctx context.Context, irID string, page, limit int) ([]models.FGInvite, int64, error) {
	offset := (page - 1) * limit

	var total int64
	err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM fg_invites WHERE ir_id = $1`, irID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := r.db.Query(
		ctx,
		`SELECT id, closing_id, ir_id, meeting_date, meeting_time, mode, status, remarks, created_at, updated_at
		 FROM fg_invites WHERE ir_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
		irID,
		limit,
		offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	fgInvites := []models.FGInvite{}
	for rows.Next() {
		fgInvite := models.FGInvite{}
		err := rows.Scan(
			&fgInvite.ID,
			&fgInvite.ClosingID,
			&fgInvite.IRID,
			&fgInvite.MeetingDate,
			&fgInvite.MeetingTime,
			&fgInvite.Mode,
			&fgInvite.Status,
			&fgInvite.Remarks,
			&fgInvite.CreatedAt,
			&fgInvite.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		fgInvites = append(fgInvites, fgInvite)
	}
	return fgInvites, total, rows.Err()
}

func (r *FGInviteRepository) ListByClosingID(ctx context.Context, closingID string, page, limit int) ([]models.FGInvite, int64, error) {
	offset := (page - 1) * limit

	var total int64
	err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM fg_invites WHERE closing_id = $1`, closingID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := r.db.Query(
		ctx,
		`SELECT id, closing_id, ir_id, meeting_date, meeting_time, mode, status, remarks, created_at, updated_at
		 FROM fg_invites WHERE closing_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
		closingID,
		limit,
		offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	fgInvites := []models.FGInvite{}
	for rows.Next() {
		fgInvite := models.FGInvite{}
		err := rows.Scan(
			&fgInvite.ID,
			&fgInvite.ClosingID,
			&fgInvite.IRID,
			&fgInvite.MeetingDate,
			&fgInvite.MeetingTime,
			&fgInvite.Mode,
			&fgInvite.Status,
			&fgInvite.Remarks,
			&fgInvite.CreatedAt,
			&fgInvite.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		fgInvites = append(fgInvites, fgInvite)
	}
	return fgInvites, total, rows.Err()
}
