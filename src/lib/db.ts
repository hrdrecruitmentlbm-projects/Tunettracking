import { supabase } from "./supabase";
import { User, Task, Location, Tag } from "@/types";

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

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select(`
      *,
      priority:priorities(name),
      assignee:users!tasks_assigned_to_fkey(id, name, pin, role, phone, telegram_id, is_active, created_at),
      creator:users!tasks_created_by_fkey(id, name, pin, role, phone, telegram_id, is_active, created_at),
      tags:task_tags(tag:tags(id, name, color))
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((row: any) => ({
    ...row,
    priority: row.priority?.name?.toLowerCase() ?? "medium",
    assignee: row.assignee || undefined,
    creator: row.creator || undefined,
    tags: Array.isArray(row.tags)
      ? row.tags.map((t: any) => t.tag)
      : [],
  })) as Task[];
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
  const { error } = await supabase.rpc("update_task_status", {
    p_task_id: taskId,
    p_new_status: newStatus,
    p_performed_by: performedBy,
  });

  if (error) {
    console.error("Error updating task status:", error);
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

export async function createTask(
  input: CreateTaskInput,
  createdBy: string
): Promise<Task | null> {
  // Look up priority_id from priorities table
  const { data: priorityRow } = await supabase
    .from("priorities")
    .select("id")
    .eq("name", input.priority.charAt(0).toUpperCase() + input.priority.slice(1))
    .limit(1)
    .maybeSingle();

  const priorityId = priorityRow?.id ?? null;

  // Insert task
  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      title: input.title,
      description: input.description,
      status: input.assigned_to ? "assigned" : "todo",
      priority_id: priorityId,
      created_by: createdBy,
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
    return null;
  }

  // Insert task tags
  if (input.tagIds && input.tagIds.length > 0 && task) {
    const tagInserts = input.tagIds.map((tagId) => ({
      task_id: task.id,
      tag_id: tagId,
    }));
    await supabase.from("task_tags").insert(tagInserts);
  }

  return task as Task;
}
