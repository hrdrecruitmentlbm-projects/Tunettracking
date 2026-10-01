"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AttendanceMatrix,
} from "@/lib/attendance-matrix";
import {
  buildExportRows,
  hasUnverifiedSickRows,
  toSheetName,
  exportFileName,
} from "@/lib/attendance-export";
import { COPY } from "@/lib/copy";
import { Download, Loader2, TriangleAlert } from "lucide-react";

interface ExportAttendanceButtonProps {
  matrix: AttendanceMatrix;
  startDate: string;
  endDate: string;
  disabled?: boolean;
}

/**
 * Downloads a real .xlsx with one worksheet per working date.
 *
 * exceljs is imported dynamically so its ~1MB payload is only fetched when an
 * admin actually exports, not on every page load.
 */
export function ExportAttendanceButton({
  matrix,
  startDate,
  endDate,
  disabled,
}: ExportAttendanceButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsWarning = hasUnverifiedSickRows(matrix);

  const handleExport = useCallback(async () => {
    if (matrix.dates.length === 0 || matrix.people.length === 0) return;
    setExporting(true);
    setError(null);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      wb.creator = "TuTrack";
      wb.created = new Date();

      const usedNames = new Set<string>();
      for (const date of matrix.dates) {
        const sheet = wb.addWorksheet(toSheetName(date, usedNames));
        sheet.columns = [
          { header: COPY.attendance.exportColName, key: "name", width: 28 },
          { header: COPY.attendance.exportColStatus, key: "status", width: 20 },
          { header: COPY.attendance.exportColTime, key: "time", width: 12 },
        ];

        // Bold the header row.
        const header = sheet.getRow(1);
        header.font = { bold: true };

        for (const r of buildExportRows(matrix, date)) {
          const row = sheet.addRow({ name: r.name, status: r.status, time: r.time });
          // Inferred ISIRAHAT / lupa-pagi rows are tinted so a human can find
          // and correct them before this sheet goes anywhere near payroll.
          if (r.unverified) {
            row.getCell("status").fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFDE68A" },
            };
          }
        }
      }

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = exportFileName(startDate, endDate);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export attendance:", err);
      setError(COPY.attendance.exportFailed);
    } finally {
      setExporting(false);
    }
  }, [matrix, startDate, endDate]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        onClick={handleExport}
        disabled={disabled || exporting || matrix.dates.length === 0}
        variant="outline"
        className="border-tunet-border bg-tunet-bg text-tunet-text hover:border-tunet-green/50 hover:text-tunet-green"
      >
        {exporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {exporting
          ? COPY.attendance.exportInProgress
          : COPY.attendance.exportButton}
      </Button>

      {needsWarning && !exporting && (
        <span className="flex items-center gap-1.5 text-[11px] text-status-progress">
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
          {COPY.attendance.exportWarningUnverified}
        </span>
      )}

      {error && <span className="text-[11px] text-status-overdue">{error}</span>}
    </div>
  );
}
