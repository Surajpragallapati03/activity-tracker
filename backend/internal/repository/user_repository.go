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

type UserRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, user *models.User) error {
	query := `
		INSERT INTO users (ir_id, name, email, phone, role, upline_id, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at, updated_at
	`

	err := r.db.QueryRow(ctx, query,
		user.IRID,
		user.Name,
		user.Email,
		user.Phone,
		user.Role,
		user.UplineID,
		user.Status,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)

	return err
}

func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	query := `
		SELECT id, ir_id, name, email, phone, role, upline_id, status, created_at, updated_at
		FROM users
		WHERE id = $1
	`

	user := &models.User{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&user.ID,
		&user.IRID,
		&user.Name,
		&user.Email,
		&user.Phone,
		&user.Role,
		&user.UplineID,
		&user.Status,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return user, nil
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `
		SELECT id, ir_id, name, email, phone, role, upline_id, status, created_at, updated_at
		FROM users
		WHERE email = $1
	`

	user := &models.User{}
	err := r.db.QueryRow(ctx, query, email).Scan(
		&user.ID,
		&user.IRID,
		&user.Name,
		&user.Email,
		&user.Phone,
		&user.Role,
		&user.UplineID,
		&user.Status,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return user, nil
}

func (r *UserRepository) GetByIRID(ctx context.Context, irID string) (*models.User, error) {
	query := `
		SELECT id, ir_id, name, email, phone, role, upline_id, status, created_at, updated_at
		FROM users
		WHERE ir_id = $1
	`

	user := &models.User{}
	err := r.db.QueryRow(ctx, query, irID).Scan(
		&user.ID,
		&user.IRID,
		&user.Name,
		&user.Email,
		&user.Phone,
		&user.Role,
		&user.UplineID,
		&user.Status,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return user, nil
}

func (r *UserRepository) Update(ctx context.Context, id uuid.UUID, updates *models.UpdateUserRequest) error {
	query := `
		UPDATE users
		SET name = COALESCE($1, name),
		    email = COALESCE($2, email),
		    phone = COALESCE($3, phone),
		    role = COALESCE($4, role),
		    upline_id = CASE WHEN $5::uuid IS NOT NULL THEN $5::uuid ELSE upline_id END,
		    status = COALESCE($6, status),
		    updated_at = now()
		WHERE id = $7
	`

	cmdTag, err := r.db.Exec(ctx, query,
		emptyStringToNull(updates.Name),
		emptyStringToNull(updates.Email),
		emptyStringToNull(updates.Phone),
		emptyStringToNull(updates.Role),
		updates.UplineID,
		emptyStringToNull(updates.Status),
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

func (r *UserRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM users WHERE id = $1`

	cmdTag, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return err
	}

	if cmdTag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}

	return nil
}

func (r *UserRepository) DeleteWithReparenting(ctx context.Context, id uuid.UUID) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Get the user to find their upline_id
	getQuery := `SELECT upline_id FROM users WHERE id = $1`
	var uplineID *uuid.UUID
	err = tx.QueryRow(ctx, getQuery, id).Scan(&uplineID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return pgx.ErrNoRows
		}
		return err
	}

	// Update all direct children to have the deleted user's upline as their upline
	updateQuery := `UPDATE users SET upline_id = $1, updated_at = now() WHERE upline_id = $2`
	_, err = tx.Exec(ctx, updateQuery, uplineID, id)
	if err != nil {
		return err
	}

	// Delete the user
	deleteQuery := `DELETE FROM users WHERE id = $1`
	cmdTag, err := tx.Exec(ctx, deleteQuery, id)
	if err != nil {
		return err
	}

	if cmdTag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}

	return tx.Commit(ctx)
}

func (r *UserRepository) List(ctx context.Context, query *models.ListUsersQuery) ([]models.User, int64, error) {
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
		whereClause += fmt.Sprintf(" (name ILIKE $%d OR email ILIKE $%d OR ir_id ILIKE $%d)", argNum, argNum, argNum)
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

	countQuery := "SELECT COUNT(*) FROM users " + whereClause
	var total int64
	err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	offset := (query.Page - 1) * query.Limit
	sqlQuery := fmt.Sprintf("SELECT id, ir_id, name, email, phone, role, upline_id, status, created_at, updated_at FROM users %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d", whereClause, argNum, argNum+1)
	listArgs := append(args, query.Limit, offset)

	rows, err := r.db.Query(ctx, sqlQuery, listArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	users := []models.User{}
	for rows.Next() {
		user := models.User{}
		err := rows.Scan(
			&user.ID,
			&user.IRID,
			&user.Name,
			&user.Email,
			&user.Phone,
			&user.Role,
			&user.UplineID,
			&user.Status,
			&user.CreatedAt,
			&user.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		users = append(users, user)
	}

	if err = rows.Err(); err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

func emptyStringToNull(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}
