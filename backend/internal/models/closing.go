package models

import (
	"time"

	"github.com/google/uuid"
)

type Closing struct {
	ID          uuid.UUID  `json:"id"`
	PlanID      uuid.UUID  `json:"plan_id"`
	IRID        string     `json:"ir_id"`
	ClosingDate *time.Time `json:"closing_date"`
	Status      string     `json:"status"`
	Remarks     *string    `json:"remarks"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type ClosingResponse struct {
	ID          uuid.UUID `json:"id"`
	PlanID      uuid.UUID `json:"plan_id"`
	IRID        string    `json:"ir_id"`
	ClosingDate *string   `json:"closing_date"`
	Status      string    `json:"status"`
	Remarks     *string   `json:"remarks"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CreateClosingRequest struct {
	PlanID      string  `json:"plan_id" binding:"required"`
	IRID        string  `json:"ir_id" binding:"required"`
	ClosingDate string  `json:"closing_date" binding:"required"`
	Status      string  `json:"status" binding:"required,oneof=done pending"`
	Remarks     *string `json:"remarks"`
}

type UpdateClosingRequest struct {
	ClosingDate *string `json:"closing_date"`
	Status      *string `json:"status" binding:"omitempty,oneof=done pending"`
	Remarks     *string `json:"remarks"`
}

type UpdateClosingRequestWithTime struct {
	ClosingDate *time.Time
	Status      *string
	Remarks     *string
}

func (c *Closing) ToResponse() *ClosingResponse {
	var closingDate *string
	if c.ClosingDate != nil {
		date := c.ClosingDate.Format("2006-01-02")
		closingDate = &date
	}

	return &ClosingResponse{
		ID:          c.ID,
		PlanID:      c.PlanID,
		IRID:        c.IRID,
		ClosingDate: closingDate,
		Status:      c.Status,
		Remarks:     c.Remarks,
		CreatedAt:   c.CreatedAt,
		UpdatedAt:   c.UpdatedAt,
	}
}
