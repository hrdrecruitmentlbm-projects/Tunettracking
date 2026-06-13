"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { TaskForm } from "@/components/tasks/task-form";
import { fetchTasks, updateTaskStatus } from "@/lib/db";
import { Task, TaskStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const t = await fetchTasks();
      setTasks(t);
      setLoading(false);
    }
    load();
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

  const filteredTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.location_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tunet-text-muted" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64 bg-tunet-surface border-tunet-border text-tunet-text"
              />
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

        {/* Kanban board */}
        <div className="flex-1 p-6 overflow-hidden">
          <KanbanBoard tasks={filteredTasks} onStatusChange={handleStatusChange} />
        </div>

        {/* Task creation form */}
        <TaskForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onTaskCreated={handleTaskCreated}
        />
      </div>
    </DashboardLayout>
  );
}
