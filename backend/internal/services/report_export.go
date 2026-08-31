package services

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"strconv"

	"github.com/Surajpragallapati03/activity-tracker/backend/internal/models"
	"github.com/jung-kurt/gofpdf"
	"github.com/xuri/excelize/v2"
)

// Individual Report Exports

func exportIndividualToExcel(report *models.IndividualReportResponse) ([]byte, string, string, error) {
	f := excelize.NewFile()

	// Summary Sheet
	f.SetSheetName("Sheet1", "Summary")
	summarySheet := "Summary"

	// Headers and data for Summary sheet
	f.SetCellValue(summarySheet, "A1", "Report Type")
	f.SetCellValue(summarySheet, "B1", "Individual")
	f.SetCellValue(summarySheet, "A2", "User Name")
	f.SetCellValue(summarySheet, "B2", report.UserName)
	f.SetCellValue(summarySheet, "A3", "IR ID")
	f.SetCellValue(summarySheet, "B3", report.UserIRID)

	row := 5
	f.SetCellValue(summarySheet, fmt.Sprintf("A%d", row), "Activity Metrics")
	f.SetCellValue(summarySheet, fmt.Sprintf("B%d", row), "Count")
	row++

	metrics := []struct {
		label string
		value int64
	}{
		{"Infos", report.ActivityCounts.Infos},
		{"Invites", report.ActivityCounts.Invites},
		{"Plans", report.ActivityCounts.Plans},
		{"Closings", report.ActivityCounts.Closings},
		{"FG Invites", report.ActivityCounts.FGInvites},
		{"Feel Goods", report.ActivityCounts.FeelGoods},
		{"Done", report.ActivityCounts.Done},
		{"KIV", report.ActivityCounts.KIV},
	}

	for _, m := range metrics {
		f.SetCellValue(summarySheet, fmt.Sprintf("A%d", row), m.label)
		f.SetCellValue(summarySheet, fmt.Sprintf("B%d", row), m.value)
		row++
	}

	row += 2
	f.SetCellValue(summarySheet, fmt.Sprintf("A%d", row), "Pipeline Summary")
	f.SetCellValue(summarySheet, fmt.Sprintf("B%d", row), "UV")
	row++

	pipeline := []struct {
		label string
		value float64
	}{
		{"Tentative UV", report.PipelineSummary.TentativeUV},
		{"Strong UV", report.PipelineSummary.StrongUV},
		{"Sureshot UV", report.PipelineSummary.SureshotUV},
		{"Total Pipeline UV", report.PipelineSummary.TotalUV},
	}

	for _, p := range pipeline {
		f.SetCellValue(summarySheet, fmt.Sprintf("A%d", row), p.label)
		f.SetCellValue(summarySheet, fmt.Sprintf("B%d", row), fmt.Sprintf("%.2f", p.value))
		row++
	}

	// Pipeline Details Sheet
	detailsSheet := "Pipeline Details"
	f.NewSheet(detailsSheet)

	f.SetCellValue(detailsSheet, "A1", "Status")
	f.SetCellValue(detailsSheet, "B1", "Sl. No.")
	f.SetCellValue(detailsSheet, "C1", "IR Name")
	f.SetCellValue(detailsSheet, "D1", "Prospect Name")
	f.SetCellValue(detailsSheet, "E1", "Expected UVs")
	f.SetCellValue(detailsSheet, "F1", "Remarks")

	row = 2
	for _, status := range []struct {
		name    string
		details []models.PipelineDetail
	}{
		{"Tentative", report.TentativeDetails},
		{"Strong", report.StrongDetails},
		{"Sureshot", report.SureshotDetails},
	} {
		for _, detail := range status.details {
			f.SetCellValue(detailsSheet, fmt.Sprintf("A%d", row), status.name)
			f.SetCellValue(detailsSheet, fmt.Sprintf("B%d", row), detail.SlNo)
			f.SetCellValue(detailsSheet, fmt.Sprintf("C%d", row), detail.IRName)
			f.SetCellValue(detailsSheet, fmt.Sprintf("D%d", row), detail.ProspectName)
			f.SetCellValue(detailsSheet, fmt.Sprintf("E%d", row), fmt.Sprintf("%.2f", detail.ExpectedUVs))
			f.SetCellValue(detailsSheet, fmt.Sprintf("F%d", row), detail.Remarks)
			row++
		}
	}

	// Adjust column widths
	f.SetColWidth(summarySheet, "A", "B", 20)
	f.SetColWidth(detailsSheet, "A", "F", 18)

	buf := new(bytes.Buffer)
	if err := f.Write(buf); err != nil {
		return nil, "", "", err
	}

	filename := "individual-report.xlsx"
	return buf.Bytes(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename, nil
}

func exportIndividualToCSV(report *models.IndividualReportResponse) ([]byte, string, string, error) {
	buf := new(bytes.Buffer)
	w := csv.NewWriter(buf)

	// Summary section
	w.Write([]string{"Report Type", "Individual"})
	w.Write([]string{"User Name", report.UserName})
	w.Write([]string{"IR ID", report.UserIRID})
	w.Write([]string{})

	// Activity counts
	w.Write([]string{"Activity Metrics", "Count"})
	w.Write([]string{"Infos", strconv.FormatInt(report.ActivityCounts.Infos, 10)})
	w.Write([]string{"Invites", strconv.FormatInt(report.ActivityCounts.Invites, 10)})
	w.Write([]string{"Plans", strconv.FormatInt(report.ActivityCounts.Plans, 10)})
	w.Write([]string{"Closings", strconv.FormatInt(report.ActivityCounts.Closings, 10)})
	w.Write([]string{"FG Invites", strconv.FormatInt(report.ActivityCounts.FGInvites, 10)})
	w.Write([]string{"Feel Goods", strconv.FormatInt(report.ActivityCounts.FeelGoods, 10)})
	w.Write([]string{"Done", strconv.FormatInt(report.ActivityCounts.Done, 10)})
	w.Write([]string{"KIV", strconv.FormatInt(report.ActivityCounts.KIV, 10)})
	w.Write([]string{})

	// Pipeline summary
	w.Write([]string{"Pipeline Summary", "UV"})
	w.Write([]string{"Tentative UV", fmt.Sprintf("%.2f", report.PipelineSummary.TentativeUV)})
	w.Write([]string{"Strong UV", fmt.Sprintf("%.2f", report.PipelineSummary.StrongUV)})
	w.Write([]string{"Sureshot UV", fmt.Sprintf("%.2f", report.PipelineSummary.SureshotUV)})
	w.Write([]string{"Total Pipeline UV", fmt.Sprintf("%.2f", report.PipelineSummary.TotalUV)})
	w.Write([]string{})

	// Pipeline details
	w.Write([]string{"Status", "Sl. No.", "IR Name", "Prospect Name", "Expected UVs", "Remarks"})
	for _, detail := range report.TentativeDetails {
		w.Write([]string{
			"Tentative",
			strconv.Itoa(detail.SlNo),
			detail.IRName,
			detail.ProspectName,
			fmt.Sprintf("%.2f", detail.ExpectedUVs),
			detail.Remarks,
		})
	}
	for _, detail := range report.StrongDetails {
		w.Write([]string{
			"Strong",
			strconv.Itoa(detail.SlNo),
			detail.IRName,
			detail.ProspectName,
			fmt.Sprintf("%.2f", detail.ExpectedUVs),
			detail.Remarks,
		})
	}
	for _, detail := range report.SureshotDetails {
		w.Write([]string{
			"Sureshot",
			strconv.Itoa(detail.SlNo),
			detail.IRName,
			detail.ProspectName,
			fmt.Sprintf("%.2f", detail.ExpectedUVs),
			detail.Remarks,
		})
	}

	w.Flush()

	filename := "individual-report.csv"
	return buf.Bytes(), "text/csv", filename, nil
}

func exportIndividualToPDF(report *models.IndividualReportResponse) ([]byte, string, string, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()
	pdf.SetFont("Arial", "B", 16)
	pdf.Cell(0, 10, "Individual Report")
	pdf.Ln(15)

	pdf.SetFont("Arial", "", 11)
	pdf.Cell(0, 8, fmt.Sprintf("User: %s", report.UserName))
	pdf.Ln(6)
	pdf.Cell(0, 8, fmt.Sprintf("IR ID: %s", report.UserIRID))
	pdf.Ln(12)

	// Activity Summary
	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(0, 8, "Activity Summary")
	pdf.Ln(8)

	pdf.SetFont("Arial", "", 10)
	pdf.SetDrawColor(200, 200, 200)
	pdf.SetFillColor(240, 240, 240)

	colWidths := []float64{60, 30}
	activities := [][]string{
		{"Infos", strconv.FormatInt(report.ActivityCounts.Infos, 10)},
		{"Invites", strconv.FormatInt(report.ActivityCounts.Invites, 10)},
		{"Plans", strconv.FormatInt(report.ActivityCounts.Plans, 10)},
		{"Closings", strconv.FormatInt(report.ActivityCounts.Closings, 10)},
		{"FG Invites", strconv.FormatInt(report.ActivityCounts.FGInvites, 10)},
		{"Feel Goods", strconv.FormatInt(report.ActivityCounts.FeelGoods, 10)},
		{"Done", strconv.FormatInt(report.ActivityCounts.Done, 10)},
		{"KIV", strconv.FormatInt(report.ActivityCounts.KIV, 10)},
	}

	for _, row := range activities {
		pdf.CellFormat(colWidths[0], 7, row[0], "1", 0, "L", false, 0, "")
		pdf.CellFormat(colWidths[1], 7, row[1], "1", 1, "R", false, 0, "")
	}
	pdf.Ln(5)

	// Pipeline Summary
	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(0, 8, "Pipeline Summary")
	pdf.Ln(8)

	pdf.SetFont("Arial", "", 10)
	pipeline := [][]string{
		{"Tentative UV", fmt.Sprintf("%.2f", report.PipelineSummary.TentativeUV)},
		{"Strong UV", fmt.Sprintf("%.2f", report.PipelineSummary.StrongUV)},
		{"Sureshot UV", fmt.Sprintf("%.2f", report.PipelineSummary.SureshotUV)},
		{"Total Pipeline UV", fmt.Sprintf("%.2f", report.PipelineSummary.TotalUV)},
	}

	for _, row := range pipeline {
		pdf.CellFormat(colWidths[0], 7, row[0], "1", 0, "L", false, 0, "")
		pdf.CellFormat(colWidths[1], 7, row[1], "1", 1, "R", false, 0, "")
	}
	pdf.Ln(8)

	// Pipeline Details
	addPipelineDetailsToPDF(pdf, report)

	buf := new(bytes.Buffer)
	if err := pdf.Output(buf); err != nil {
		return nil, "", "", err
	}

	filename := "individual-report.pdf"
	return buf.Bytes(), "application/pdf", filename, nil
}

func addPipelineDetailsToPDF(pdf *gofpdf.Fpdf, report *models.IndividualReportResponse) {
	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(0, 8, "Pipeline Details")
	pdf.Ln(8)

	for _, section := range []struct {
		title   string
		details []models.PipelineDetail
	}{
		{"Tentative", report.TentativeDetails},
		{"Strong", report.StrongDetails},
		{"Sureshot", report.SureshotDetails},
	} {
		if len(section.details) == 0 {
			continue
		}

		pdf.SetFont("Arial", "B", 11)
		pdf.Cell(0, 7, section.title)
		pdf.Ln(7)

		pdf.SetFont("Arial", "", 9)
		pdf.SetDrawColor(200, 200, 200)
		pdf.SetFillColor(240, 240, 240)

		// Headers
		pdf.CellFormat(15, 6, "Sl.", "1", 0, "C", false, 0, "")
		pdf.CellFormat(40, 6, "IR Name", "1", 0, "L", false, 0, "")
		pdf.CellFormat(50, 6, "Prospect", "1", 0, "L", false, 0, "")
		pdf.CellFormat(20, 6, "UVs", "1", 0, "R", false, 0, "")
		pdf.CellFormat(25, 6, "Remarks", "1", 1, "L", false, 0, "")

		pdf.SetFillColor(255, 255, 255)
		for _, detail := range section.details {
			pdf.CellFormat(15, 6, strconv.Itoa(detail.SlNo), "1", 0, "C", false, 0, "")
			pdf.CellFormat(40, 6, detail.IRName, "1", 0, "L", false, 0, "")
			pdf.CellFormat(50, 6, detail.ProspectName, "1", 0, "L", false, 0, "")
			pdf.CellFormat(20, 6, fmt.Sprintf("%.2f", detail.ExpectedUVs), "1", 0, "R", false, 0, "")

			remarks := detail.Remarks
			if len(remarks) > 20 {
				remarks = remarks[:20] + "..."
			}
			pdf.CellFormat(25, 6, remarks, "1", 1, "L", false, 0, "")
		}
		pdf.Ln(5)
	}
}

// Team Report Exports

func exportTeamToExcel(report *models.TeamReportResponse) ([]byte, string, string, error) {
	f := excelize.NewFile()

	// Summary Sheet
	f.SetSheetName("Sheet1", "Summary")
	summarySheet := "Summary"

	f.SetCellValue(summarySheet, "A1", "Team")
	f.SetCellValue(summarySheet, "B1", "Infos")
	f.SetCellValue(summarySheet, "C1", "Invites")
	f.SetCellValue(summarySheet, "D1", "Plans")
	f.SetCellValue(summarySheet, "E1", "Closings")
	f.SetCellValue(summarySheet, "F1", "FG Invites")
	f.SetCellValue(summarySheet, "G1", "Feel Goods")
	f.SetCellValue(summarySheet, "H1", "Done")
	f.SetCellValue(summarySheet, "I1", "KIV")
	f.SetCellValue(summarySheet, "J1", "Tentative UV")
	f.SetCellValue(summarySheet, "K1", "Strong UV")
	f.SetCellValue(summarySheet, "L1", "Sureshot UV")
	f.SetCellValue(summarySheet, "M1", "Total Pipeline UV")

	for idx, vertical := range report.Verticals {
		row := idx + 2
		f.SetCellValue(summarySheet, fmt.Sprintf("A%d", row), vertical.UserName+"'s Team")
		f.SetCellValue(summarySheet, fmt.Sprintf("B%d", row), vertical.ActivityCounts.Infos)
		f.SetCellValue(summarySheet, fmt.Sprintf("C%d", row), vertical.ActivityCounts.Invites)
		f.SetCellValue(summarySheet, fmt.Sprintf("D%d", row), vertical.ActivityCounts.Plans)
		f.SetCellValue(summarySheet, fmt.Sprintf("E%d", row), vertical.ActivityCounts.Closings)
		f.SetCellValue(summarySheet, fmt.Sprintf("F%d", row), vertical.ActivityCounts.FGInvites)
		f.SetCellValue(summarySheet, fmt.Sprintf("G%d", row), vertical.ActivityCounts.FeelGoods)
		f.SetCellValue(summarySheet, fmt.Sprintf("H%d", row), vertical.ActivityCounts.Done)
		f.SetCellValue(summarySheet, fmt.Sprintf("I%d", row), vertical.ActivityCounts.KIV)
		f.SetCellValue(summarySheet, fmt.Sprintf("J%d", row), fmt.Sprintf("%.2f", vertical.PipelineSummary.TentativeUV))
		f.SetCellValue(summarySheet, fmt.Sprintf("K%d", row), fmt.Sprintf("%.2f", vertical.PipelineSummary.StrongUV))
		f.SetCellValue(summarySheet, fmt.Sprintf("L%d", row), fmt.Sprintf("%.2f", vertical.PipelineSummary.SureshotUV))
		f.SetCellValue(summarySheet, fmt.Sprintf("M%d", row), fmt.Sprintf("%.2f", vertical.PipelineSummary.TotalUV))
	}

	// Pipeline Details Sheet
	detailsSheet := "Pipeline Details"
	f.NewSheet(detailsSheet)

	f.SetCellValue(detailsSheet, "A1", "Team")
	f.SetCellValue(detailsSheet, "B1", "Status")
	f.SetCellValue(detailsSheet, "C1", "Sl. No.")
	f.SetCellValue(detailsSheet, "D1", "IR Name")
	f.SetCellValue(detailsSheet, "E1", "Prospect Name")
	f.SetCellValue(detailsSheet, "F1", "Expected UVs")
	f.SetCellValue(detailsSheet, "G1", "Remarks")

	row := 2
	for idx, pipeline := range report.PipelineDetails {
		teamName := report.Verticals[idx].UserName + "'s Team"

		for _, detail := range pipeline.TentativeDetails {
			f.SetCellValue(detailsSheet, fmt.Sprintf("A%d", row), teamName)
			f.SetCellValue(detailsSheet, fmt.Sprintf("B%d", row), "Tentative")
			f.SetCellValue(detailsSheet, fmt.Sprintf("C%d", row), detail.SlNo)
			f.SetCellValue(detailsSheet, fmt.Sprintf("D%d", row), detail.IRName)
			f.SetCellValue(detailsSheet, fmt.Sprintf("E%d", row), detail.ProspectName)
			f.SetCellValue(detailsSheet, fmt.Sprintf("F%d", row), fmt.Sprintf("%.2f", detail.ExpectedUVs))
			f.SetCellValue(detailsSheet, fmt.Sprintf("G%d", row), detail.Remarks)
			row++
		}

		for _, detail := range pipeline.StrongDetails {
			f.SetCellValue(detailsSheet, fmt.Sprintf("A%d", row), teamName)
			f.SetCellValue(detailsSheet, fmt.Sprintf("B%d", row), "Strong")
			f.SetCellValue(detailsSheet, fmt.Sprintf("C%d", row), detail.SlNo)
			f.SetCellValue(detailsSheet, fmt.Sprintf("D%d", row), detail.IRName)
			f.SetCellValue(detailsSheet, fmt.Sprintf("E%d", row), detail.ProspectName)
			f.SetCellValue(detailsSheet, fmt.Sprintf("F%d", row), fmt.Sprintf("%.2f", detail.ExpectedUVs))
			f.SetCellValue(detailsSheet, fmt.Sprintf("G%d", row), detail.Remarks)
			row++
		}

		for _, detail := range pipeline.SureshotDetails {
			f.SetCellValue(detailsSheet, fmt.Sprintf("A%d", row), teamName)
			f.SetCellValue(detailsSheet, fmt.Sprintf("B%d", row), "Sureshot")
			f.SetCellValue(detailsSheet, fmt.Sprintf("C%d", row), detail.SlNo)
			f.SetCellValue(detailsSheet, fmt.Sprintf("D%d", row), detail.IRName)
			f.SetCellValue(detailsSheet, fmt.Sprintf("E%d", row), detail.ProspectName)
			f.SetCellValue(detailsSheet, fmt.Sprintf("F%d", row), fmt.Sprintf("%.2f", detail.ExpectedUVs))
			f.SetCellValue(detailsSheet, fmt.Sprintf("G%d", row), detail.Remarks)
			row++
		}
	}

	f.SetColWidth(summarySheet, "A", "M", 15)
	f.SetColWidth(detailsSheet, "A", "G", 18)

	buf := new(bytes.Buffer)
	if err := f.Write(buf); err != nil {
		return nil, "", "", err
	}

	filename := "team-report.xlsx"
	return buf.Bytes(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename, nil
}

func exportTeamToCSV(report *models.TeamReportResponse) ([]byte, string, string, error) {
	buf := new(bytes.Buffer)
	w := csv.NewWriter(buf)

	w.Write([]string{"Team Report"})
	w.Write([]string{})

	w.Write([]string{"Team", "Infos", "Invites", "Plans", "Closings", "FG Invites", "Feel Goods", "Done", "KIV", "Tentative UV", "Strong UV", "Sureshot UV", "Total Pipeline UV"})
	for _, vertical := range report.Verticals {
		w.Write([]string{
			vertical.UserName + "'s Team",
			strconv.FormatInt(vertical.ActivityCounts.Infos, 10),
			strconv.FormatInt(vertical.ActivityCounts.Invites, 10),
			strconv.FormatInt(vertical.ActivityCounts.Plans, 10),
			strconv.FormatInt(vertical.ActivityCounts.Closings, 10),
			strconv.FormatInt(vertical.ActivityCounts.FGInvites, 10),
			strconv.FormatInt(vertical.ActivityCounts.FeelGoods, 10),
			strconv.FormatInt(vertical.ActivityCounts.Done, 10),
			strconv.FormatInt(vertical.ActivityCounts.KIV, 10),
			fmt.Sprintf("%.2f", vertical.PipelineSummary.TentativeUV),
			fmt.Sprintf("%.2f", vertical.PipelineSummary.StrongUV),
			fmt.Sprintf("%.2f", vertical.PipelineSummary.SureshotUV),
			fmt.Sprintf("%.2f", vertical.PipelineSummary.TotalUV),
		})
	}

	w.Write([]string{})
	w.Write([]string{"Pipeline Details"})
	w.Write([]string{"Team", "Status", "Sl. No.", "IR Name", "Prospect Name", "Expected UVs", "Remarks"})

	for idx, pipeline := range report.PipelineDetails {
		teamName := report.Verticals[idx].UserName + "'s Team"

		for _, detail := range pipeline.TentativeDetails {
			w.Write([]string{
				teamName,
				"Tentative",
				strconv.Itoa(detail.SlNo),
				detail.IRName,
				detail.ProspectName,
				fmt.Sprintf("%.2f", detail.ExpectedUVs),
				detail.Remarks,
			})
		}

		for _, detail := range pipeline.StrongDetails {
			w.Write([]string{
				teamName,
				"Strong",
				strconv.Itoa(detail.SlNo),
				detail.IRName,
				detail.ProspectName,
				fmt.Sprintf("%.2f", detail.ExpectedUVs),
				detail.Remarks,
			})
		}

		for _, detail := range pipeline.SureshotDetails {
			w.Write([]string{
				teamName,
				"Sureshot",
				strconv.Itoa(detail.SlNo),
				detail.IRName,
				detail.ProspectName,
				fmt.Sprintf("%.2f", detail.ExpectedUVs),
				detail.Remarks,
			})
		}
	}

	w.Flush()

	filename := "team-report.csv"
	return buf.Bytes(), "text/csv", filename, nil
}

func exportTeamToPDF(report *models.TeamReportResponse) ([]byte, string, string, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()
	pdf.SetFont("Arial", "B", 16)
	pdf.Cell(0, 10, "Team Report")
	pdf.Ln(10)

	pdf.SetFont("Arial", "", 10)
	pdf.Cell(0, 8, fmt.Sprintf("Date Range: %s to %s", report.StartDate, report.EndDate))
	pdf.Ln(12)

	// Team Summary
	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(0, 8, "Team Summary")
	pdf.Ln(8)

	pdf.SetFont("Arial", "", 9)
	pdf.SetDrawColor(200, 200, 200)
	pdf.SetFillColor(240, 240, 240)

	// Headers
	colWidths := []float64{30, 15, 15, 15, 15, 18, 18, 12, 12, 18, 18, 18, 20}
	headers := []string{"Team", "Infos", "Invites", "Plans", "Closings", "FG Invites", "Feel Goods", "Done", "KIV", "Tent. UV", "Strong UV", "Sure UV", "Total UV"}

	for i, h := range headers {
		ln := 0
		if i == len(headers)-1 {
			ln = 1
		}
		pdf.CellFormat(colWidths[i], 6, h, "1", ln, "C", false, 0, "")
	}

	colWidths = []float64{30, 15, 15, 15, 15, 18, 18, 12, 12, 18, 18, 18, 20}
	pdf.SetFillColor(255, 255, 255)
	for _, vertical := range report.Verticals {
		teamName := vertical.UserName + "'s Team"
		if len(teamName) > 25 {
			teamName = teamName[:22] + "..."
		}
		pdf.CellFormat(colWidths[0], 6, teamName, "1", 0, "L", false, 0, "")
		pdf.CellFormat(colWidths[1], 6, strconv.FormatInt(vertical.ActivityCounts.Infos, 10), "1", 0, "C", false, 0, "")
		pdf.CellFormat(colWidths[2], 6, strconv.FormatInt(vertical.ActivityCounts.Invites, 10), "1", 0, "C", false, 0, "")
		pdf.CellFormat(colWidths[3], 6, strconv.FormatInt(vertical.ActivityCounts.Plans, 10), "1", 0, "C", false, 0, "")
		pdf.CellFormat(colWidths[4], 6, strconv.FormatInt(vertical.ActivityCounts.Closings, 10), "1", 0, "C", false, 0, "")
		pdf.CellFormat(colWidths[5], 6, strconv.FormatInt(vertical.ActivityCounts.FGInvites, 10), "1", 0, "C", false, 0, "")
		pdf.CellFormat(colWidths[6], 6, strconv.FormatInt(vertical.ActivityCounts.FeelGoods, 10), "1", 0, "C", false, 0, "")
		pdf.CellFormat(colWidths[7], 6, strconv.FormatInt(vertical.ActivityCounts.Done, 10), "1", 0, "C", false, 0, "")
		pdf.CellFormat(colWidths[8], 6, strconv.FormatInt(vertical.ActivityCounts.KIV, 10), "1", 0, "C", false, 0, "")
		pdf.CellFormat(colWidths[9], 6, fmt.Sprintf("%.2f", vertical.PipelineSummary.TentativeUV), "1", 0, "R", false, 0, "")
		pdf.CellFormat(colWidths[10], 6, fmt.Sprintf("%.2f", vertical.PipelineSummary.StrongUV), "1", 0, "R", false, 0, "")
		pdf.CellFormat(colWidths[11], 6, fmt.Sprintf("%.2f", vertical.PipelineSummary.SureshotUV), "1", 0, "R", false, 0, "")
		pdf.CellFormat(colWidths[12], 6, fmt.Sprintf("%.2f", vertical.PipelineSummary.TotalUV), "1", 1, "R", false, 0, "")
	}
	pdf.Ln(8)

	// Pipeline Details per Team
	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(0, 8, "Pipeline Details")
	pdf.Ln(8)

	for idx, pipeline := range report.PipelineDetails {
		teamName := report.Verticals[idx].UserName + "'s Team"

		pdf.SetFont("Arial", "B", 11)
		pdf.Cell(0, 7, teamName)
		pdf.Ln(7)

		pdf.SetFont("Arial", "", 9)

		// Headers
		pdf.CellFormat(15, 6, "Sl.", "1", 0, "C", false, 0, "")
		pdf.CellFormat(35, 6, "Status", "1", 0, "L", false, 0, "")
		pdf.CellFormat(40, 6, "IR Name", "1", 0, "L", false, 0, "")
		pdf.CellFormat(40, 6, "Prospect", "1", 0, "L", false, 0, "")
		pdf.CellFormat(18, 6, "UVs", "1", 1, "R", false, 0, "")

		for _, detail := range pipeline.TentativeDetails {
			pdf.CellFormat(15, 6, strconv.Itoa(detail.SlNo), "1", 0, "C", false, 0, "")
			pdf.CellFormat(35, 6, "Tentative", "1", 0, "L", false, 0, "")
			pdf.CellFormat(40, 6, detail.IRName, "1", 0, "L", false, 0, "")
			pdf.CellFormat(40, 6, detail.ProspectName, "1", 0, "L", false, 0, "")
			pdf.CellFormat(18, 6, fmt.Sprintf("%.2f", detail.ExpectedUVs), "1", 1, "R", false, 0, "")
		}

		for _, detail := range pipeline.StrongDetails {
			pdf.CellFormat(15, 6, strconv.Itoa(detail.SlNo), "1", 0, "C", false, 0, "")
			pdf.CellFormat(35, 6, "Strong", "1", 0, "L", false, 0, "")
			pdf.CellFormat(40, 6, detail.IRName, "1", 0, "L", false, 0, "")
			pdf.CellFormat(40, 6, detail.ProspectName, "1", 0, "L", false, 0, "")
			pdf.CellFormat(18, 6, fmt.Sprintf("%.2f", detail.ExpectedUVs), "1", 1, "R", false, 0, "")
		}

		for _, detail := range pipeline.SureshotDetails {
			pdf.CellFormat(15, 6, strconv.Itoa(detail.SlNo), "1", 0, "C", false, 0, "")
			pdf.CellFormat(35, 6, "Sureshot", "1", 0, "L", false, 0, "")
			pdf.CellFormat(40, 6, detail.IRName, "1", 0, "L", false, 0, "")
			pdf.CellFormat(40, 6, detail.ProspectName, "1", 0, "L", false, 0, "")
			pdf.CellFormat(18, 6, fmt.Sprintf("%.2f", detail.ExpectedUVs), "1", 1, "R", false, 0, "")
		}

		pdf.Ln(5)
	}

	buf := new(bytes.Buffer)
	if err := pdf.Output(buf); err != nil {
		return nil, "", "", err
	}

	filename := "team-report.pdf"
	return buf.Bytes(), "application/pdf", filename, nil
}
