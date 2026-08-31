package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID  `json:"id"`
	IRID         string     `json:"ir_id"`
	Name         string     `json:"name"`
	Email        string     `json:"email"`
	Phone        string     `json:"phone"`
	Role         string     `json:"role"`
	UplineID     *uuid.UUID `json:"upline_id"`
	Status       string     `json:"status"`
	PasswordHash *string    `json:"-"`
	PlansShown   int        `json:"plans_shown"`
	DrsHit       int        `json:"drs_hit"`
	PictureURL   *string    `json:"picture_url"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type CreateUserRequest struct {
	IRID     string     `json:"ir_id" binding:"required,min=1,max=50"`
	Name     string     `json:"name" binding:"required"`
	Email    string     `json:"email" binding:"required,email"`
	Phone    string     `json:"phone" binding:"required,min=7"`
	Role     string     `json:"role" binding:"required"`
	UplineID *uuid.UUID `json:"upline_id"`
	Status   string     `json:"status"`
	Password string     `json:"password"`
}

type UpdateUserRequest struct {
	Name       string     `json:"name"`
	Email      string     `json:"email"`
	Phone      string     `json:"phone"`
	Role       string     `json:"role"`
	UplineID   *uuid.UUID `json:"upline_id"`
	Status     string     `json:"status"`
	Password   string     `json:"password"`
	PlansShown *int       `json:"plans_shown"`
	DrsHit     *int       `json:"drs_hit"`
}

type ListUsersQuery struct {
	Page   int    `form:"page"`
	Limit  int    `form:"limit"`
	Search string `form:"search"`
	IRID   string `form:"ir_id"`
	Status string `form:"status"`
}

type ListUsersResponse struct {
	Data  []User `json:"data"`
	Total int64  `json:"total"`
	Page  int    `json:"page"`
	Limit int    `json:"limit"`
}
