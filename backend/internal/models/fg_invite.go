package models

import (
	"time"

	"github.com/google/uuid"
)

type FGInvite struct {
	ID           uuid.UUID  `json:"id"`
	ClosingID    uuid.UUID  `json:"closing_id"`
	IRID         string     `json:"ir_id"`
	MeetingDate  *time.Time `json:"meeting_date"`
	MeetingTime  *time.Time `json:"meeting_time"`
	Mode         *string    `json:"mode"`
	Status       *string    `json:"status"`
	Remarks      *string    `json:"remarks"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type FGInviteResponse struct {
	ID           uuid.UUID `json:"id"`
	ClosingID    uuid.UUID `json:"closing_id"`
	IRID         string    `json:"ir_id"`
	MeetingDate  *string   `json:"meeting_date"`
	MeetingTime  *string   `json:"meeting_time"`
	Mode         *string   `json:"mode"`
	Status       *string   `json:"status"`
	Remarks      *string   `json:"remarks"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type CreateFGInviteRequest struct {
	ClosingID   string  `json:"closing_id" binding:"required"`
	IRID        string  `json:"ir_id" binding:"required"`
	MeetingDate *string `json:"meeting_date"`
	MeetingTime *string `json:"meeting_time"`
	Mode        *string `json:"mode" binding:"omitempty,oneof=virtual physical"`
	Status      *string `json:"status"`
	Remarks     *string `json:"remarks"`
}

type UpdateFGInviteRequest struct {
	MeetingDate *string `json:"meeting_date"`
	MeetingTime *string `json:"meeting_time"`
	Mode        *string `json:"mode" binding:"omitempty,oneof=virtual physical"`
	Status      *string `json:"status"`
	Remarks     *string `json:"remarks"`
}

type UpdateFGInviteRequestWithTime struct {
	MeetingDate *time.Time
	MeetingTime *time.Time
	Mode        *string
	Status      *string
	Remarks     *string
}

func (f *FGInvite) ToResponse() *FGInviteResponse {
	var meetingDate *string
	if f.MeetingDate != nil {
		date := f.MeetingDate.Format("2006-01-02")
		meetingDate = &date
	}

	var meetingTime *string
	if f.MeetingTime != nil {
		time := f.MeetingTime.Format("15:04:05")
		meetingTime = &time
	}

	return &FGInviteResponse{
		ID:          f.ID,
		ClosingID:   f.ClosingID,
		IRID:        f.IRID,
		MeetingDate: meetingDate,
		MeetingTime: meetingTime,
		Mode:        f.Mode,
		Status:      f.Status,
		Remarks:     f.Remarks,
		CreatedAt:   f.CreatedAt,
		UpdatedAt:   f.UpdatedAt,
	}
}
