export type UserRole = "admin" | "noc" | "foc" | "marketing";

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
  photo_file_id?: string | null;
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

// ===== MARKETING TYPES =====

export type ProspectStatus = "belum_diproses" | "sudah_followup" | "acc" | "tidak";

export type TowerSiteStatus = "baru_ditugaskan" | "pending" | "diproses" | "acc" | "rejected";

export type CardType = "task" | "prospect" | "tower";

export interface Prospect {
  id: string;
  name: string;
  phone: string;
  address: string;
  location_lat: number;
  location_lng: number;
  status: ProspectStatus;
  notes: string;
  assigned_to: string;
  area: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
  assignee?: User;
  deleter?: User;
}

export interface ProspectHistory {
  id: string;
  prospect_id: string;
  old_status: string;
  new_status: string;
  changed_by: string;
  changed_at: string;
  changer?: User;
}

export interface TowerSite {
  id: string;
  name: string;
  site_type: "village" | "school" | "corporate" | "government" | "other";
  contact_person: string;
  contact_phone: string;
  location_lat: number;
  location_lng: number;
  status: TowerSiteStatus;
  notes: string;
  assigned_to: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
  assignee?: User;
  deleter?: User;
}

export interface VisitLog {
  id: string;
  type: "prospek" | "tower";
  prospect_id?: string | null;
  tower_id?: string | null;
  visited_by: string;
  status_snapshot: string;
  notes: string;
  location_lat: number;
  location_lng: number;
  created_at: string;
  visitor?: User;
  prospect?: Prospect;
  tower?: TowerSite;
}

export const PROSPECT_STATUS_CONFIG: Record<ProspectStatus, { label: string; color: string }> = {
  belum_diproses: { label: "Belum Diproses", color: "#6B7280" },
  sudah_followup: { label: "Sudah di Followup", color: "#3B82F6" },
  acc: { label: "Acc", color: "#10B981" },
  tidak: { label: "Tidak", color: "#EF4444" },
};

export const TOWER_SITE_STATUS_CONFIG: Record<TowerSiteStatus, { label: string; color: string }> = {
  baru_ditugaskan: { label: "Baru Ditugaskan", color: "#6B7280" },
  pending: { label: "Pending", color: "#F59E0B" },
  diproses: { label: "Diproses", color: "#3B82F6" },
  acc: { label: "Acc", color: "#10B981" },
  rejected: { label: "Rejected", color: "#EF4444" },
};

export const SITE_TYPE_CONFIG: Record<string, { label: string; icon: string }> = {
  village: { label: "Kampung", icon: "🏘️" },
  school: { label: "Sekolah", icon: "🏫" },
  corporate: { label: "Perusahaan", icon: "🏢" },
  government: { label: "Pemerintah", icon: "🏛️" },
  other: { label: "Lainnya", icon: "📍" },
};
