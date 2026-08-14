package models

import (
	"time"

	"github.com/google/uuid"
)

type Plan struct {
	ID            uuid.UUID `json:"id"`
	InviteID      uuid.UUID `json:"invite_id"`
	IRID          string    `json:"ir_id"`
	UL1           string    `json:"ul1"`
	UL2           string    `json:"ul2"`
	QuotedAmount  string    `json:"quoted_amount"`
	ExpectedUVs   float64   `json:"expected_uvs"`
	Status        string    `json:"status"`
	Remarks       string    `json:"remarks"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type CreatePlanRequest struct {
	InviteID     string  `json:"invite_id" binding:"required"`
	IRID         string  `json:"ir_id" binding:"required"`
	UL1          string  `json:"ul1" binding:"required"`
	UL2          string  `json:"ul2" binding:"required"`
	QuotedAmount string  `json:"quoted_amount" binding:"required"`
	ExpectedUVs  float64 `json:"expected_uvs" binding:"required"`
	Status       string  `json:"status" binding:"required"`
	Remarks      string  `json:"remarks" binding:"required"`
}

type UpdatePlanRequest struct {
	UL1          *string  `json:"ul1"`
	UL2          *string  `json:"ul2"`
	QuotedAmount *string  `json:"quoted_amount"`
	ExpectedUVs  *float64 `json:"expected_uvs"`
	Status       *string  `json:"status"`
	Remarks      *string  `json:"remarks"`
}

type ListPlansQuery struct {
	Page     int    `form:"page"`
	Limit    int    `form:"limit"`
	InviteID string `form:"invite_id"`
	IRID     string `form:"ir_id"`
}

type ListPlansResponse struct {
	Data  []Plan `json:"data"`
	Total int64  `json:"total"`
	Page  int    `json:"page"`
	Limit int    `json:"limit"`
}
