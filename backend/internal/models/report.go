package models

import "time"

type IndividualReportRequest struct {
	UserID    string `json:"user_id" binding:"required"`
	StartDate string `json:"start_date" binding:"required"`
	EndDate   string `json:"end_date" binding:"required"`
}

type TeamReportRequest struct {
	VerticalRoots []string `json:"vertical_roots" binding:"required,min=1"`
	StartDate     string   `json:"start_date" binding:"required"`
	EndDate       string   `json:"end_date" binding:"required"`
}

type ActivityCounts struct {
	Infos     int64 `json:"infos"`
	Invites   int64 `json:"invites"`
	Plans     int64 `json:"plans"`
	Closings  int64 `json:"closings"`
	FGInvites int64 `json:"fg_invites"`
	FeelGoods int64 `json:"feel_goods"`
	Done      int64 `json:"done"`
	KIV       int64 `json:"kiv"`
}

type PipelineSummary struct {
	TentativeUV float64 `json:"tentative_uv"`
	StrongUV    float64 `json:"strong_uv"`
	SureshotUV  float64 `json:"sureshot_uv"`
	TotalUV     float64 `json:"total_uv"`
}

type PipelineDetail struct {
	SlNo        int       `json:"sl_no"`
	IRName      string    `json:"ir_name"`
	ProspectName string   `json:"prospect_name"`
	ExpectedUVs float64   `json:"expected_uvs"`
	Remarks     string    `json:"remarks"`
}

type IndividualReportResponse struct {
	UserID           string             `json:"user_id"`
	UserIRID         string             `json:"user_ir_id"`
	UserName         string             `json:"user_name"`
	ActivityCounts   ActivityCounts     `json:"activity_counts"`
	PipelineSummary  PipelineSummary    `json:"pipeline_summary"`
	TentativeDetails []PipelineDetail   `json:"tentative_details"`
	StrongDetails    []PipelineDetail   `json:"strong_details"`
	SureshotDetails  []PipelineDetail   `json:"sureshot_details"`
}

type VerticalSummary struct {
	VerticalRoot    string            `json:"vertical_root"`
	VerticalIRID    string            `json:"vertical_ir_id"`
	UserName        string            `json:"user_name"`
	ActivityCounts  ActivityCounts    `json:"activity_counts"`
	PipelineSummary PipelineSummary   `json:"pipeline_summary"`
}

type VerticalPipeline struct {
	VerticalRoot    string           `json:"vertical_root"`
	TentativeDetails []PipelineDetail `json:"tentative_details"`
	StrongDetails    []PipelineDetail `json:"strong_details"`
	SureshotDetails  []PipelineDetail `json:"sureshot_details"`
}

type TeamReportResponse struct {
	StartDate      string              `json:"start_date"`
	EndDate        string              `json:"end_date"`
	Verticals      []VerticalSummary   `json:"verticals"`
	PipelineDetails []VerticalPipeline `json:"pipeline_details"`
}

type ExcelExportMeta struct {
	Filename  string    `json:"filename"`
	ExportURL string    `json:"export_url"`
	ExportedAt time.Time `json:"exported_at"`
}
