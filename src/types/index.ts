export type UserRole = "admin" | "noc" | "foc";

export type TaskStatus = "todo" | "assigned" | "in_progress" | "review" | "done";

export type TaskPriority = "critical" | "high" | "medium" | "low";

export interface User {
  id: string;
  name: string;
  pin: string;
  role: UserRole;
  phone?: string;
  telegram_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  created_by: string;
  assigned_to?: string;
  location_name: string;
  location_lat: number;
  location_lng: number;
  deadline?: string;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
  assignee?: User;
  creator?: User;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Location {
  id: string;
  user_id: string;
  lat: number;
  lng: number;
  accuracy?: number;
  updated_at: string;
  user?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "task_assigned" | "status_update" | "overdue" | "completed";
  read: boolean;
  created_at: string;
}

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: "To Do", color: "#6B7280" },
  assigned: { label: "Assigned", color: "#3B82F6" },
  in_progress: { label: "In Progress", color: "#F59E0B" },
  review: { label: "Review", color: "#8B5CF6" },
  done: { label: "Done", color: "#10B981" },
};

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; dot: string }> = {
  critical: { label: "Critical", color: "bg-priority-critical", dot: "bg-priority-critical" },
  high: { label: "High", color: "bg-priority-high", dot: "bg-priority-high" },
  medium: { label: "Medium", color: "bg-priority-medium", dot: "bg-priority-medium" },
  low: { label: "Low", color: "bg-priority-low", dot: "bg-priority-low" },
};
