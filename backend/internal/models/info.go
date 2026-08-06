package models

import (
	"time"

	"github.com/google/uuid"
)

type Info struct {
	ID           uuid.UUID `json:"id"`
	IRID         string    `json:"ir_id"`
	ProspectName string    `json:"prospect_name"`
	Phone        *string   `json:"phone"`
	Response     *string   `json:"response"`
	Status       string    `json:"status"`
	Remarks      *string   `json:"remarks"`
	CreatedBy    uuid.UUID `json:"created_by"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type CreateInfoRequest struct {
	IRID         string  `json:"ir_id" binding:"required"`
	ProspectName string  `json:"prospect_name" binding:"required"`
	Phone        *string `json:"phone"`
	Response     *string `json:"response"`
	Status       string  `json:"status" binding:"required"`
	Remarks      *string `json:"remarks"`
	CreatedBy    string  `json:"created_by" binding:"required"`
}

type UpdateInfoRequest struct {
	IRID         string  `json:"ir_id"`
	ProspectName string  `json:"prospect_name"`
	Phone        *string `json:"phone"`
	Response     *string `json:"response"`
	Status       string  `json:"status"`
	Remarks      *string `json:"remarks"`
}

type ListInfosQuery struct {
	Page   int    `form:"page"`
	Limit  int    `form:"limit"`
	Search string `form:"search"`
	IRID   string `form:"ir_id"`
	Status string `form:"status"`
}

type ListInfosResponse struct {
	Data  []Info `json:"data"`
	Total int64  `json:"total"`
	Page  int    `json:"page"`
	Limit int    `json:"limit"`
}
