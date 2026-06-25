"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskDetail } from "@/components/tasks/task-detail";
import { TaskFilters, FilterState } from "@/components/tasks/task-filters";
import { TaskListView } from "@/components/tasks/task-list-view";
import { fetchTasks, updateTaskStatus } from "@/lib/db";
import { Task, TaskStatus, User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, LayoutGrid, List, Loader2, Inbox, Trash2 } from "lucide-react";
import { COPY } from "@/lib/copy";
import { toast } from "sonner";
import { useIncrementalTasks } from "@/hooks/use-incremental-tasks";
import { useHeartbeat } from "@/hooks/use-heartbeat";

export default function TasksPage() {
  return (
    <Suspense fallback={null}>
      <TasksPageContent />
    </Suspense>
  );
}

const DEFAULT_FILTERS: FilterState = {
  status: "all",
  priority: "all",
  assignee: "all",
  tag: "all",
};

function isTaskStatus(v: string | null): v is TaskStatus {
  return v === "assigned" || v === "in_progress" || v === "review" || v === "done";
}

function isTaskPriority(v: string | null): v is Task["priority"] {
  return v === "critical" || v === "high" || v === "medium" || v === "low";
}

function readFiltersFromParams(params: URLSearchParams): FilterState {
  const status = params.get("status");
  const priority = params.get("priority");
  const assignee = params.get("assignee");
  const tag = params.get("tag");
  return {
    status: isTaskStatus(status) ? status : "all",
    priority: isTaskPriority(priority) ? priority : "all",
    assignee: assignee || "all",
    tag: tag || "all",
  };
}

function getInitialSearchQuery(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("q") || "";
}

function TasksPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(getInitialSearchQuery);
  const [searchQuery, setSearchQuery] = useState(getInitialSearchQuery);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [showDeleted, setShowDeleted] = useState(false);
  const [filters, setFilters] = useState<FilterState>(() =>
    typeof window === "undefined"
      ? DEFAULT_FILTERS
      : readFiltersFromParams(new URLSearchParams(window.location.search))
  );

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const canChangeStatus = currentUser?.role !== "foc" && currentUser?.role !== "marketing";

  useHeartbeat({ userId: currentUser?.id });

  useEffect(() => {
    const stored = localStorage.getItem("tutrack-user");
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentUser(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

  useIncrementalTasks(setTasks, { includeDeleted: showDeleted });

  const isSearching = searchInput !== searchQuery;

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.priority !== "all") params.set("priority", filters.priority);
    if (filters.assignee !== "all") params.set("assignee", filters.assignee);
    if (filters.tag !== "all") params.set("tag", filters.tag);
    if (searchQuery) params.set("q", searchQuery);
    const next = params.toString();
    const current = searchParams.toString();
    if (next !== current) {
      router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false });
    }
  }, [filters, searchQuery, pathname, router, searchParams]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const t = await fetchTasks({ includeDeleted: showDeleted });
      setTasks(t);
      setLoading(false);
    }
    load();
  }, [showDeleted]);

  // Auto-open task from ?highlight=... query param
  useEffect(() => {
    const highlightId = searchParams.get("highlight");
    if (highlightId && tasks.length > 0) {
      const target = tasks.find((t) => t.id === highlightId);
      if (target) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedTask(target);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDetailOpen(true);
        // Clean up the URL after opening
        router.replace(pathname + (searchParams.toString() ? `?${new URLSearchParams(Array.from(searchParams.entries()).filter(([k]) => k !== "highlight")).toString()}` : ""), { scroll: false });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, searchParams]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const previous = tasks.find((t) => t.id === taskId);
    if (previous) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t
        )
      );
    }

    if (currentUser) {
      const success = await updateTaskStatus(taskId, newStatus, currentUser.id);
      if (!success) {
        toast.error("Failed to update task status");
        if (previous) {
          setTasks((prev) => prev.map((t) => (t.id === taskId ? previous : t)));
        }
      }
    }
  };

  const handleTaskCreated = async () => {
    const fresh = await fetchTasks();
    setTasks(fresh);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  const handleReassigned = (taskId: string, newAssigneeId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, assigned_to: newAssigneeId, updated_at: new Date().toISOString() }
          : t
      )
    );
  };

  const handleTaskUpdated = (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleTaskDeleted = (taskId: string) => {
    if (showDeleted) {
      // In trash view: refresh from DB to pick up the new deleted_at
      fetchTasks({ includeDeleted: true }).then(setTasks);
    } else {
      // In active view: remove from local state
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.location_name.toLowerCase().includes(q) ||
        t.assignee?.name.toLowerCase().includes(q);

      const matchesStatus = filters.status === "all" || t.status === filters.status;
      const matchesPriority = filters.priority === "all" || t.priority === filters.priority;

      let matchesAssignee = true;
      if (filters.assignee === "unassigned") {
        matchesAssignee = !t.assigned_to;
      } else if (filters.assignee !== "all") {
        matchesAssignee = t.assigned_to === filters.assignee;
      }

      const matchesTag = filters.tag === "all" || t.tags?.some((tag) => tag.id === filters.tag);

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesTag;
    });
  }, [tasks, searchQuery, filters]);

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.priority !== "all" ||
    filters.assignee !== "all" ||
    filters.tag !== "all" ||
    searchQuery.length > 0;

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col">
        <div className="h-16 border-b border-tunet-border flex items-center justify-between px-6 gap-3 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold text-tunet-text">{COPY.pages.tasks.title}</h1>
            <p className="text-xs text-tunet-text-muted">{COPY.pages.tasks.subtitle}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <TaskFilters filters={filters} onFiltersChange={setFilters} />

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tunet-text-muted" />
              <Input
                id="task-search"
                placeholder={COPY.search.placeholder}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 w-64 bg-tunet-surface border-tunet-border text-tunet-text pr-9"
                aria-label={COPY.search.placeholder}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tunet-text-muted animate-spin" />
              )}
            </div>

            <div className="flex border border-tunet-border rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode("kanban")}
                className={`p-1.5 transition-colors ${
                  viewMode === "kanban"
                    ? "bg-tunet-green/20 text-tunet-green"
                    : "text-tunet-text-muted hover:bg-tunet-surface-hover"
                }`}
                aria-label={COPY.pages.tasks.viewKanban}
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
                aria-label={COPY.pages.tasks.viewList}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setShowDeleted(!showDeleted)}
              className={`p-1.5 border border-tunet-border rounded-md transition-colors ${
                showDeleted
                  ? "bg-status-overdue/20 text-status-overdue border-status-overdue/40"
                  : "text-tunet-text-muted hover:bg-tunet-surface-hover"
              }`}
              aria-label={
                showDeleted
                  ? COPY.pages.tasks.showActive
                  : COPY.pages.tasks.trash
              }
              title={showDeleted ? COPY.pages.tasks.showActive : COPY.pages.tasks.trash}
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <Button
              onClick={() => setFormOpen(true)}
              className="bg-tunet-green hover:bg-tunet-green-dark text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {COPY.pages.tasks.newTask}
            </Button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-hidden">
          {loading ? (
            <TasksPageSkeleton viewMode={viewMode} />
          ) : filteredTasks.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <EmptyState
                icon={Inbox}
                title={
                  showDeleted
                    ? COPY.pages.tasks.trashEmpty.title
                    : hasActiveFilters
                    ? COPY.empty.noMatchingTasks.title
                    : COPY.empty.noTasks.title
                }
                description={
                  showDeleted
                    ? COPY.pages.tasks.trashEmpty.description
                    : hasActiveFilters
                    ? COPY.empty.noMatchingTasks.description
                    : COPY.empty.noTasks.description
                }
                action={
                  showDeleted ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleted(false)}
                      className="border-tunet-border text-tunet-text-muted"
                    >
                      <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
                      {COPY.pages.tasks.showActive}
                    </Button>
                  ) : hasActiveFilters ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilters(DEFAULT_FILTERS);
                        setSearchInput("");
                        setSearchQuery("");
                      }}
                      className="border-tunet-border text-tunet-text-muted"
                    >
                      {COPY.filters.clearAll}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setFormOpen(true)}
                      className="bg-tunet-green hover:bg-tunet-green-dark text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Task
                    </Button>
                  )
                }
              />
            </div>
          ) : viewMode === "kanban" && !showDeleted ? (
            <KanbanBoard
              tasks={filteredTasks}
              onStatusChange={handleStatusChange}
              onTaskClick={handleTaskClick}
              canChangeStatus={canChangeStatus}
              canDelete={canChangeStatus}
              onDeleted={handleTaskDeleted}
            />
          ) : (
            <TaskListView tasks={filteredTasks} onTaskClick={handleTaskClick} />
          )}
        </div>

        <TaskForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onTaskCreated={handleTaskCreated}
        />

        <TaskDetail
          task={selectedTask}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onStatusChange={handleStatusChange}
          canChangeStatus={canChangeStatus}
          onReassigned={handleReassigned}
          canDelete={canChangeStatus}
          onDeleted={handleTaskDeleted}
          canEdit={canChangeStatus}
          onUpdated={handleTaskUpdated}
        />
      </div>
    </DashboardLayout>
  );
}

function TasksPageSkeleton({ viewMode }: { viewMode: "kanban" | "list" }) {
  if (viewMode === "kanban") {
    return (
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {Array.from({ length: 5 }).map((_, col) => (
          <div key={col} className="flex-shrink-0 w-72 space-y-3">
            <div className="flex items-center gap-2 mb-4 px-1">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-6 rounded-full" />
            </div>
            <div className="space-y-3 pr-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-tunet-border bg-tunet-surface p-4 space-y-3"
                >
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="h-4 w-12 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3 border-b border-tunet-border"
        >
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-4 w-12 rounded-full" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-32 ml-auto" />
        </div>
      ))}
    </div>
  );
}
