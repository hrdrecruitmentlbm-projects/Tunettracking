import { AttendanceMatrix, MatrixCell } from "./attendance-matrix";

/**
 * Excel export for Rekap Absensi.
 *
 * Shape follows the manual sheet the team already keeps: for one date, a list
 * of employees with a status in column B and the scan time in column C. One
 * worksheet per working date in the selected range.
 *
 * IMPORTANT -- column B is derived from punch data only, because that is all
 * the database has. There is no leave table, so "ISIRAHAT" (izin sakit) is
 * written for anyone with no punches. That is an INFERENCE, not a recorded
 * fact: a person who forgot to clock in looks identical to a person who was
 * sick. The export is not safe to hand to payroll without someone correcting
 * the ISIRAHAT rows by hand. See `hasUnverifiedSickRows` below.
 */

/** Status written to column B. */
export const EXPORT_STATUS = {
  /** Had at least one punch. */
  masuk: "MASUK",
  /** No punches at all -- inferred sick/leave, NOT confirmed. */
  isirahat: "ISIRAHAT",
  /** Had a punch but it was implausible (bad clock, data problem). */
  anomali: "ANOMALI",
} as const;

export interface ExportRow {
  name: string;
  status: string;
  /** HH:MM in WIB, or "" when there is no punch. */
  time: string;
  /** True when status is the inferred ISIRAHAT rather than a recorded fact. */
  unverified: boolean;
}

/**
 * Format a punch as HH:MM WIB for a spreadsheet cell.
 *
 * Deliberately not `formatTimeWIB` from lib/time: that renders id-ID style
 * "08.05", and a dot in a spreadsheet reads as a decimal. The target sheet
 * uses "07:51", so this formats explicitly instead of relying on locale.
 */
function exportTime(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/**
 * Map one matrix cell to an export row value.
 *
 * The time is the Berangkat (morning) punch when present, otherwise the Pulang
 * punch. For a lupa-absen-pagi day the morning punch is the missing one, so
 * showing the evening time is misleading -- those rows are flagged instead.
 */
export function rowForCell(cell: MatrixCell): {
  status: string;
  time: string;
  unverified: boolean;
} {
  if (cell.status === "anomali") {
    return {
      status: EXPORT_STATUS.anomali,
      time: cell.berangkat ? exportTime(cell.berangkat) : "",
      unverified: false,
    };
  }

  if (cell.status === "alfa") {
    return { status: EXPORT_STATUS.isirahat, time: "", unverified: true };
  }

  // lengkap, alfaPagi, alfaPulang all have at least one punch -> they showed up.
  if (cell.berangkat) {
    return {
      status: EXPORT_STATUS.masuk,
      time: exportTime(cell.berangkat),
      unverified: false,
    };
  }
  if (cell.pulang) {
    // Clocked out but never in. Writing the evening time in the morning column
    // would read as a normal check-in, so the row is marked unverified.
    return { status: EXPORT_STATUS.masuk, time: "", unverified: true };
  }

  return { status: EXPORT_STATUS.isirahat, time: "", unverified: true };
}

/** Build the export rows for one date, in matrix order (worst attendance first). */
export function buildExportRows(
  matrix: AttendanceMatrix,
  date: string
): ExportRow[] {
  const rows: ExportRow[] = [];
  for (const person of matrix.people) {
    const cell = matrix.cellMap.get(`${person.userId}::${date}`);
    if (!cell) continue;
    const mapped = rowForCell(cell);
    rows.push({
      name: person.name,
      status: mapped.status,
      time: mapped.time,
      unverified: mapped.unverified,
    });
  }
  return rows;
}

/**
 * True when any date in the range would emit an inferred ISIRAHAT row.
 * The export button uses this to warn the user before they download.
 */
export function hasUnverifiedSickRows(matrix: AttendanceMatrix): boolean {
  for (const cell of matrix.cellMap.values()) {
    if (rowForCell(cell).unverified) return true;
  }
  return false;
}

/**
 * Excel sheet names cannot exceed 31 chars or contain : \ / ? * [ ].
 * Also truncates to 31 and disambiguates collisions, since two dates can
 * format to the same string.
 */
export function toSheetName(date: string, used: Set<string>): string {
  const iso = `${date}T12:00:00+07:00`;
  const d = new Date(iso);
  const base =
    d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }) || date;
  const cleaned = base.replace(/[:\\/?*[\]]/g, "-").slice(0, 31);

  let name = cleaned;
  let n = 2;
  while (used.has(name.toLowerCase())) {
    const suffix = ` (${n})`;
    name = `${cleaned.slice(0, 31 - suffix.length)}${suffix}`;
    n++;
  }
  used.add(name.toLowerCase());
  return name;
}

/** Filename for the download, e.g. `absensi-2026-09-01_2026-09-06.xlsx`. */
export function exportFileName(startDate: string, endDate: string): string {
  return `absensi-${startDate}_${endDate}.xlsx`;
}
