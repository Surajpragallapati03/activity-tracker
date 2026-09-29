package models

import (
	"time"

	"github.com/google/uuid"
)

type FeelGood struct {
	ID         uuid.UUID `json:"id"`
	FGInviteID uuid.UUID `json:"fg_invite_id"`
	IRID       string    `json:"ir_id"`
	UL1        string    `json:"ul1"`
	UL2        string    `json:"ul2"`
	Status     *string   `json:"status"`
	Remarks    *string   `json:"remarks"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type FeelGoodResponse struct {
	ID         uuid.UUID `json:"id"`
	FGInviteID uuid.UUID `json:"fg_invite_id"`
	IRID       string    `json:"ir_id"`
	UL1        string    `json:"ul1"`
	UL2        string    `json:"ul2"`
	Status     *string   `json:"status"`
	Remarks    *string   `json:"remarks"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type CreateFeelGoodRequest struct {
	FGInviteID string  `json:"fg_invite_id" binding:"required"`
	IRID       string  `json:"ir_id" binding:"required"`
	UL1        string  `json:"ul1" binding:"required"`
	UL2        string  `json:"ul2" binding:"required"`
	Status     *string `json:"status"`
	Remarks    *string `json:"remarks"`
}

type UpdateFeelGoodRequest struct {
	UL1     *string `json:"ul1"`
	UL2     *string `json:"ul2"`
	Status  *string `json:"status"`
	Remarks *string `json:"remarks"`
}

type UpdateFeelGoodRequestWithoutBinding struct {
	UL1     *string
	UL2     *string
	Status  *string
	Remarks *string
}

func (f *FeelGood) ToResponse() *FeelGoodResponse {
	return &FeelGoodResponse{
		ID:         f.ID,
		FGInviteID: f.FGInviteID,
		IRID:       f.IRID,
		UL1:        f.UL1,
		UL2:        f.UL2,
		Status:     f.Status,
		Remarks:    f.Remarks,
		CreatedAt:  f.CreatedAt,
		UpdatedAt:  f.UpdatedAt,
	}
}
