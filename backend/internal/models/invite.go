package models

import (
	"time"

	"github.com/google/uuid"
)

type Invite struct {
	ID           uuid.UUID  `json:"id"`
	InfoID       uuid.UUID  `json:"info_id"`
	IRID         string     `json:"ir_id"`
	MeetingDate  *time.Time `json:"meeting_date"`
	MeetingTime  *time.Time `json:"meeting_time"`
	Mode         *string    `json:"mode"`
	Status       string     `json:"status"`
	Remarks      *string    `json:"remarks"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type InviteResponse struct {
	ID          uuid.UUID `json:"id"`
	InfoID      uuid.UUID `json:"info_id"`
	IRID        string    `json:"ir_id"`
	MeetingDate *string   `json:"meeting_date"`
	MeetingTime *string   `json:"meeting_time"`
	Mode        *string   `json:"mode"`
	Status      string    `json:"status"`
	Remarks     *string   `json:"remarks"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CreateInviteRequest struct {
	InfoID      string  `json:"info_id" binding:"required"`
	IRID        string  `json:"ir_id" binding:"required"`
	MeetingDate *string `json:"meeting_date"`
	MeetingTime *string `json:"meeting_time"`
	Mode        *string `json:"mode"`
	Status      string  `json:"status" binding:"required"`
	Remarks     *string `json:"remarks"`
}

type UpdateInviteRequest struct {
	MeetingDate *string `json:"meeting_date"`
	MeetingTime *string `json:"meeting_time"`
	Mode        *string `json:"mode"`
	Status      *string `json:"status"`
	Remarks     *string `json:"remarks"`
}

type UpdateInviteRequestWithTime struct {
	MeetingDate *time.Time
	MeetingTime *time.Time
	Mode        *string
	Status      *string
	Remarks     *string
}

type ListInvitesQuery struct {
	Page   int    `form:"page"`
	Limit  int    `form:"limit"`
	InfoID string `form:"info_id"`
	IRID   string `form:"ir_id"`
}

type ListInvitesResponse struct {
	Data  []InviteResponse `json:"data"`
	Total int64            `json:"total"`
	Page  int              `json:"page"`
	Limit int              `json:"limit"`
}

type CreateInviteWithDKDRequest struct {
	IRID         string  `json:"ir_id" binding:"required"`
	ProspectName string  `json:"prospect_name" binding:"required"`
	Phone        *string `json:"phone"`
	InfoStatus   string  `json:"info_status" binding:"required"`
	Mode         *string `json:"mode"`
	MeetingDate  *string `json:"meeting_date"`
	MeetingTime  *string `json:"meeting_time"`
	Status       string  `json:"status" binding:"required"`
	Remarks      *string `json:"remarks"`
}

type InviteWithInfoResponse struct {
	Invite *InviteResponse `json:"invite"`
	Info   *Info           `json:"info"`
}

func (i *Invite) ToResponse() *InviteResponse {
	var meetingDate *string
	if i.MeetingDate != nil {
		date := i.MeetingDate.Format("2006-01-02")
		meetingDate = &date
	}

	var meetingTime *string
	if i.MeetingTime != nil {
		timeStr := i.MeetingTime.Format("15:04:05")
		meetingTime = &timeStr
	}

	return &InviteResponse{
		ID:          i.ID,
		InfoID:      i.InfoID,
		IRID:        i.IRID,
		MeetingDate: meetingDate,
		MeetingTime: meetingTime,
		Mode:        i.Mode,
		Status:      i.Status,
		Remarks:     i.Remarks,
		CreatedAt:   i.CreatedAt,
		UpdatedAt:   i.UpdatedAt,
	}
}
