import { supabase } from "./supabase";
import { User, Task, Location, Tag, Notification, TaskStatus, Prospect, TowerSite, VisitLog } from "@/types";

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
    .select("id, name, role, phone, pin, telegram_id, is_active, created_at")
    .order("name");

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }
  return (data || []) as User[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeTaskRow(row: any): Task {
  return {
    ...row,
    priority: row.priority?.name?.toLowerCase() ?? "medium",
    assignee: row.assignee || undefined,
    creator: row.creator || undefined,
    tags: Array.isArray(row.tags)
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        row.tags.map((t: any) => t.tag)
      : [],
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
  };
}

const TASK_SELECT = `
  *,
  priority:priorities(name),
  assignee:users!tasks_assigned_to_fkey(id, name, role, phone, telegram_id, is_active, created_at),
  creator:users!tasks_created_by_fkey(id, name, role, phone, telegram_id, is_active, created_at),
  tags:task_tags(tag:tags(id, name, color)),
  attachments:task_attachments(id, task_id, uploaded_by, file_path, file_name, file_size, mime_type, upload_phase, caption, created_at)
`;

export interface FetchTasksOptions {
  includeDeleted?: boolean;
  status?: TaskStatus;
  assignedTo?: string;
  limit?: number;
  offset?: number;
}

export async function fetchTasks(options: FetchTasksOptions = {}): Promise<Task[]> {
  let query = supabase
    .from("tasks")
    .select(TASK_SELECT)
    .order("created_at", { ascending: false });

  if (!options.includeDeleted) {
    query = query.is("deleted_at", null);
  }

  if (options.status) {
    query = query.eq("status", options.status);
  }

  if (options.assignedTo) {
    query = query.eq("assigned_to", options.assignedTo);
  }

  // Default limit to prevent unbounded fetches
  const limit = options.limit ?? 100;
  query = query.limit(limit);

  if (options.offset) {
    query = query.range(options.offset, options.offset + limit - 1);
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
      user:users(id, name, role, phone, telegram_id, is_active, created_at)
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
  accuracy?: number,
  source: "telegram_live" | "telegram_request" | "web_app" = "web_app"
): Promise<{ ok: boolean; error?: string }> {
  const result = await recordLocationUpdate(userId, lat, lng, source, accuracy);
  if (result.ok) {
    return { ok: true };
  }
  return { ok: false, error: result.error };
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

export async function createTag(
  name: string,
  color: string
): Promise<Tag | null> {
  const { data, error } = await supabase
    .from("tags")
    .insert({ name, color })
    .select()
    .single();

  if (error) {
    console.error("Error creating tag:", error);
    return null;
  }
  return data as Tag;
}

export async function updateTag(
  id: string,
  name: string,
  color: string
): Promise<Tag | null> {
  const { data, error } = await supabase
    .from("tags")
    .update({ name, color })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating tag:", error);
    return null;
  }
  return data as Tag;
}

export async function deleteTag(id: string): Promise<boolean> {
  const { error } = await supabase.from("tags").delete().eq("id", id);

  if (error) {
    console.error("Error deleting tag:", error);
    return false;
  }
  return true;
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

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: string;
  assigned_to?: string | null;
  location_name?: string;
  location_lat?: number;
  location_lng?: number;
  deadline?: string | null;
  tagIds?: string[];
}

export interface UpdateTaskResult {
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

export async function updateTask(
  taskId: string,
  input: UpdateTaskInput,
  currentUser: User
): Promise<UpdateTaskResult> {
  if (!currentUser?.id) {
    return { task: null, error: "Session is invalid. Please log in again." };
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.priority !== undefined) {
    const { data: priorityRow } = await supabase
      .from("priorities")
      .select("id")
      .eq("name", input.priority.charAt(0).toUpperCase() + input.priority.slice(1))
      .limit(1)
      .maybeSingle();
    if (priorityRow?.id) updates.priority_id = priorityRow.id;
  }
  if (input.assigned_to !== undefined) updates.assigned_to = input.assigned_to;
  if (input.location_name !== undefined) updates.location_name = input.location_name;
  if (input.location_lat !== undefined) updates.location_lat = input.location_lat;
  if (input.location_lng !== undefined) updates.location_lng = input.location_lng;
  if (input.deadline !== undefined) updates.deadline = input.deadline;

  const { error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId);

  if (error) {
    console.error("Error updating task:", error);
    return { task: null, error: error.message };
  }

  if (input.tagIds !== undefined) {
    await supabase.from("task_tags").delete().eq("task_id", taskId);
    if (input.tagIds.length > 0) {
      const tagInserts = input.tagIds.map((tagId) => ({
        task_id: taskId,
        tag_id: tagId,
      }));
      const { error: tagsError } = await supabase
        .from("task_tags")
        .insert(tagInserts);
      if (tagsError) {
        console.error("Error updating task tags:", tagsError);
      }
    }
  }

  const { data: fullTask, error: refetchError } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("id", taskId)
    .single();

  if (refetchError) {
    console.error("Error refetching updated task:", refetchError);
    return { task: null, error: refetchError.message };
  }

  return { task: normalizeTaskRow(fullTask), error: null };
}

// ===== USER CRUD =====

export interface CreateUserInput {
  name: string;
  role: "admin" | "noc" | "foc" | "marketing";
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
  // Soft delete: deactivate the user instead of hard deleting.
  // This preserves referential integrity for tasks, locations, and history.
  const { error } = await supabase
    .from("users")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    console.error("Error deleting (deactivating) user:", error);
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
  return (data || []).map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = row as any;
    return {
      ...r,
      task_id: r.task_id ?? r.metadata?.task_id,
    } as Notification;
  });
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

const DAY_RESET_HOUR_JAKARTA = 6;
const STAY_THRESHOLD_METERS = 100;
const MIN_STAY_DURATION_MINUTES = 10;

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

export function getSessionDate(date: Date = new Date()): string {
  // Compute Jakarta wall-clock time using pure UTC arithmetic.
  // Avoids `toLocaleString` + `new Date()` round-trips, which re-interpret
  // the formatted string in the browser's local timezone and can shift
  // the date by 1 day near the 06:00 WIB boundary.
  const jakartaOffsetMs = 7 * 60 * 60 * 1000; // Asia/Jakarta = UTC+7 (no DST)
  const jakartaMs = date.getTime() + jakartaOffsetMs;
  const j = new Date(jakartaMs);

  const year = j.getUTCFullYear();
  const month = j.getUTCMonth();
  const day = j.getUTCDate();
  const hour = j.getUTCHours();

  // If Jakarta hour is before 06:00, the operational day still belongs to
  // the previous calendar date (day resets at 06:00 WIB).
  let sessionYear = year;
  let sessionMonth = month;
  let sessionDay = day;
  if (hour < DAY_RESET_HOUR_JAKARTA) {
    const prev = new Date(Date.UTC(year, month, day - 1));
    sessionYear = prev.getUTCFullYear();
    sessionMonth = prev.getUTCMonth();
    sessionDay = prev.getUTCDate();
  }

  const m = String(sessionMonth + 1).padStart(2, "0");
  const d = String(sessionDay).padStart(2, "0");
  return `${sessionYear}-${m}-${d}`;
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

export interface LocationPing {
  id: string;
  user_id: string;
  session_date: string;
  ping_number: number;
  lat: number;
  lng: number;
  accuracy: number | null;
  source: string | null;
  created_at: string;
}

export async function recordPing(
  userId: string,
  lat: number,
  lng: number,
  source: "telegram_live" | "telegram_request" | "web_app",
  sessionDate: string,
  accuracy?: number
): Promise<{ ok: boolean; error?: string }> {
  // Use atomic RPC function to avoid race conditions
  // ON CONFLICT DO NOTHING prevents duplicates when called alongside upsertLocation()
  const { error } = await supabase.rpc("record_ping", {
    p_user_id: userId,
    p_session_date: sessionDate,
    p_lat: lat,
    p_lng: lng,
    p_source: source,
    p_accuracy: accuracy ?? null,
  });

  if (error) {
    console.error("Error inserting location_ping:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
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
  // Use atomic RPC function (consolidates 3-5 sequential queries into 1)
  // Fixes race conditions in read-modify-write patterns
  const { data, error } = await supabase.rpc("record_location_update", {
    p_user_id: userId,
    p_lat: lat,
    p_lng: lng,
    p_source: source,
    p_accuracy: accuracy ?? null,
  });

  if (error) {
    console.error("[recordLocationUpdate] RPC failed, falling back to direct queries:", error);
    await supabase.from("error_log").insert({
      source: "recordLocationUpdate",
      step: "RPC call",
      user_id: userId,
      error: error.message,
      payload: { source, lat, lng },
    });
    return await recordLocationUpdateDirect(userId, lat, lng, source, accuracy);
  }

  if (!data || !data.ok) {
    console.error("[recordLocationUpdate] RPC returned ok=false, falling back:", data);
    await supabase.from("error_log").insert({
      source: "recordLocationUpdate",
      step: "RPC returned ok=false",
      user_id: userId,
      error: JSON.stringify(data),
      payload: { source, lat, lng },
    });
    return await recordLocationUpdateDirect(userId, lat, lng, source, accuracy);
  }

  return {
    ok: true,
    newVisit: data.newVisit ?? undefined,
    stayedAt: data.stayedAt,
  };
}

async function recordLocationUpdateDirect(
  userId: string,
  lat: number,
  lng: number,
  source: "telegram_live" | "telegram_request" | "web_app",
  accuracy?: number
): Promise<RecordResult> {
  const sessionDate = getSessionDate();
  const now = new Date().toISOString();

  // 1. Check if a location row already exists for this user.
  //    We can't use upsert + onConflict:"user_id" because the locations
  //    table has no UNIQUE constraint on user_id (only a non-unique index),
  //    and Supabase JS requires a unique constraint to resolve conflicts.
  const { data: existing, error: selectError } = await supabase
    .from("locations")
    .select("id, lat, lng, arrived_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (selectError) {
    console.error("[recordLocationUpdateDirect] locations select failed:", selectError);
    return { ok: false, error: selectError.message };
  }

  let newVisit: LocationVisit | undefined;
  let newStayStarted = false;

  if (!existing) {
    // First-ever location for this user — INSERT
    const { error: insertError } = await supabase.from("locations").insert({
      user_id: userId,
      lat,
      lng,
      accuracy: accuracy ?? null,
      updated_at: now,
      arrived_at: now,
      session_date: sessionDate,
    });
    if (insertError) {
      console.error("[recordLocationUpdateDirect] locations insert failed:", insertError);
      return { ok: false, error: insertError.message };
    }
    newStayStarted = true;
  } else {
    // Existing row — check distance from arrival point
    const arrivalLat = Number(existing.lat);
    const arrivalLng = Number(existing.lng);
    const distance = haversineDistance(arrivalLat, arrivalLng, lat, lng);

    if (distance >= STAY_THRESHOLD_METERS) {
      // Moved >= threshold — check if previous stay qualifies as a visit
      const arrivedAt: Date = existing.arrived_at
        ? new Date(String(existing.arrived_at))
        : new Date();
      const stayMinutes = (Date.now() - arrivedAt.getTime()) / 60000;

      if (stayMinutes >= MIN_STAY_DURATION_MINUTES) {
        // Save previous stay as a visit
        // Derive visit session_date from arrived_at (not now), so cross-midnight
        // stays are attributed to the day the user actually arrived.
        const visitSessionDate = getSessionDate(arrivedAt);

        const { data: maxVisit } = await supabase
          .from("location_visits")
          .select("visit_number")
          .eq("user_id", userId)
          .eq("session_date", visitSessionDate)
          .order("visit_number", { ascending: false })
          .limit(1)
          .maybeSingle();

        const nextVisitNumber = (maxVisit?.visit_number ?? 0) + 1;

        const { data: visit, error: visitError } = await supabase
          .from("location_visits")
          .insert({
            user_id: userId,
            session_date: visitSessionDate,
            visit_number: nextVisitNumber,
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
          console.error("[recordLocationUpdateDirect] location_visits insert failed:", visitError);
          await supabase.from("error_log").insert({
            source: "recordLocationUpdateDirect",
            step: "location_visits insert",
            user_id: userId,
            error: visitError.message,
            payload: { sessionDate, visitSessionDate, nextVisitNumber },
          });
        } else {
          newVisit = visit as LocationVisit;
        }
      }

      // Start new stay
      const { error: updateError } = await supabase
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
      if (updateError) {
        console.error("[recordLocationUpdateDirect] locations update failed:", updateError);
        return { ok: false, error: updateError.message };
      }
      newStayStarted = true;
    } else {
      // Same stay — just refresh timestamp, keep arrived_at unchanged
      const { error: updateError } = await supabase
        .from("locations")
        .update({
          lat,
          lng,
          accuracy: accuracy ?? null,
          updated_at: now,
        })
        .eq("id", existing.id);
      if (updateError) {
        console.error("[recordLocationUpdateDirect] locations update failed:", updateError);
        return { ok: false, error: updateError.message };
      }
    }
  }

  // 2. Insert ping (with next ping_number for this session)
  const { data: maxPing } = await supabase
    .from("location_pings")
    .select("ping_number")
    .eq("user_id", userId)
    .eq("session_date", sessionDate)
    .order("ping_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPingNumber = (maxPing?.ping_number ?? 0) + 1;

  const { error: pingError } = await supabase
    .from("location_pings")
    .insert({
      user_id: userId,
      session_date: sessionDate,
      ping_number: nextPingNumber,
      lat,
      lng,
      accuracy: accuracy ?? null,
      source,
    });

  if (pingError) {
    console.error("[recordLocationUpdateDirect] location_pings insert failed:", pingError);
    await supabase.from("error_log").insert({
      source: "recordLocationUpdateDirect",
      step: "location_pings insert",
      user_id: userId,
      error: pingError.message,
      payload: { sessionDate, nextPingNumber, source },
    });
    // Don't fail — the location was saved
  }

  return {
    ok: true,
    newVisit,
    stayedAt: newStayStarted ? { lat, lng } : { lat: existing?.lat ?? lat, lng: existing?.lng ?? lng },
  };
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
    console.error("[fetchVisits] error:", error, { sessionDate, userIds });
    return [];
  }
  const rows = (data || []) as LocationVisit[];
  console.log(`[fetchVisits] date=${sessionDate} → ${rows.length} rows`, {
    first: rows[0],
  });
  return rows;
}

export async function fetchPings(
  sessionDate: string,
  userIds?: string[]
): Promise<LocationPing[]> {
  let query = supabase
    .from("location_pings")
    .select("*")
    .eq("session_date", sessionDate)
    .order("ping_number", { ascending: true });

  if (userIds && userIds.length > 0) {
    query = query.in("user_id", userIds);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[fetchPings] error:", error, { sessionDate, userIds });
    return [];
  }
  const rows = (data || []) as LocationPing[];
  console.log(`[fetchPings] date=${sessionDate} → ${rows.length} rows`, {
    first: rows[0],
  });
  return rows;
}

export interface ActivityHeatmapCell {
  /** 0=Mon, 6=Sun (Indonesian week) */
  day: number;
  /** 0..23 hour of day in Asia/Jakarta */
  hour: number;
  count: number;
}

/**
 * Fetches pings from the last `daysBack` days and groups them by
 * day-of-week (0=Mon) and hour-of-day (0-23) in Asia/Jakarta timezone.
 * Returns up to 168 cells.
 */
export async function fetchActivityHeatmap(
  daysBack: number = 7
): Promise<ActivityHeatmapCell[]> {
  const start = new Date();
  start.setDate(start.getDate() - daysBack);

  const { data, error } = await supabase
    .from("location_pings")
    .select("created_at")
    .gte("created_at", start.toISOString())
    .limit(5000);

  if (error) {
    console.error("[fetchActivityHeatmap] error:", error);
    return [];
  }

  const buckets: ActivityHeatmapCell[] = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      buckets.push({ day: d, hour: h, count: 0 });
    }
  }

  for (const row of data ?? []) {
    const created = new Date((row as { created_at: string }).created_at);
    if (Number.isNaN(created.getTime())) continue;
    // Convert to Jakarta time, then read hour
    const jakartaStr = created.toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
    const j = new Date(jakartaStr);
    const hour = j.getHours();
    // Postgres DOW: 0=Sun, 6=Sat. We want 0=Mon, 6=Sun.
    const jsDay = j.getDay(); // 0=Sun, 6=Sat
    const day = (jsDay + 6) % 7; // 0=Mon, 6=Sun
    const cell = buckets.find((b) => b.day === day && b.hour === hour);
    if (cell) cell.count += 1;
  }

  return buckets;
}

// =====================================================
// MARKETING: Prospects, Tower Sites, Visit Logs
// =====================================================

export async function fetchProspects(includeDeleted: boolean = false): Promise<Prospect[]> {
  let query = supabase
    .from("prospects")
    .select(`
      *,
      assignee:users!prospects_assigned_to_fkey(id, name, role, phone, is_active, created_at),
      deleter:users!prospects_deleted_by_fkey(id, name)
    `)
    .order("created_at", { ascending: false });

  if (!includeDeleted) {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching prospects:", error);
    return [];
  }
  return (data || []) as Prospect[];
}

export async function createProspect(input: {
  name: string;
  phone: string;
  address: string;
  location_lat: number;
  location_lng: number;
  status: string;
  notes: string;
  assigned_to: string;
  area: string;
}): Promise<Prospect | null> {
  const { data, error } = await supabase
    .from("prospects")
    .insert({
      name: input.name,
      phone: input.phone,
      address: input.address,
      location_lat: input.location_lat,
      location_lng: input.location_lng,
      status: input.status,
      notes: input.notes,
      assigned_to: input.assigned_to,
      area: input.area,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating prospect:", error);
    return null;
  }
  return data as Prospect;
}

export async function updateProspect(
  id: string,
  input: Partial<{
    name: string;
    phone: string;
    address: string;
    location_lat: number;
    location_lng: number;
    status: string;
    notes: string;
    assigned_to: string;
    area: string;
  }>
): Promise<Prospect | null> {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) updates[key] = value;
  }

  const { data, error } = await supabase
    .from("prospects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating prospect:", error);
    return null;
  }
  return data as Prospect;
}

export async function softDeleteProspect(id: string, deletedBy: string): Promise<boolean> {
  const { error } = await supabase
    .from("prospects")
    .update({ deleted_at: new Date().toISOString(), deleted_by: deletedBy })
    .eq("id", id);

  if (error) {
    console.error("Error soft-deleting prospect:", error);
    return false;
  }
  return true;
}

export async function restoreProspect(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("prospects")
    .update({ deleted_at: null, deleted_by: null })
    .eq("id", id);

  if (error) {
    console.error("Error restoring prospect:", error);
    return false;
  }
  return true;
}

export async function fetchTowerSites(includeDeleted: boolean = false): Promise<TowerSite[]> {
  let query = supabase
    .from("tower_sites")
    .select(`
      *,
      assignee:users!tower_sites_assigned_to_fkey(id, name, role, phone, is_active, created_at),
      deleter:users!tower_sites_deleted_by_fkey(id, name)
    `)
    .order("created_at", { ascending: false });

  if (!includeDeleted) {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching tower sites:", error);
    return [];
  }
  return (data || []) as TowerSite[];
}

export async function createTowerSite(input: {
  name: string;
  site_type: string;
  contact_person: string;
  contact_phone: string;
  location_lat: number;
  location_lng: number;
  status: string;
  notes: string;
  assigned_to: string;
}): Promise<TowerSite | null> {
  const { data, error } = await supabase
    .from("tower_sites")
    .insert({
      name: input.name,
      site_type: input.site_type,
      contact_person: input.contact_person,
      contact_phone: input.contact_phone,
      location_lat: input.location_lat,
      location_lng: input.location_lng,
      status: input.status,
      notes: input.notes,
      assigned_to: input.assigned_to,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating tower site:", error);
    return null;
  }
  return data as TowerSite;
}

export async function updateTowerSite(
  id: string,
  input: Partial<{
    name: string;
    site_type: string;
    contact_person: string;
    contact_phone: string;
    location_lat: number;
    location_lng: number;
    status: string;
    notes: string;
    assigned_to: string;
  }>
): Promise<TowerSite | null> {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) updates[key] = value;
  }

  const { data, error } = await supabase
    .from("tower_sites")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating tower site:", error);
    return null;
  }
  return data as TowerSite;
}

export async function softDeleteTowerSite(id: string, deletedBy: string): Promise<boolean> {
  const { error } = await supabase
    .from("tower_sites")
    .update({ deleted_at: new Date().toISOString(), deleted_by: deletedBy })
    .eq("id", id);

  if (error) {
    console.error("Error soft-deleting tower site:", error);
    return false;
  }
  return true;
}

export async function restoreTowerSite(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("tower_sites")
    .update({ deleted_at: null, deleted_by: null })
    .eq("id", id);

  if (error) {
    console.error("Error restoring tower site:", error);
    return false;
  }
  return true;
}

export async function fetchVisitLogs(filters?: {
  type?: "prospek" | "tower";
  visited_by?: string;
  limit?: number;
}): Promise<VisitLog[]> {
  let query = supabase
    .from("visit_logs")
    .select(`
      *,
      visitor:users!visit_logs_visited_by_fkey(id, name, role, phone, is_active, created_at),
      prospect:prospects(id, name, phone, address, status, area),
      tower:tower_sites(id, name, site_type, contact_person, status)
    `)
    .order("created_at", { ascending: false });

  if (filters?.type) {
    query = query.eq("type", filters.type);
  }
  if (filters?.visited_by) {
    query = query.eq("visited_by", filters.visited_by);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching visit logs:", error);
    return [];
  }
  return (data || []) as VisitLog[];
}

export async function createVisitLog(input: {
  type: "prospek" | "tower";
  prospect_id?: string;
  tower_id?: string;
  visited_by: string;
  status_snapshot: string;
  notes: string;
  location_lat: number;
  location_lng: number;
}): Promise<VisitLog | null> {
  const { data, error } = await supabase
    .from("visit_logs")
    .insert({
      type: input.type,
      prospect_id: input.prospect_id || null,
      tower_id: input.tower_id || null,
      visited_by: input.visited_by,
      status_snapshot: input.status_snapshot,
      notes: input.notes,
      location_lat: input.location_lat,
      location_lng: input.location_lng,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating visit log:", error);
    return null;
  }
  return data as VisitLog;
}

// =====================================================
// MARKETING STATS
// =====================================================

export interface MarketingStats {
  totalProspects: number;
  activeProspects: number;
  accProspects: number;
  totalTowerSites: number;
  accTowerSites: number;
  pendingTowerSites: number;
  visitsToday: number;
  totalVisits: number;
}

export async function fetchMarketingStats(): Promise<MarketingStats> {
  const [prospects, towerSites, visits] = await Promise.all([
    fetchProspects(),
    fetchTowerSites(),
    fetchVisitLogs({ limit: 1000 }),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  return {
    totalProspects: prospects.length,
    activeProspects: prospects.filter((p) => p.status !== "acc" && p.status !== "tidak").length,
    accProspects: prospects.filter((p) => p.status === "acc").length,
    totalTowerSites: towerSites.length,
    accTowerSites: towerSites.filter((t) => t.status === "acc").length,
    pendingTowerSites: towerSites.filter((t) => t.status === "pending").length,
    visitsToday: visits.filter((v) => v.created_at.startsWith(today)).length,
    totalVisits: visits.length,
  };
}

// =====================================================
// MARKETING COLORS
// =====================================================

export const MARKETING_PALETTE: string[] = [
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#F97316", // orange
  "#06B6D4", // cyan
  "#84CC16", // lime
  "#EAB308", // yellow
  "#14B8A6", // teal
  "#F43F5E", // rose
];

export function getMarketingColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return MARKETING_PALETTE[Math.abs(hash) % MARKETING_PALETTE.length];
}

// =====================================================
// User Sessions (heartbeat-based online tracking)
// =====================================================

// Must match ACTIVE_THRESHOLD_MS in /api/heartbeat/route.ts (1 min)
const HEARTBEAT_ACTIVE_THRESHOLD_MS = 60 * 1000;

export async function recordHeartbeat(userId: string): Promise<void> {
  if (!userId) return;
  const { error } = await supabase
    .from("user_sessions")
    .upsert({ user_id: userId, last_seen: new Date().toISOString() });

  if (error) {
    console.error("[recordHeartbeat] error:", error);
  }
}

export async function fetchActiveCount(): Promise<number> {
  const thresholdIso = new Date(
    Date.now() - HEARTBEAT_ACTIVE_THRESHOLD_MS
  ).toISOString();

  const { count, error } = await supabase
    .from("user_sessions")
    .select("user_id", { count: "exact", head: true })
    .gt("last_seen", thresholdIso);

  if (error) {
    console.error("[fetchActiveCount] error:", error);
    return 0;
  }
  return count ?? 0;
}

