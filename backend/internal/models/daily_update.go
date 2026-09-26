package models

type DailyUpdateRequest struct {
	Date   string `json:"date" binding:"required"` // YYYY-MM-DD
	Infos  []DailyUpdateActivityRequest `json:"infos"`
	Invites []DailyUpdateActivityRequest `json:"invites"`
	Plans   []DailyUpdateActivityRequest `json:"plans"`
	Closings []DailyUpdateActivityRequest `json:"closings"`
	FGInvites []DailyUpdateActivityRequest `json:"fg_invites"`
	FeelGoods []DailyUpdateActivityRequest `json:"feel_goods"`
}

type DailyUpdateActivityRequest struct {
	ID     string                 `json:"id"`     // Empty for new activities
	Type   string                 `json:"type"`   // "info", "invite", "plan", "closing", "fg_invite", "feel_good"
	Action string                 `json:"action"` // "create", "update", "delete"
	Data   map[string]interface{} `json:"data"`
}

type DailyUpdateResponse struct {
	Date     string `json:"date"`
	Infos    []Info `json:"infos"`
	Invites  []InviteResponse `json:"invites"`
	Plans    []Plan `json:"plans"`
	Closings []ClosingResponse `json:"closings"`
	FGInvites []FGInviteResponse `json:"fg_invites"`
	FeelGoods []FeelGoodResponse `json:"feel_goods"`
}

type DailyUpdateSummary struct {
	Date      string `json:"date"`
	InfoCount int    `json:"info_count"`
	InviteCount int  `json:"invite_count"`
	PlanCount  int   `json:"plan_count"`
	ClosingCount int `json:"closing_count"`
	FGInviteCount int `json:"fg_invite_count"`
	FeelGoodCount int `json:"feel_good_count"`
	Total     int    `json:"total"`
}

type GetDailyUpdateRequest struct {
	Date string `form:"date" binding:"required"` // YYYY-MM-DD
}
