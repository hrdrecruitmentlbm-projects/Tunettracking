import { supabase } from "./supabase";
import { User, Task, Location, Tag, Notification } from "@/types";

export async function loginByPin(pin: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("pin", pin)
    .eq("is_active", true)
    .limit(1);

  if (error || !data || data.length === 0) return null;
  return data[0] as User;
}

export async function getCurrentUser(id: string): Promise<User | null> {
  if (!id) return null;
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
  return (data as User) ?? null;
}

export async function fetchUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }
  return (data || []) as User[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeTaskRow(row: any): Task {
  return {
    ...row,
    priority: row.priority?.name?.toLowerCase() ?? "medium",
    assignee: row.assignee || undefined,
    creator: row.creator || undefined,
    tags: Array.isArray(row.tags)
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        row.tags.map((t: any) => t.tag)
      : [],
  };
}

const TASK_SELECT = `
  *,
  priority:priorities(name),
  assignee:users!tasks_assigned_to_fkey(id, name, pin, role, phone, telegram_id, is_active, created_at),
  creator:users!tasks_created_by_fkey(id, name, pin, role, phone, telegram_id, is_active, created_at),
  tags:task_tags(tag:tags(id, name, color))
`;

export async function fetchTasks(options: { includeDeleted?: boolean } = {}): Promise<Task[]> {
  let query = supabase
    .from("tasks")
    .select(TASK_SELECT)
    .order("created_at", { ascending: false });

  if (!options.includeDeleted) {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }

  return (data || []).map(normalizeTaskRow);
}

export async function fetchLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from("locations")
    .select(`
      *,
      user:users(id, name, pin, role, phone, telegram_id, is_active, created_at)
    `)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching locations:", error);
    return [];
  }
  return (data || []) as Location[];
}

export async function updateTaskStatus(
  taskId: string,
  newStatus: string,
  performedBy: string
): Promise<boolean> {
  // Fetch task info before update for notification
  const { data: taskData } = await supabase
    .from("tasks")
    .select("title, assigned_to, created_by, location_name, priority:priorities(name)")
    .eq("id", taskId)
    .single();

  const { error } = await supabase.rpc("update_task_status", {
    p_task_id: taskId,
    p_new_status: newStatus,
    p_performed_by: performedBy,
  });

  if (error) {
    console.error("Error updating task status:", error);
    return false;
  }

  // Only notify on "done" — notify the creator (NOC/admin)
  if (taskData && newStatus === "done" && taskData.created_by && taskData.created_by !== performedBy) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const priorityName = (taskData as any).priority?.name ?? "medium";
    await createNotification(
      taskData.created_by,
      "Task Completed",
      `"${taskData.title}" has been marked as done.`,
      "completed",
      {
        task_id: taskId,
        title: taskData.title,
        location_name: taskData.location_name,
        priority: priorityName.toLowerCase(),
        status: "done",
      }
    );
  }

  return true;
}

export async function softDeleteTask(
  taskId: string,
  performedBy: string
): Promise<boolean> {
  const { error } = await supabase.rpc("soft_delete_task", {
    p_task_id: taskId,
    p_performed_by: performedBy,
  });

  if (error) {
    console.error("Error soft-deleting task:", error);
    return false;
  }

  return true;
}

export async function upsertLocation(
  userId: string,
  lat: number,
  lng: number,
  accuracy?: number
): Promise<boolean> {
  const result = await recordLocationUpdate(userId, lat, lng, "web_app", accuracy);
  return result.ok;
}

export async function fetchTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching tags:", error);
    return [];
  }
  return (data || []) as Tag[];
}

export interface CreateTaskInput {
  title: string;
  description: string;
  priority: string;
  assigned_to?: string;
  location_name: string;
  location_lat: number;
  location_lng: number;
  deadline?: string;
  tagIds?: string[];
}

export interface CreateTaskResult {
  task: Task | null;
  error: string | null;
}

export async function createTask(
  input: CreateTaskInput,
  currentUser: User
): Promise<CreateTaskResult> {
  if (!currentUser?.id) {
    return { task: null, error: "Session is invalid. Please log in again." };
  }

  const { data: priorityRow } = await supabase
    .from("priorities")
    .select("id")
    .eq("name", input.priority.charAt(0).toUpperCase() + input.priority.slice(1))
    .limit(1)
    .maybeSingle();

  const priorityId = priorityRow?.id ?? null;

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      title: input.title,
      description: input.description,
      status: input.assigned_to ? "assigned" : "todo",
      priority_id: priorityId,
      created_by: currentUser.id,
      assigned_to: input.assigned_to || null,
      location_name: input.location_name,
      location_lat: input.location_lat,
      location_lng: input.location_lng,
      deadline: input.deadline || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating task:", error);
    return { task: null, error: error.message };
  }

  if (input.tagIds && input.tagIds.length > 0 && task) {
    const tagInserts = input.tagIds.map((tagId) => ({
      task_id: task.id,
      tag_id: tagId,
    }));
    const { error: tagsError } = await supabase
      .from("task_tags")
      .insert(tagInserts);
    if (tagsError) {
      console.error("Error attaching task tags:", tagsError);
    }
  }

  const { data: fullTask, error: refetchError } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("id", task.id)
    .single();

  if (refetchError) {
    console.error("Error refetching created task:", refetchError);
    return { task: null, error: refetchError.message };
  }

  return { task: normalizeTaskRow(fullTask), error: null };
}

// ===== USER CRUD =====

export interface CreateUserInput {
  name: string;
  role: "admin" | "noc" | "foc";
  phone: string;
  pin: string;
  telegram_id?: string;
}

export async function createUser(input: CreateUserInput): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .insert({
      name: input.name,
      role: input.role,
      phone: input.phone,
      pin: input.pin,
      telegram_id: input.telegram_id || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating user:", error);
    return null;
  }
  return data as User;
}

export async function updateUser(
  id: string,
  input: Partial<CreateUserInput>
): Promise<User | null> {
  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.role !== undefined) updateData.role = input.role;
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.pin !== undefined) updateData.pin = input.pin;
  if (input.telegram_id !== undefined) updateData.telegram_id = input.telegram_id || null;

  const { data, error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating user:", error);
    return null;
  }
  return data as User;
}

export async function deactivateUser(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("users")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    console.error("Error deactivating user:", error);
    return false;
  }
  return true;
}

export async function deleteUser(id: string): Promise<boolean> {
  const { error } = await supabase.from("users").delete().eq("id", id);

  if (error) {
    console.error("Error deleting user:", error);
    return false;
  }
  return true;
}

// ===== TELEGRAM BINDING =====

export async function findUserByPin(pin: string): Promise<User | null> {
  if (!pin || pin.length !== 4) return null;
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("pin", pin)
    .eq("is_active", true)
    .limit(1);

  if (error || !data || data.length === 0) return null;
  return data[0] as User;
}

export async function bindTelegramChat(
  userId: string,
  chatId: number,
  username?: string
): Promise<boolean> {
  const update: Record<string, unknown> = { telegram_chat_id: chatId };
  if (username) {
    const clean = username.replace(/^@/, "").trim();
    if (clean.length > 0) {
      update.telegram_id = `@${clean}`;
    }
  }
  const { error } = await supabase
    .from("users")
    .update(update)
    .eq("id", userId);

  if (error) {
    console.error("Error binding telegram chat:", error);
    return false;
  }
  return true;
}

function generateRandomPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export interface BulkCreateUserResult {
  created: User[];
  errors: { input: CreateUserInput; reason: string }[];
}

export async function bulkCreateUsers(
  inputs: CreateUserInput[],
  autoGeneratePins: boolean = true
): Promise<BulkCreateUserResult> {
  const result: BulkCreateUserResult = { created: [], errors: [] };

  if (inputs.length === 0) return result;

  // Pre-process: auto-generate PINs where missing or invalid
  const prepared = inputs.map((input) => {
    const needsPin = !input.pin || input.pin.length !== 4 || !/^\d{4}$/.test(input.pin);
    if (needsPin && autoGeneratePins) {
      return { ...input, pin: generateRandomPin() };
    }
    return input;
  });

  // Reject any remaining invalid PINs (auto-gen disabled but PIN missing)
  for (const p of prepared) {
    if (!p.pin || p.pin.length !== 4 || !/^\d{4}$/.test(p.pin)) {
      result.errors.push({
        input: p,
        reason: "PIN must be exactly 4 digits",
      });
    }
  }

  const valid = prepared.filter(
    (p) => p.pin && p.pin.length === 4 && /^\d{4}$/.test(p.pin)
  );
  if (valid.length === 0) {
    return result;
  }

  const rows = valid.map((p) => ({
    name: p.name,
    role: p.role,
    phone: p.phone,
    pin: p.pin,
    telegram_id: p.telegram_id || null,
    is_active: true,
  }));

  const { data, error } = await supabase.from("users").insert(rows).select();

  if (error) {
    console.error("Bulk create error:", error);
    for (const p of valid) {
      result.errors.push({ input: p, reason: error.message });
    }
    return result;
  }

  if (data) {
    result.created = data as User[];
  }
  return result;
}

// ===== TASK HISTORY =====

export interface TaskHistoryEntry {
  id: string;
  task_id: string;
  action: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  performed_by: string;
  created_at: string;
  performer?: User;
}

export async function fetchTaskHistory(taskId: string): Promise<TaskHistoryEntry[]> {
  const { data, error } = await supabase
    .from("task_history")
    .select(`
      *,
      performer:users!task_history_performed_by_fkey(id, name, pin, role, phone, telegram_id, is_active, created_at)
    `)
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching task history:", error);
    return [];
  }
  return (data || []) as TaskHistoryEntry[];
}

// ===== NOTIFICATIONS =====

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
  return (data || []) as Notification[];
}

export async function markNotificationRead(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id);

  if (error) {
    console.error("Error marking notification read:", error);
    return false;
  }
  return true;
}

export async function markAllNotificationsRead(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) {
    console.error("Error marking all notifications read:", error);
    return false;
  }
  return true;
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: Notification["type"],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>
): Promise<boolean> {
  const row: Record<string, unknown> = { user_id: userId, title, message, type };
  if (metadata) row.metadata = metadata;

  const { error } = await supabase
    .from("notifications")
    .insert(row);

  if (error) {
    console.error("Error creating notification:", error);
    return false;
  }
  return true;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: "task_assigned" | "status_update" | "overdue" | "completed";
  title: string;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any> | null;
  read: boolean;
  telegram_sent_at: string | null;
  created_at: string;
}

export function subscribeToNotifications(
  userId: string,
  onInsert: (n: NotificationRow) => void
) {
  const channel = supabase
    .channel(`notifications-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onInsert(payload.new as NotificationRow)
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// ===== TELEGRAM INTEGRATION =====

export async function findUserByTelegramUsername(
  username: string
): Promise<User | null> {
  const cleanUsername = username.replace("@", "").trim();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .ilike("telegram_id", `@${cleanUsername}`)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Error finding user by telegram:", error);
    return null;
  }
  return data as User | null;
}

export async function findUserByTelegramId(
  telegramUserId: number
): Promise<User | null> {
  // Telegram user IDs are numeric; we store username (@handle) in telegram_id.
  // This is a placeholder for future support if we switch to numeric IDs.
  return null;
}

export async function findUserByTelegramChatId(
  chatId: number
): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_chat_id", chatId)
    .eq("is_active", true)
    .limit(1);

  if (error) {
    console.error("Error finding user by telegram_chat_id:", error);
    return null;
  }
  if (!data || data.length === 0) return null;
  return data[0] as User;
}

// ===== ANALYTICS =====

export interface CompletionTrendPoint {
  date: string;
  count: number;
}

export async function fetchCompletionTrend(
  days: number = 7
): Promise<CompletionTrendPoint[]> {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - (days - 1));

  const { data, error } = await supabase
    .from("task_history")
    .select("created_at")
    .eq("action", "status_changed")
    .contains("new_value", { status: "done" })
    .gte("created_at", startDate.toISOString());

  if (error) {
    console.error("Error fetching completion trend:", error);
    return [];
  }

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  for (const row of data || []) {
    const key = new Date(row.created_at).toISOString().slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }
  }

  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}

// ===== REASSIGNMENT =====

export async function reassignTask(
  taskId: string,
  newAssigneeId: string,
  performedBy: string
): Promise<boolean> {
  const { error } = await supabase
    .from("tasks")
    .update({
      assigned_to: newAssigneeId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) {
    console.error("Error reassigning task:", error);
    return false;
  }
  return true;
}

// ===== TRAVEL HISTORY / STAY TRACKING =====

export const FOC_PALETTE: string[] = [
  "#FF6B6B", // coral red
  "#4ECDC4", // teal
  "#45B7D1", // sky blue
  "#FFA07A", // light salmon
  "#98D8C8", // mint
  "#F7DC6F", // soft yellow
  "#BB8FCE", // lavender
  "#85C1E2", // light blue
];

export function getFocColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return FOC_PALETTE[Math.abs(hash) % FOC_PALETTE.length];
}

const STAY_THRESHOLD_METERS = 100;
const MIN_STAY_DURATION_MINUTES = 10;
const DAY_RESET_HOUR_JAKARTA = 6;

export function getSessionDate(date: Date = new Date()): string {
  const jakartaStr = date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
  const jakarta = new Date(jakartaStr);
  if (jakarta.getHours() < DAY_RESET_HOUR_JAKARTA) {
    jakarta.setDate(jakarta.getDate() - 1);
  }
  const y = jakarta.getFullYear();
  const m = String(jakarta.getMonth() + 1).padStart(2, "0");
  const d = String(jakarta.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface LocationVisit {
  id: string;
  user_id: string;
  session_date: string;
  visit_number: number;
  lat: number;
  lng: number;
  arrived_at: string;
  departed_at: string | null;
  duration_minutes: number | null;
  source: string | null;
}

export type RecordResult =
  | { ok: true; newVisit?: LocationVisit; stayedAt: { lat: number; lng: number } }
  | { ok: false; error: string };

export async function recordLocationUpdate(
  userId: string,
  lat: number,
  lng: number,
  source: "telegram_live" | "telegram_request" | "web_app",
  accuracy?: number
): Promise<RecordResult> {
  const now = new Date().toISOString();
  const sessionDate = getSessionDate();

  const { data: existing, error: existingError } = await supabase
    .from("locations")
    .select("id, lat, lng, arrived_at, session_date, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) {
    return { ok: false, error: existingError.message };
  }

  if (!existing) {
    const { error } = await supabase.from("locations").insert({
      user_id: userId,
      lat,
      lng,
      accuracy: accuracy ?? null,
      updated_at: now,
      arrived_at: now,
      session_date: sessionDate,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, stayedAt: { lat, lng } };
  }

  // Compare to current stay's ARRIVAL point (not last position)
  const arrivalLat = Number(existing.lat);
  const arrivalLng = Number(existing.lng);
  const distance = haversineDistance(arrivalLat, arrivalLng, lat, lng);

  if (distance < STAY_THRESHOLD_METERS) {
    // Same stay, just refresh the timestamp
    const { error } = await supabase
      .from("locations")
      .update({ lat, lng, accuracy: accuracy ?? null, updated_at: now })
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, stayedAt: { lat: arrivalLat, lng: arrivalLng } };
  }

  // FOC moved >= 100m from the arrival. Check if previous stay qualifies.
  const arrivedAt = existing.arrived_at
    ? new Date(existing.arrived_at)
    : new Date(existing.updated_at);
  const stayMinutes = (Date.now() - arrivedAt.getTime()) / 60000;

  if (stayMinutes >= MIN_STAY_DURATION_MINUTES) {
    // Save the previous stay as a visit
    const { data: maxRow } = await supabase
      .from("location_visits")
      .select("visit_number")
      .eq("user_id", userId)
      .eq("session_date", sessionDate)
      .order("visit_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextNumber = (maxRow?.visit_number ?? 0) + 1;

    const { data: visit, error: visitError } = await supabase
      .from("location_visits")
      .insert({
        user_id: userId,
        session_date: sessionDate,
        visit_number: nextNumber,
        lat: arrivalLat,
        lng: arrivalLng,
        arrived_at: arrivedAt.toISOString(),
        departed_at: now,
        duration_minutes: Math.round(stayMinutes),
        source,
      })
      .select()
      .single();

    if (visitError) {
      console.error("Error inserting location_visit:", visitError);
    }

    // Update the location row to reflect the NEW stay
    const { error } = await supabase
      .from("locations")
      .update({
        lat,
        lng,
        accuracy: accuracy ?? null,
        updated_at: now,
        arrived_at: now,
        session_date: sessionDate,
      })
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };

    return {
      ok: true,
      newVisit: visit as LocationVisit | undefined,
      stayedAt: { lat, lng },
    };
  }

  // Previous stay too short — discard, start new stay
  const { error } = await supabase
    .from("locations")
    .update({
      lat,
      lng,
      accuracy: accuracy ?? null,
      updated_at: now,
      arrived_at: now,
      session_date: sessionDate,
    })
    .eq("id", existing.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, stayedAt: { lat, lng } };
}

export async function fetchVisits(
  sessionDate: string,
  userIds?: string[]
): Promise<LocationVisit[]> {
  let query = supabase
    .from("location_visits")
    .select("*")
    .eq("session_date", sessionDate)
    .order("visit_number", { ascending: true });

  if (userIds && userIds.length > 0) {
    query = query.in("user_id", userIds);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching visits:", error);
    return [];
  }
  return (data || []) as LocationVisit[];
}
