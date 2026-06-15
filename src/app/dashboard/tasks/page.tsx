"use client";

import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskDetail } from "@/components/tasks/task-detail";
import { TaskFilters, FilterState } from "@/components/tasks/task-filters";
import { TaskListView } from "@/components/tasks/task-list-view";
import { fetchTasks, updateTaskStatus } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { Task, TaskStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, LayoutGrid, List } from "lucide-react";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    priority: "all",
    assignee: "all",
  });

  useEffect(() => {
    async function load() {
      const t = await fetchTasks();
      setTasks(t);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel("tasks-realtime")
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
      const success = await updateTaskStatus(taskId, newStatus, currentUser.id);
      if (success) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t
          )
        );
      }
    }
  };

  const handleTaskCreated = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.location_name.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = filters.status === "all" || t.status === filters.status;

      // Priority filter
      const matchesPriority = filters.priority === "all" || t.priority === filters.priority;

      // Assignee filter
      let matchesAssignee = true;
      if (filters.assignee === "unassigned") {
        matchesAssignee = !t.assigned_to;
      } else if (filters.assignee !== "all") {
        matchesAssignee = t.assigned_to === filters.assignee;
      }

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
    });
  }, [tasks, searchQuery, filters]);

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-tunet-border flex items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-semibold text-tunet-text">Task Board</h1>
            <p className="text-xs text-tunet-text-muted">Manage all tasks across the team</p>
          </div>
          <div className="flex items-center gap-3">
            <TaskFilters onFiltersChange={setFilters} />

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tunet-text-muted" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64 bg-tunet-surface border-tunet-border text-tunet-text"
              />
            </div>

            {/* View toggle */}
            <div className="flex border border-tunet-border rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode("kanban")}
                className={`p-1.5 transition-colors ${
                  viewMode === "kanban"
                    ? "bg-tunet-green/20 text-tunet-green"
                    : "text-tunet-text-muted hover:bg-tunet-surface-hover"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 transition-colors ${
                  viewMode === "list"
                    ? "bg-tunet-green/20 text-tunet-green"
                    : "text-tunet-text-muted hover:bg-tunet-surface-hover"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <Button
              onClick={() => setFormOpen(true)}
              className="bg-tunet-green hover:bg-tunet-green-dark text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-hidden">
          {viewMode === "kanban" ? (
            <KanbanBoard
              tasks={filteredTasks}
              onStatusChange={handleStatusChange}
              onTaskClick={handleTaskClick}
            />
          ) : (
            <TaskListView tasks={filteredTasks} onTaskClick={handleTaskClick} />
          )}
        </div>

        {/* Task creation form */}
        <TaskForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onTaskCreated={handleTaskCreated}
        />

        {/* Task detail view */}
        <TaskDetail
          task={selectedTask}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onStatusChange={handleStatusChange}
        />
      </div>
    </DashboardLayout>
  );
}
