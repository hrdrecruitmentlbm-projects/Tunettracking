import { AttendanceWithUser, AttendanceTodo, UserRole } from "@/types";

/**
 * Attendance matrix logic for the admin Rekap Absensi page.
 *
 * The core problem this solves: the `attendance` table only stores rows that
 * exist. Someone who never clocked in has NO row, so a plain log of punches
 * can never answer "who was missing". Absence is a set difference:
 *
 *   (active roster x working days) - (recorded cells)
 *
 * This module builds that second set explicitly, so a missing day becomes a
 * visible cell rather than an invisible omission.
 */

/** Sunday. Skipped as a working day (team works Mon-Sat). */
const SUNDAY = 0;

/** A shift longer than this is flagged as a data anomaly, not a real shift. */
export const MAX_PLAUSIBLE_MINUTES = 18 * 60;

/**
 * Attendance status for one person on one working day.
 *
 * Note the three distinct absence states. "Forgot one of the two punches" is
 * not a soft variant of incomplete -- it has a different cause and, in the
 * `alfaPagi` case, makes hours-worked unknowable.
 *
 * - `lengkap`     both punches, plausible duration  -> hadir
 * - `anomali`     both punches, implausible duration -> hadir, but data problem
 * - `alfaPagi`    Pulang only, no Berangkat         -> tidak hadir
 * - `alfaPulang`  Berangkat only, no Pulang         -> tidak hadir
 * - `alfa`        neither punch                     -> tidak hadir
 */
export type CellStatus =
  | "lengkap"
  | "anomali"
  | "alfaPagi"
  | "alfaPulang"
  | "alfa";

/** Statuses that mean "did not attend". All reduce % kehadiran. */
export const ABSENT_STATUSES: CellStatus[] = ["alfaPagi", "alfaPulang", "alfa"];

export function isAbsent(status: CellStatus): boolean {
  return ABSENT_STATUSES.includes(status);
}

export interface RosterEntry {
  id: string;
  name: string;
  role: UserRole;
}

export interface MatrixCell {
  date: string;
  status: CellStatus;
  /** ISO timestamp of the Berangkat punch, if any. */
  berangkat: string | null;
  /** ISO timestamp of the Pulang punch, if any. */
  pulang: string | null;
  /** Minutes between punches. Null when either punch is missing or anomalous. */
  durationMinutes: number | null;
  photo_file_id: string | null;
  todos: AttendanceTodo[];
  /**
   * True when duration could not be computed for a reason other than a
   * missing punch (backwards or zero-length timestamps). Excluded from the
   * average-duration stat so garbage does not drag the average down.
   */
  durationUnreliable: boolean;
}

export interface PersonSummary {
  userId: string;
  name: string;
  role: UserRole;
  /** Working days in the period (same for everyone). */
  scheduled: number;
  lengkap: number;
  anomali: number;
  alfaPagi: number;
  alfaPulang: number;
  alfa: number;
  /** lengkap + anomali */
  hadir: number;
  /** Alfa across all three absence kinds. */
  tidakHadir: number;
  /** hadir / scheduled, 0-100. */
  percentage: number;
  /** Sum of reliable durations, in minutes. */
  totalMinutes: number;
  /** Average of reliable durations only. Null when no day was reliable. */
  averageMinutes: number | null;
  /** Most recent date with any punch, or null. */
  lastPresentDate: string | null;
  /** Dates with any absence, chronologically. */
  absentDates: string[];
}

export interface DaySummary {
  date: string;
  lengkap: number;
  anomali: number;
  alfaPagi: number;
  alfaPulang: number;
  alfa: number;
  hadir: number;
  total: number;
  /** hadir / total, 0-100. */
  percentage: number;
}

export interface AttendanceMatrix {
  /** Working dates, chronological. */
  dates: string[];
  people: PersonSummary[];
  /** Lookup by `${userId}::${date}`. */
  cellMap: Map<string, MatrixCell>;
  days: DaySummary[];
  totals: {
    scheduled: number;
    lengkap: number;
    anomali: number;
    alfaPagi: number;
    alfaPulang: number;
    alfa: number;
    hadir: number;
    tidakHadir: number;
    percentage: number;
    totalMinutes: number;
    averageMinutes: number | null;
    /** Days excluded from averageMinutes because duration was unreliable. */
    unreliableDays: number;
  };
}

// ===== Date walking =====

/**
 * Parse a `YYYY-MM-DD` string as a *calendar* date, not an instant.
 * Using `new Date("2026-09-26")` parses as UTC midnight, which lands on the
 * previous day for any negative UTC offset and can silently shift columns.
 */
function parseDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Working dates between startDate and endDate inclusive, Monday-Saturday.
 * Sundays are excluded entirely.
 *
 * Uses local-time date arithmetic (not toISOString) so the range matches the
 * user's own calendar in WIB.
 */
export function getWorkingDates(startDate: string, endDate: string): string[] {
  if (!startDate || !endDate || startDate > endDate) return [];
  const out: string[] = [];
  const cursor = parseDateStr(startDate);
  const end = parseDateStr(endDate);
  // Guard against unbounded loops from malformed input.
  const MAX_DAYS = 366;
  for (let i = 0; i < MAX_DAYS; i++) {
    if (cursor > end) break;
    if (cursor.getDay() !== SUNDAY) out.push(toDateStr(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

/** Dates in the range that are NOT working days, for rendering as gaps. */
export function getNonWorkingDates(startDate: string, endDate: string): string[] {
  if (!startDate || !endDate || startDate > endDate) return [];
  const out: string[] = [];
  const cursor = parseDateStr(startDate);
  const end = parseDateStr(endDate);
  for (let i = 0; i < 366; i++) {
    if (cursor > end) break;
    if (cursor.getDay() === SUNDAY) out.push(toDateStr(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

// ===== Cell status =====

/**
 * Classify one person-day from its raw punches.
 *
 * A duration of exactly 0 (or negative) is routed to `anomali`, not silently
 * floored to 0 and reported as a complete day.
 */
export function classifyCell(
  berangkat: string | null,
  pulang: string | null
): { status: CellStatus; durationMinutes: number | null; durationUnreliable: boolean } {
  if (!berangkat && !pulang) {
    return { status: "alfa", durationMinutes: null, durationUnreliable: false };
  }
  if (!berangkat) {
    return { status: "alfaPagi", durationMinutes: null, durationUnreliable: false };
  }
  if (!pulang) {
    return { status: "alfaPulang", durationMinutes: null, durationUnreliable: false };
  }

  const diff =
    new Date(pulang).getTime() - new Date(berangkat).getTime();
  const rawMinutes = Math.round(diff / 60000);

  if (rawMinutes <= 0) {
    // Pulang at or before Berangkat. Clock skew, a mis-punched timestamp, or
    // an overnight shift split across two attendance_dates by the WIB RPC.
    return { status: "anomali", durationMinutes: null, durationUnreliable: true };
  }
  if (rawMinutes > MAX_PLAUSIBLE_MINUTES) {
    return { status: "anomali", durationMinutes: rawMinutes, durationUnreliable: true };
  }
  return { status: "lengkap", durationMinutes: rawMinutes, durationUnreliable: false };
}

// ===== Matrix construction =====

type RawDay = {
  berangkat: AttendanceWithUser | null;
  pulang: AttendanceWithUser | null;
};

/**
 * Build the full matrix from the active roster and raw punch rows.
 *
 * `roster` must include every active employee -- anyone absent from it is
 * invisible to this function, which is exactly the bug this replaces.
 */
export function buildMatrix(
  roster: RosterEntry[],
  rows: AttendanceWithUser[],
  workingDates: string[]
): AttendanceMatrix {
  // Group punches by user + date.
  const rawMap = new Map<string, RawDay>();
  for (const row of rows) {
    if (!row.user_id || !row.attendance_date) continue;
    const key = `${row.user_id}::${row.attendance_date}`;
    const existing = rawMap.get(key) ?? { berangkat: null, pulang: null };
    if (row.type === "berangkat") {
      existing.berangkat = row;
    } else if (row.type === "pulang") {
      existing.pulang = row;
    }
    rawMap.set(key, existing);
  }

  const cellMap = new Map<string, MatrixCell>();
  const people: PersonSummary[] = [];
  const dayTotals = new Map<
    string,
    { lengkap: number; anomali: number; alfaPagi: number; alfaPulang: number; alfa: number }
  >();

  for (const date of workingDates) {
    dayTotals.set(date, {
      lengkap: 0,
      anomali: 0,
      alfaPagi: 0,
      alfaPulang: 0,
      alfa: 0,
    });
  }

  for (const person of roster) {
    const summary: PersonSummary = {
      userId: person.id,
      name: person.name,
      role: person.role,
      scheduled: workingDates.length,
      lengkap: 0,
      anomali: 0,
      alfaPagi: 0,
      alfaPulang: 0,
      alfa: 0,
      hadir: 0,
      tidakHadir: 0,
      percentage: 0,
      totalMinutes: 0,
      averageMinutes: null,
      lastPresentDate: null,
      absentDates: [],
    };
    let reliableDurations = 0;

    for (const date of workingDates) {
      const key = `${person.id}::${date}`;
      const raw = rawMap.get(key) ?? { berangkat: null, pulang: null };
      const classified = classifyCell(
        raw.berangkat?.timestamp ?? null,
        raw.pulang?.timestamp ?? null
      );

      const cell: MatrixCell = {
        date,
        status: classified.status,
        berangkat: raw.berangkat?.timestamp ?? null,
        pulang: raw.pulang?.timestamp ?? null,
        durationMinutes: classified.durationMinutes,
        photo_file_id: raw.berangkat?.photo_file_id ?? null,
        todos: raw.berangkat?.todos ?? [],
        durationUnreliable: classified.durationUnreliable,
      };
      cellMap.set(key, cell);

      summary[classified.status] += 1;

      // All three absence states count as tidak hadir. Forgetting the morning
      // punch is not partial credit -- the day is not a complete attendance.
      if (isAbsent(classified.status)) {
        summary.tidakHadir += 1;
        summary.absentDates.push(date);
      } else {
        summary.hadir += 1;
        summary.lastPresentDate = date;
      }

      if (classified.durationMinutes != null && !classified.durationUnreliable) {
        summary.totalMinutes += classified.durationMinutes;
        reliableDurations += 1;
      }

      const bucket = dayTotals.get(date)!;
      bucket[classified.status] += 1;
    }

    summary.percentage = workingDates.length
      ? Math.round((summary.hadir / workingDates.length) * 100)
      : 0;
    summary.averageMinutes =
      reliableDurations > 0
        ? Math.round(summary.totalMinutes / reliableDurations)
        : null;

    people.push(summary);
  }

  // Worst first: most absences, then lupa-absen-pagi, then name for stability.
  people.sort((a, b) => {
    if (b.tidakHadir !== a.tidakHadir) return b.tidakHadir - a.tidakHadir;
    if (b.alfaPagi !== a.alfaPagi) return b.alfaPagi - a.alfaPagi;
    return a.name.localeCompare(b.name);
  });

  const days: DaySummary[] = workingDates.map((date) => {
    const b = dayTotals.get(date)!;
    const hadir = b.lengkap + b.anomali;
    const total = roster.length;
    return {
      date,
      lengkap: b.lengkap,
      anomali: b.anomali,
      alfaPagi: b.alfaPagi,
      alfaPulang: b.alfaPulang,
      alfa: b.alfa,
      hadir,
      total,
      percentage: total ? Math.round((hadir / total) * 100) : 0,
    };
  });

  const totals = summarizeDays(days, workingDates.length, roster.length, cellMap);

  return { dates: workingDates, people, cellMap, days, totals };
}

/** Aggregate across every cell. Averages exclude unreliable durations. */
function summarizeDays(
  days: DaySummary[],
  scheduledPerPerson: number,
  headcount: number,
  cellMap: Map<string, MatrixCell>
): AttendanceMatrix["totals"] {
  const sum = (pick: (d: DaySummary) => number) =>
    days.reduce((acc, d) => acc + pick(d), 0);

  const lengkap = sum((d) => d.lengkap);
  const anomali = sum((d) => d.anomali);
  const alfaPagi = sum((d) => d.alfaPagi);
  const alfaPulang = sum((d) => d.alfaPulang);
  const alfa = sum((d) => d.alfa);
  const hadir = lengkap + anomali;
  const tidakHadir = alfaPagi + alfaPulang + alfa;
  const totalCells = scheduledPerPerson * headcount;

  let totalMinutes = 0;
  let reliableDays = 0;
  let unreliableDays = 0;
  for (const cell of cellMap.values()) {
    if (cell.durationMinutes != null && !cell.durationUnreliable) {
      totalMinutes += cell.durationMinutes;
      reliableDays += 1;
    } else if (cell.status === "anomali") {
      // A missing punch is not "unreliable" -- its hours are simply unknown
      // by definition. Only genuine data problems count here.
      unreliableDays += 1;
    }
  }

  return {
    scheduled: scheduledPerPerson,
    lengkap,
    anomali,
    alfaPagi,
    alfaPulang,
    alfa,
    hadir,
    tidakHadir,
    percentage: totalCells ? Math.round((hadir / totalCells) * 100) : 0,
    totalMinutes,
    averageMinutes: reliableDays > 0 ? Math.round(totalMinutes / reliableDays) : null,
    unreliableDays,
  };
}

/** Look up a cell. Returns null for a date outside the working range. */
export function getCell(
  matrix: AttendanceMatrix,
  userId: string,
  date: string
): MatrixCell | null {
  return matrix.cellMap.get(`${userId}::${date}`) ?? null;
}

/** Count of each status across the whole matrix, for filter-chip badges. */
export function countByStatus(matrix: AttendanceMatrix): Record<CellStatus, number> {
  const counts: Record<CellStatus, number> = {
    lengkap: 0,
    anomali: 0,
    alfaPagi: 0,
    alfaPulang: 0,
    alfa: 0,
  };
  for (const cell of matrix.cellMap.values()) counts[cell.status] += 1;
  return counts;
}

/**
 * People with at least one absence, worst first. People with a clean record
 * are kept (sorted last) so a manager can confirm the fully clean staff too.
 */
export function buildMissingList(
  matrix: AttendanceMatrix
): Array<PersonSummary & { lastPresent: string | null }> {
  return matrix.people.map((p) => ({ ...p, lastPresent: p.lastPresentDate }));
}

/** True when the person has any cell matching the filter. */
export function matchesStatusFilter(
  cell: MatrixCell,
  filter: CellStatus | "all"
): boolean {
  return filter === "all" || cell.status === filter;
}
