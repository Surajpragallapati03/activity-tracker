package models

import (
	"time"

	"github.com/google/uuid"
)

type Plan struct {
	ID             uuid.UUID `json:"id"`
	InviteID       uuid.UUID `json:"invite_id"`
	IRID           string    `json:"ir_id"`
	UL1            string    `json:"ul1"`
	UL2            string    `json:"ul2"`
	QuotedAmount   string    `json:"quoted_amount"`
	ExpectedUVs    float64   `json:"expected_uvs"`
	Status         *string   `json:"status"`
	Remarks        *string   `json:"remarks"`
	PipelineStatus string    `json:"pipeline_status"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type CreatePlanRequest struct {
	InviteID       string  `json:"invite_id" binding:"required"`
	IRID           string  `json:"ir_id" binding:"required"`
	UL1            string  `json:"ul1" binding:"required"`
	UL2            string  `json:"ul2" binding:"required"`
	QuotedAmount   string  `json:"quoted_amount" binding:"required"`
	ExpectedUVs    float64 `json:"expected_uvs" binding:"required"`
	Status         *string `json:"status"`
	Remarks        *string `json:"remarks"`
	PipelineStatus string  `json:"pipeline_status"`
}

type UpdatePlanRequest struct {
	UL1            *string `json:"ul1"`
	UL2            *string `json:"ul2"`
	QuotedAmount   *string `json:"quoted_amount"`
	ExpectedUVs    *float64 `json:"expected_uvs"`
	Status         *string `json:"status"`
	Remarks        *string `json:"remarks"`
	PipelineStatus *string `json:"pipeline_status"`
}

type ListPlansQuery struct {
	Page           int    `form:"page"`
	Limit          int    `form:"limit"`
	InviteID       string `form:"invite_id"`
	IRID           string `form:"ir_id"`
	PipelineStatus string `form:"pipeline_status"`
	StartDate      string `form:"start_date"`
	EndDate        string `form:"end_date"`
}

type ListPlansResponse struct {
	Data  []Plan `json:"data"`
	Total int64  `json:"total"`
	Page  int    `json:"page"`
	Limit int    `json:"limit"`
}

type CreatePlanWithDKDRequest struct {
	IRID           string  `json:"ir_id" binding:"required"`
	ProspectName   string  `json:"prospect_name" binding:"required"`
	Phone          *string `json:"phone"`
	InfoStatus     *string `json:"info_status"`
	Mode           *string `json:"mode"`
	MeetingDate    *string `json:"meeting_date"`
	MeetingTime    *string `json:"meeting_time"`
	InviteStatus   string  `json:"invite_status"`
	UL1            string  `json:"ul1" binding:"required"`
	UL2            string  `json:"ul2" binding:"required"`
	QuotedAmount   string  `json:"quoted_amount" binding:"required"`
	ExpectedUVs    float64 `json:"expected_uvs" binding:"required"`
	Status         *string `json:"status"`
	Remarks        *string `json:"remarks"`
	PipelineStatus string  `json:"pipeline_status"`
}

type PlanWithChainResponse struct {
	Plan   *Plan          `json:"plan"`
	Invite *InviteResponse `json:"invite"`
	Info   *Info          `json:"info"`
}
