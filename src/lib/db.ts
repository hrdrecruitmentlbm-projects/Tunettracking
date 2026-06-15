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

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .order("created_at", { ascending: false });

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
    .select("title, assigned_to, created_by")
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

  // Create notifications
  if (taskData) {
    const statusLabels: Record<string, string> = {
      todo: "To Do",
      assigned: "Assigned",
      in_progress: "In Progress",
      review: "Review",
      done: "Done",
    };

    // Notify assignee (if status changed by someone else)
    if (taskData.assigned_to && taskData.assigned_to !== performedBy) {
      await createNotification(
        taskData.assigned_to,
        "Task Status Updated",
        `"${taskData.title}" moved to ${statusLabels[newStatus] || newStatus}`,
        newStatus === "done" ? "completed" : "status_update"
      );
    }

    // Notify creator (if status changed by someone else and creator != assignee)
    if (taskData.created_by && taskData.created_by !== performedBy && taskData.created_by !== taskData.assigned_to) {
      await createNotification(
        taskData.created_by,
        "Task Status Updated",
        `"${taskData.title}" moved to ${statusLabels[newStatus] || newStatus}`,
        "status_update"
      );
    }
  }

  return true;
}

export async function upsertLocation(
  userId: string,
  lat: number,
  lng: number,
  accuracy?: number
): Promise<boolean> {
  const { data: existing } = await supabase
    .from("locations")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("locations")
      .update({ lat, lng, accuracy, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) {
      console.error("Error updating location:", error);
      return false;
    }
  } else {
    const { error } = await supabase
      .from("locations")
      .insert({ user_id: userId, lat, lng, accuracy });
    if (error) {
      console.error("Error inserting location:", error);
      return false;
    }
  }
  return true;
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

  if (input.assigned_to && task) {
    await createNotification(
      input.assigned_to,
      "New Task Assigned",
      `You have been assigned to "${input.title}"`,
      "task_assigned"
    );
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
  type: Notification["type"]
): Promise<boolean> {
  const { error } = await supabase
    .from("notifications")
    .insert({ user_id: userId, title, message, type });

  if (error) {
    console.error("Error creating notification:", error);
    return false;
  }
  return true;
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
