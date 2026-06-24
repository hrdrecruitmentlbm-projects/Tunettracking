export type UserRole = "admin" | "noc" | "foc";

export type TaskStatus = "assigned" | "in_progress" | "review" | "done";

export type TaskPriority = "critical" | "high" | "medium" | "low";

export interface User {
  id: string;
  name: string;
  pin: string;
  role: UserRole;
  phone?: string;
  telegram_id?: string;
  telegram_chat_id?: number;
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
  deleted_at?: string | null;
  tags?: Tag[];
  assignee?: User;
  creator?: User;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  task_id: string;
  uploaded_by: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  upload_phase: "in_progress" | "completed";
  caption?: string;
  created_at: string;
  signed_url?: string;
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
  task_id?: string;
  metadata?: Record<string, unknown>;
}

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  assigned: { label: "Baru Ditugaskan", color: "#3B82F6" },
  in_progress: { label: "Sedang Dikerjakan", color: "#F59E0B" },
  review: { label: "Sedang di Review", color: "#8B5CF6" },
  done: { label: "Selesai", color: "#10B981" },
};

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; dot: string }> = {
  low: { label: "Rendah", color: "bg-priority-low", dot: "bg-priority-low" },
  medium: { label: "Sedang", color: "bg-priority-medium", dot: "bg-priority-medium" },
  high: { label: "Tinggi", color: "bg-priority-high", dot: "bg-priority-high" },
  critical: { label: "Urgent", color: "bg-priority-critical", dot: "bg-priority-critical" },
};

export type AttendanceType = "berangkat" | "pulang";

export interface Attendance {
  id: string;
  user_id: string;
  type: AttendanceType;
  timestamp: string;
  attendance_date: string;
  location_lat?: number | null;
  location_lng?: number | null;
  notes?: string | null;
  created_at: string;
}

export interface AttendanceWithUser extends Attendance {
  user?: User;
  todos?: AttendanceTodo[];
}

export interface AttendanceStats {
  thisMonthDays: number;
  totalDays: number;
  averageDurationMinutes: number;
  hadirPercentage: number;
}

export const ATTENDANCE_TYPE_CONFIG: Record<AttendanceType, { label: string; color: string; bg: string }> = {
  berangkat: {
    label: "Berangkat",
    color: "text-tunet-green",
    bg: "bg-tunet-green/20 border-tunet-green/40",
  },
  pulang: {
    label: "Pulang",
    color: "text-tunet-ember",
    bg: "bg-tunet-ember/20 border-tunet-ember/40",
  },
};

export interface GroupedDay {
  date: string;
  berangkat: Attendance | null;
  pulang: Attendance | null;
  durationMinutes: number | null;
  todos: AttendanceTodo[];
}

export interface AttendanceTodo {
  id: string;
  attendance_id: string;
  user_id: string;
  title: string;
  created_at: string;
}
