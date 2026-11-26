import { supabaseAdmin } from "./supabase-admin";
import {
  Attendance,
  AttendanceReminderSettings,
  AttendanceStats,
  AttendanceTodo,
  AttendanceType,
  AttendanceWithUser,
  DEFAULT_ATTENDANCE_REMINDER_SETTINGS,
  User,
} from "@/types";

export interface RecordAttendanceInput {
  user_id: string;
  type: AttendanceType;
  location_lat?: number | null;
  location_lng?: number | null;
  notes?: string | null;
  todos?: string[];
  photo_file_id?: string | null;
}

/**
 * Record a Berangkat or Pulang check-in.
 * Relies on the unique index `(user_id, attendance_date, type)` to prevent
 * duplicates within a single WIB day.
 *
 * Returns the inserted row, or null if a duplicate already exists.
 *
 * Uses supabaseAdmin (service-role) to bypass RLS — this function is only
 * called from API routes which authenticate via the session cookie.
 */
export async function recordAttendance(
  input: RecordAttendanceInput
): Promise<Attendance | null> {
  const attendanceDateResult = await supabaseAdmin.rpc("attendance_today_jakarta");
  const attendanceDate =
    (attendanceDateResult.data as string | null) ??
    new Date().toISOString().slice(0, 10);

  console.log("[attendance] Inserting record:", { user_id: input.user_id, type: input.type, photo_file_id: input.photo_file_id });

  const { data, error } = await supabaseAdmin
    .from("attendance")
    .insert({
      user_id: input.user_id,
      type: input.type,
      attendance_date: attendanceDate,
      location_lat: input.location_lat ?? null,
      location_lng: input.location_lng ?? null,
      notes: input.notes ?? null,
      photo_file_id: input.photo_file_id ?? null,
    })
    .select()
    .single();

  if (error) {
    // Unique violation = already clocked in/out today
    if (error.code === "23505") {
      return null;
    }
    console.error("Error recording attendance:", error);
    return null;
  }

  // Insert todos if provided (Berangkat only)
  if (input.todos && input.todos.length > 0 && data) {
    const todoRows = input.todos
      .filter((t) => t.trim().length > 0)
      .map((title) => ({
        attendance_id: data.id,
        user_id: input.user_id,
        title: title.trim(),
      }));
    if (todoRows.length > 0) {
      const { error: todoError } = await supabaseAdmin
        .from("attendance_todos")
        .insert(todoRows);
      if (todoError) {
        console.error("Error inserting attendance todos:", todoError);
      }
    }
  }

  return data as Attendance;
}

/**
 * Fetch today's attendance records for a user (0, 1, or 2 entries).
 */
export async function getTodayAttendance(userId: string): Promise<Attendance[]> {
  const todayResult = await supabaseAdmin.rpc("attendance_today_jakarta");
  const today = (todayResult.data as string | null) ?? new Date().toISOString().slice(0, 10);

  const { data, error } = await supabaseAdmin
    .from("attendance")
    .select("*")
    .eq("user_id", userId)
    .eq("attendance_date", today)
    .order("timestamp", { ascending: true });

  if (error) {
    console.error("Error fetching today's attendance:", error);
    return [];
  }

  const rows = (data || []) as Attendance[];

  // Attach todos to each attendance record
  if (rows.length > 0) {
    const ids = rows.map((r) => r.id);
    const todoMap = await getAttendanceTodos(ids);
    for (const row of rows) {
      (row as Attendance & { todos: AttendanceTodo[] }).todos = todoMap.get(row.id) ?? [];
    }
  }

  return rows;
}

/**
 * Fetch attendance history for a user for the last N days (default 60).
 * Returns up to N daily entries, but since we enforce one Berangkat +
 * one Pulang per day, the actual rows can be 0–2N.
 */
export async function getAttendanceHistory(
  userId: string,
  days = 60
): Promise<Attendance[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const { data, error } = await supabaseAdmin
    .from("attendance")
    .select("*")
    .eq("user_id", userId)
    .gte("attendance_date", cutoffStr)
    .order("attendance_date", { ascending: false })
    .order("timestamp", { ascending: true });

  if (error) {
    console.error("Error fetching attendance history:", error);
    return [];
  }

  return (data || []) as Attendance[];
}

/**
 * Batch-fetch todos for a set of attendance IDs.
 * Returns a Map keyed by attendance_id for O(1) lookups.
 */
async function getAttendanceTodos(
  attendanceIds: string[]
): Promise<Map<string, AttendanceTodo[]>> {
  if (attendanceIds.length === 0) return new Map();

  const { data, error } = await supabaseAdmin
    .from("attendance_todos")
    .select("*")
    .in("attendance_id", attendanceIds)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching attendance todos:", error);
    return new Map();
  }

  const map = new Map<string, AttendanceTodo[]>();
  for (const row of (data || []) as AttendanceTodo[]) {
    const existing = map.get(row.attendance_id) ?? [];
    existing.push(row);
    map.set(row.attendance_id, existing);
  }
  return map;
}

function groupByDay(
  rows: Attendance[],
  todoMap: Map<string, AttendanceTodo[]>
): import("@/types").GroupedDay[] {
  const map = new Map<string, import("@/types").GroupedDay>();
  for (const row of rows) {
    const existing =
      map.get(row.attendance_date) ?? {
        date: row.attendance_date,
        berangkat: null,
        pulang: null,
        durationMinutes: null,
        todos: [],
      };
    if (row.type === "berangkat") {
      existing.berangkat = row;
      existing.todos = todoMap.get(row.id) ?? [];
    } else {
      existing.pulang = row;
    }
    if (existing.berangkat && existing.pulang) {
      const diff =
        new Date(existing.pulang.timestamp).getTime() -
        new Date(existing.berangkat.timestamp).getTime();
      existing.durationMinutes = Math.max(0, Math.round(diff / 60000));
    }
    map.set(row.attendance_date, existing);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0
  );
}

/**
 * Fetch history grouped by day (for table rendering).
 */
export async function getAttendanceHistoryGrouped(
  userId: string,
  days = 60
): Promise<import("@/types").GroupedDay[]> {
  const rows = await getAttendanceHistory(userId, days);

  // Fetch todos for all berangkat entries
  const berangkatIds = rows.filter((r) => r.type === "berangkat").map((r) => r.id);
  const todoMap = await getAttendanceTodos(berangkatIds);

  return groupByDay(rows, todoMap);
}

/**
 * Compute summary stats for a user over the last 60 days.
 */
export async function getAttendanceStats(userId: string): Promise<AttendanceStats> {
  const grouped = await getAttendanceHistoryGrouped(userId, 60);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const thisMonth = grouped.filter((g) => g.date >= monthStart);
  const completeDays = thisMonth.filter((g) => g.berangkat && g.pulang);

  const totalMinutes = completeDays.reduce(
    (sum, g) => sum + (g.durationMinutes ?? 0),
    0
  );
  const averageDurationMinutes =
    completeDays.length > 0 ? Math.round(totalMinutes / completeDays.length) : 0;

  // Working days in month so far (Mon–Fri, up to today)
  let workingDays = 0;
  const startDate = new Date(monthStart);
  for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) workingDays++;
  }

  const hadirDays = thisMonth.filter((g) => g.berangkat).length;
  const hadirPercentage =
    workingDays > 0 ? Math.round((hadirDays / workingDays) * 100) : 0;

  return {
    thisMonthDays: thisMonth.length,
    totalDays: grouped.length,
    averageDurationMinutes,
    hadirPercentage: Math.min(100, hadirPercentage),
  };
}

/**
 * Admin: fetch the active employee roster.
 *
 * Required for absence reporting: `getAllAttendance` only returns people who
 * actually clocked in, so anyone absent is missing from the result set
 * entirely. Without the roster there is no way to compute "who was missing".
 *
 * Only active users are returned -- a resigned employee should not appear as
 * absent for every working day in the period.
 */
export async function getActiveUsersRoster(): Promise<
  Array<{ id: string; name: string; role: User["role"] }>
> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, name, role")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Error fetching active users roster:", error);
    return [];
  }

  return (data || []) as Array<{ id: string; name: string; role: User["role"] }>;
}

/**
 * Admin: fetch attendance for all users within a date range.
 */
export async function getAllAttendance(
  startDate?: string,
  endDate?: string
): Promise<AttendanceWithUser[]> {
  let query = supabaseAdmin
    .from("attendance")
    .select(
      `*,
      user:users(id, name, role, phone, telegram_id, is_active, created_at)`
    )
    .order("attendance_date", { ascending: false })
    .order("timestamp", { ascending: true });

  if (startDate) query = query.gte("attendance_date", startDate);
  if (endDate) query = query.lte("attendance_date", endDate);

  // Row budget: 2 punches x working days x headcount. At 1000 rows a
  // 30-day report for ~12 staff would silently truncate. The page is
  // admin-only and bounded by a date range, so a higher cap is safe.
  const { data, error } = await query.limit(5000);
  if (error) {
    console.error("Error fetching all attendance:", error);
    return [];
  }

  const rows = (data || []) as AttendanceWithUser[];

  // Fetch todos for all berangkat entries
  const berangkatIds = rows.filter((r) => r.type === "berangkat").map((r) => r.id);
  if (berangkatIds.length > 0) {
    const todoMap = await getAttendanceTodos(berangkatIds);
    for (const row of rows) {
      if (row.type === "berangkat") {
        row.todos = todoMap.get(row.id) ?? [];
      }
    }
  }

  return rows;
}

export interface JakartaClock {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  minutes: number; // minutes since 00:00 WIB
  weekday: number; // 0 = Sun .. 6 = Sat
}

export function getJakartaClock(now: Date = new Date()): JakartaClock {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(now);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hourRaw = parseInt(get("hour"), 10);
  const hour = hourRaw === 24 ? 0 : hourRaw;
  const minute = parseInt(get("minute"), 10);
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const weekday = weekdayMap[get("weekday")] ?? now.getUTCDay();

  return {
    date: `${year}-${month}-${day}`,
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    minutes: hour * 60 + minute,
    weekday,
  };
}

export function parseTimeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

export async function getAttendanceReminderSettings(): Promise<AttendanceReminderSettings> {
  try {
    const { data, error } = await supabaseAdmin
      .from("attendance_reminder_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_ATTENDANCE_REMINDER_SETTINGS;
    }

    return {
      ...DEFAULT_ATTENDANCE_REMINDER_SETTINGS,
      ...(data as Partial<AttendanceReminderSettings>),
      active_days: Array.isArray((data as AttendanceReminderSettings).active_days)
        ? (data as AttendanceReminderSettings).active_days
        : DEFAULT_ATTENDANCE_REMINDER_SETTINGS.active_days,
    };
  } catch {
    return DEFAULT_ATTENDANCE_REMINDER_SETTINGS;
  }
}

export async function updateAttendanceReminderSettings(
  input: Omit<AttendanceReminderSettings, "id" | "updated_at">
): Promise<AttendanceReminderSettings | null> {
  const payload = {
    id: "default",
    enabled: input.enabled,
    berangkat_time: input.berangkat_time,
    pulang_time: input.pulang_time,
    grace_minutes: input.grace_minutes,
    active_days: input.active_days,
    sound_enabled: input.sound_enabled,
    telegram_enabled: input.telegram_enabled,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("attendance_reminder_settings")
    .upsert(payload)
    .select()
    .single();

  if (error) {
    console.error("Error updating attendance reminder settings:", error);
    return null;
  }

  return data as AttendanceReminderSettings;
}

export interface MissingAttendanceUser {
  id: string;
  name: string;
  role: User["role"];
  telegram_id?: string | null;
  telegram_chat_id?: number | null;
}

export async function getMissingAttendanceForDate(
  date: string,
  type: AttendanceType
): Promise<MissingAttendanceUser[]> {
  const [{ data: activeUsers, error: usersError }, { data: records, error: attError }] =
    await Promise.all([
      supabaseAdmin
        .from("users")
        .select("id, name, role, telegram_id, telegram_chat_id")
        .eq("is_active", true)
        .order("name"),
      supabaseAdmin
        .from("attendance")
        .select("user_id")
        .eq("attendance_date", date)
        .eq("type", type),
    ]);

  if (usersError || attError) {
    console.error("Error computing missing attendance:", usersError || attError);
    return [];
  }

  const presentIds = new Set(
    ((records || []) as Array<{ user_id: string }>).map((r) => r.user_id)
  );

  return ((activeUsers || []) as MissingAttendanceUser[]).filter(
    (u) => !presentIds.has(u.id)
  );
}

export async function getSentReminderUserIds(
  date: string,
  type: AttendanceType
): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin
    .from("attendance_reminder_logs")
    .select("user_id")
    .eq("reminder_date", date)
    .eq("type", type)
    .eq("channel", "telegram");

  if (error || !data) return new Set();
  return new Set((data as Array<{ user_id: string }>).map((r) => r.user_id));
}

export async function recordReminderSent(
  date: string,
  type: AttendanceType,
  userId: string
): Promise<void> {
  await supabaseAdmin.from("attendance_reminder_logs").insert({
    reminder_date: date,
    type,
    user_id: userId,
    channel: "telegram",
    sent_at: new Date().toISOString(),
  });
}
