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

type InfoRepository struct {
	db *pgxpool.Pool
}

func NewInfoRepository(db *pgxpool.Pool) *InfoRepository {
	return &InfoRepository{db: db}
}

func (r *InfoRepository) Create(ctx context.Context, info *models.Info) error {
	query := `
		INSERT INTO infos (ir_id, prospect_name, phone, response, status, remarks, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at, updated_at
	`

	err := r.db.QueryRow(ctx, query,
		info.IRID,
		info.ProspectName,
		info.Phone,
		info.Response,
		info.Status,
		info.Remarks,
		info.CreatedBy,
	).Scan(&info.ID, &info.CreatedAt, &info.UpdatedAt)

	return err
}

func (r *InfoRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Info, error) {
	query := `
		SELECT id, ir_id, prospect_name, phone, response, status, remarks, created_by, created_at, updated_at
		FROM infos
		WHERE id = $1
	`

	info := &models.Info{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&info.ID,
		&info.IRID,
		&info.ProspectName,
		&info.Phone,
		&info.Response,
		&info.Status,
		&info.Remarks,
		&info.CreatedBy,
		&info.CreatedAt,
		&info.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return info, nil
}

func (r *InfoRepository) Update(ctx context.Context, id uuid.UUID, updates *models.UpdateInfoRequest) error {
	query := `
		UPDATE infos
		SET ir_id = COALESCE(NULLIF($1, ''), ir_id),
		    prospect_name = COALESCE(NULLIF($2, ''), prospect_name),
		    phone = CASE WHEN $3::varchar IS NOT NULL THEN $3::varchar ELSE phone END,
		    response = $4,
		    status = COALESCE(NULLIF($5, ''), status),
		    remarks = $6,
		    updated_at = now()
		WHERE id = $7
	`

	cmdTag, err := r.db.Exec(ctx, query,
		updates.IRID,
		updates.ProspectName,
		updates.Phone,
		updates.Response,
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

func (r *InfoRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM infos WHERE id = $1`

	cmdTag, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return err
	}

	if cmdTag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}

	return nil
}

func (r *InfoRepository) List(ctx context.Context, query *models.ListInfosQuery) ([]models.Info, int64, error) {
	whereClause := ""
	args := []interface{}{}
	argNum := 1

	if query.Search != "" {
		searchVal := "%" + query.Search + "%"
		if whereClause != "" {
			whereClause += " AND"
		} else {
			whereClause = "WHERE"
		}
		whereClause += fmt.Sprintf(" (prospect_name ILIKE $%d OR phone ILIKE $%d)", argNum, argNum)
		args = append(args, searchVal)
		argNum++
	}

	if query.IRID != "" {
		if whereClause != "" {
			whereClause += " AND"
		} else {
			whereClause = "WHERE"
		}
		whereClause += fmt.Sprintf(" ir_id = $%d", argNum)
		args = append(args, query.IRID)
		argNum++
	}

	if query.Status != "" {
		if whereClause != "" {
			whereClause += " AND"
		} else {
			whereClause = "WHERE"
		}
		whereClause += fmt.Sprintf(" status = $%d", argNum)
		args = append(args, query.Status)
		argNum++
	}

	if whereClause == "" {
		whereClause = "WHERE 1=1"
	}

	countQuery := "SELECT COUNT(*) FROM infos " + whereClause
	var total int64
	err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	offset := (query.Page - 1) * query.Limit
	sqlQuery := fmt.Sprintf("SELECT id, ir_id, prospect_name, phone, response, status, remarks, created_by, created_at, updated_at FROM infos %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d", whereClause, argNum, argNum+1)
	listArgs := append(args, query.Limit, offset)

	rows, err := r.db.Query(ctx, sqlQuery, listArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	infos := []models.Info{}
	for rows.Next() {
		info := models.Info{}
		err := rows.Scan(
			&info.ID,
			&info.IRID,
			&info.ProspectName,
			&info.Phone,
			&info.Response,
			&info.Status,
			&info.Remarks,
			&info.CreatedBy,
			&info.CreatedAt,
			&info.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		infos = append(infos, info)
	}

	if err = rows.Err(); err != nil {
		return nil, 0, err
	}

	return infos, total, nil
}
