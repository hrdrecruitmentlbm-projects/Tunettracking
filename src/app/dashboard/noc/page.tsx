"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TaskDetail } from "@/components/tasks/task-detail";
import { fetchTasks } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { Task, TaskStatus, STATUS_CONFIG } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, AlertTriangle, CheckCircle, Clock, Inbox } from "lucide-react";
import { COPY } from "@/lib/copy";
import { toast } from "sonner";
import { useTelegramDispatch } from "@/hooks/use-telegram-dispatch";

const RadarMap = dynamic(() => import("@/components/map/radar-map").then((m) => m.RadarMap), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-xl bg-tunet-surface border border-tunet-border flex items-center justify-center">
      <div className="text-tunet-text-muted text-sm">{COPY.loading.map}</div>
    </div>
  ),
});

export default function NOCDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  useTelegramDispatch(currentUserId);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tunetops-user");
      if (stored) {
        try {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setCurrentUserId(JSON.parse(stored).id);
        } catch {
          // ignore
        }
      }
    }
  }, []);

  useEffect(() => {
    async function load() {
      const t = await fetchTasks();
      setTasks(t);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel("noc-tasks-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        async () => {
          const t = await fetchTasks();
          setTasks(t);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const storedUser = localStorage.getItem("tunetops-user");
    const currentUser = storedUser ? JSON.parse(storedUser) : null;

    if (currentUser) {
      const { updateTaskStatus } = await import("@/lib/db");
      const success = await updateTaskStatus(taskId, newStatus, currentUser.id);
      if (success) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t
          )
        );
      } else {
        toast.error("Failed to update task status");
      }
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  const activeTasks = tasks.filter((t) => t.status === "in_progress").length;
  const overdueTasks = tasks.filter(
    (t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== "done"
  ).length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;

  if (loading) {
    return (
      <DashboardLayout>
        <NOCSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col">
        <div className="h-16 border-b border-tunet-border flex items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-semibold text-tunet-text">NOC Dashboard</h1>
            <p className="text-xs text-tunet-text-muted">Network Operations Center</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-tunet-text">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          </div>
        </div>

        <div className="border-b border-tunet-border px-6 py-3">
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-tunet-green" />
              <span className="text-sm text-tunet-text-muted">Active:</span>
              <span className="text-sm font-medium text-tunet-green">{activeTasks}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-status-overdue" />
              <span className="text-sm text-tunet-text-muted">Overdue:</span>
              <span className="text-sm font-medium text-status-overdue">{overdueTasks}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-status-done" />
              <span className="text-sm text-tunet-text-muted">Completed:</span>
              <span className="text-sm font-medium text-status-done">{completedTasks}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-tunet-text-muted" />
              <span className="text-sm text-tunet-text-muted">Total:</span>
              <span className="text-sm font-medium text-tunet-text">{tasks.length}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-[60%] p-4">
            <RadarMap height="100%" />
          </div>

          <div className="w-[40%] border-l border-tunet-border p-4">
            <div className="mb-4">
              <h2 className="text-sm font-medium text-tunet-text">Recent Tasks</h2>
            </div>
            <div className="overflow-x-auto">
              <div className="flex gap-3" style={{ minWidth: "max-content" }}>
                {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((status) => {
                  const statusTasks = tasks.filter((t) => t.status === status);
                  const config = STATUS_CONFIG[status];

                  return (
                    <div key={status} className="w-56">
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: config.color }}
                        />
                        <span className="text-xs font-medium text-tunet-text">{config.label}</span>
                        <span className="text-xs text-tunet-text-muted">({statusTasks.length})</span>
                      </div>
                      <div className="space-y-2">
                        {statusTasks.length === 0 ? (
                          <div className="text-center py-6 text-tunet-text-muted text-[10px] border border-dashed border-tunet-border rounded-lg">
                            <Inbox className="w-3.5 h-3.5 mx-auto mb-1 opacity-50" />
                            Kosong
                          </div>
                        ) : (
                          <>
                            {statusTasks.slice(0, 3).map((task) => (
                              <div
                                key={task.id}
                                onClick={() => handleTaskClick(task)}
                                className="p-3 rounded-lg bg-tunet-surface border border-tunet-border hover:border-tunet-green/50 transition-colors cursor-pointer"
                              >
                                <div className="flex items-start gap-2 mb-2">
                                  <div
                                    className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                                    style={{
                                      backgroundColor:
                                        task.priority === "critical"
                                          ? "#EF4444"
                                          : task.priority === "high"
                                          ? "#F97316"
                                          : task.priority === "medium"
                                          ? "#EAB308"
                                          : "#6B7280",
                                    }}
                                  />
                                  <p className="text-xs font-medium text-tunet-text leading-tight">
                                    {task.title}
                                  </p>
                                </div>
                                <p className="text-[10px] text-tunet-text-muted truncate ml-3.5">
                                  {task.location_name}
                                </p>
                              </div>
                            ))}
                            {statusTasks.length > 3 && (
                              <p className="text-xs text-tunet-green text-center py-1">
                                +{statusTasks.length - 3} more
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <TaskDetail
        task={selectedTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onStatusChange={handleStatusChange}
        canChangeStatus={true}
      />
    </DashboardLayout>
  );
}

function NOCSkeleton() {
  return (
    <div className="h-screen flex flex-col">
      <div className="h-16 border-b border-tunet-border flex items-center px-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-44" />
        </div>
      </div>
      <div className="border-b border-tunet-border px-6 py-3">
        <div className="flex gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-6" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex">
        <div className="w-[60%] p-4">
          <Skeleton className="h-full w-full rounded-xl" />
        </div>
        <div className="w-[40%] border-l border-tunet-border p-4 space-y-4">
          <Skeleton className="h-4 w-28" />
          <div className="flex gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-56 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
