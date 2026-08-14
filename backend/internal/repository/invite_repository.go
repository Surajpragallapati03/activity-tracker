package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/Surajpragallapati03/activity-tracker/backend/internal/models"
)

type InviteRepository struct {
	db *pgxpool.Pool
}

func NewInviteRepository(db *pgxpool.Pool) *InviteRepository {
	return &InviteRepository{db: db}
}

func (r *InviteRepository) Create(ctx context.Context, invite *models.Invite) error {
	query := `
		INSERT INTO invites (info_id, ir_id, meeting_date, meeting_time, mode, status, remarks)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at, updated_at
	`

	err := r.db.QueryRow(ctx, query,
		invite.InfoID,
		invite.IRID,
		invite.MeetingDate,
		invite.MeetingTime,
		invite.Mode,
		invite.Status,
		invite.Remarks,
	).Scan(&invite.ID, &invite.CreatedAt, &invite.UpdatedAt)

	return err
}

func (r *InviteRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Invite, error) {
	query := `
		SELECT id, info_id, ir_id, meeting_date, meeting_time, mode, status, remarks, created_at, updated_at
		FROM invites
		WHERE id = $1
	`

	invite := &models.Invite{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&invite.ID,
		&invite.InfoID,
		&invite.IRID,
		&invite.MeetingDate,
		&invite.MeetingTime,
		&invite.Mode,
		&invite.Status,
		&invite.Remarks,
		&invite.CreatedAt,
		&invite.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return invite, nil
}

func (r *InviteRepository) Update(ctx context.Context, id uuid.UUID, updates *models.UpdateInviteRequestWithTime) error {
	setClauses := []string{}
	args := []interface{}{}
	argNum := 1

	if updates.MeetingDate != nil {
		setClauses = append(setClauses, fmt.Sprintf("meeting_date = $%d", argNum))
		args = append(args, updates.MeetingDate)
		argNum++
	}

	if updates.MeetingTime != nil {
		setClauses = append(setClauses, fmt.Sprintf("meeting_time = $%d", argNum))
		args = append(args, updates.MeetingTime)
		argNum++
	}

	if updates.Mode != nil {
		setClauses = append(setClauses, fmt.Sprintf("mode = $%d", argNum))
		args = append(args, updates.Mode)
		argNum++
	}

	if updates.Status != nil {
		setClauses = append(setClauses, fmt.Sprintf("status = $%d", argNum))
		args = append(args, updates.Status)
		argNum++
	}

	if updates.Remarks != nil {
		setClauses = append(setClauses, fmt.Sprintf("remarks = $%d", argNum))
		args = append(args, updates.Remarks)
		argNum++
	}

	if len(setClauses) == 0 {
		return nil
	}

	setClauses = append(setClauses, "updated_at = now()")

	query := fmt.Sprintf("UPDATE invites SET %s WHERE id = $%d", strings.Join(setClauses, ", "), argNum)
	args = append(args, id)

	cmdTag, err := r.db.Exec(ctx, query, args...)
	if err != nil {
		return err
	}

	if cmdTag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}

	return nil
}

func (r *InviteRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM invites WHERE id = $1`

	cmdTag, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return err
	}

	if cmdTag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}

	return nil
}

func (r *InviteRepository) List(ctx context.Context, query *models.ListInvitesQuery) ([]models.Invite, int64, error) {
	whereClause := ""
	args := []interface{}{}
	argNum := 1

	if query.InfoID != "" {
		if whereClause != "" {
			whereClause += " AND"
		} else {
			whereClause = "WHERE"
		}
		whereClause += fmt.Sprintf(" info_id = $%d", argNum)
		args = append(args, query.InfoID)
		argNum++
	}

	if whereClause == "" {
		whereClause = "WHERE 1=1"
	}

	countQuery := "SELECT COUNT(*) FROM invites " + whereClause
	var total int64
	err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	offset := (query.Page - 1) * query.Limit
	sqlQuery := fmt.Sprintf("SELECT id, info_id, ir_id, meeting_date, meeting_time, mode, status, remarks, created_at, updated_at FROM invites %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d", whereClause, argNum, argNum+1)
	listArgs := append(args, query.Limit, offset)

	rows, err := r.db.Query(ctx, sqlQuery, listArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	invites := []models.Invite{}
	for rows.Next() {
		invite := models.Invite{}
		err := rows.Scan(
			&invite.ID,
			&invite.InfoID,
			&invite.IRID,
			&invite.MeetingDate,
			&invite.MeetingTime,
			&invite.Mode,
			&invite.Status,
			&invite.Remarks,
			&invite.CreatedAt,
			&invite.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		invites = append(invites, invite)
	}

	if err = rows.Err(); err != nil {
		return nil, 0, err
	}

	return invites, total, nil
}
