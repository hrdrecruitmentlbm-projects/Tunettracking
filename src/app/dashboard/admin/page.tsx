"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  fetchUsers,
  fetchTasks,
  fetchCompletionTrend,
  type CompletionTrendPoint,
} from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Sparkline, TrendBadge } from "@/components/ui/sparkline";
import { Users, CheckSquare, AlertTriangle, Activity, UsersRound } from "lucide-react";
import { User, Task } from "@/types";
import { COPY } from "@/lib/copy";

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [trend, setTrend] = useState<CompletionTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [u, t, tr] = await Promise.all([
        fetchUsers(),
        fetchTasks(),
        fetchCompletionTrend(7),
      ]);
      setUsers(u);
      setTasks(t);
      setTrend(tr);
      setLoading(false);
    }
    load();
  }, []);

  const totalUsers = users.length;
  const focCount = users.filter((u) => u.role === "foc").length;
  const nocCount = users.filter((u) => u.role === "noc").length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const overdueTasks = tasks.filter(
    (t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== "done"
  ).length;
  const activeTasks = tasks.filter((t) => t.status === "in_progress").length;
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const trendCounts = trend.map((t) => t.count);

  if (loading) {
    return (
      <DashboardLayout>
        <AdminDashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-tunet-bg">
        <div className="h-16 border-b border-tunet-border flex items-center px-6">
          <div>
            <h1 className="text-lg font-semibold text-tunet-text">Admin Dashboard</h1>
            <p className="text-xs text-tunet-text-muted">Overview of Tunet operations</p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-tunet-surface border-tunet-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-tunet-text-muted">Total Team</p>
                  <p className="text-2xl font-bold text-tunet-text">{totalUsers}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-tunet-green/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-tunet-green" />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Badge variant="secondary" className="text-xs">
                  {nocCount} NOC
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {focCount} FOC
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-tunet-surface border-tunet-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-tunet-text-muted">Total Tasks</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-tunet-text">{totalTasks}</p>
                    <span className="text-xs text-tunet-text-muted">{completionPct}% done</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-status-assigned/20 flex items-center justify-center">
                  <CheckSquare className="w-5 h-5 text-status-assigned" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-tunet-text-muted">
                  <span>{COPY.trend.thisWeek}</span>
                  <TrendBadge data={trendCounts} />
                </div>
                <div className="text-tunet-green">
                  <Sparkline
                    data={trendCounts}
                    width={220}
                    height={32}
                    stroke="currentColor"
                    fill="currentColor"
                    showDots
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-tunet-surface border-tunet-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-tunet-text-muted">Active Tasks</p>
                  <p className="text-2xl font-bold text-status-progress">{activeTasks}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-status-progress/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-status-progress" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-tunet-surface border-tunet-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-tunet-text-muted">Overdue</p>
                  <p className="text-2xl font-bold text-status-overdue">{overdueTasks}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-status-overdue/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-status-overdue" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="px-6 pb-6">
          <Card className="bg-tunet-surface border-tunet-border">
            <CardHeader>
              <CardTitle className="text-tunet-text">Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <EmptyState
                  icon={UsersRound}
                  title={COPY.empty.noTeamMembers.title}
                  description={COPY.empty.noTeamMembers.description}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-tunet-border">
                        <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">
                          Name
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">
                          Role
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">
                          Phone
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-tunet-border last:border-0">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-tunet-green/20 flex items-center justify-center text-tunet-green text-sm font-medium">
                                {user.name.charAt(0)}
                              </div>
                              <span className="text-sm text-tunet-text">{user.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                user.role === "admin"
                                  ? "bg-tunet-green/20 text-tunet-green"
                                  : user.role === "noc"
                                  ? "bg-status-assigned/20 text-status-assigned"
                                  : "bg-status-progress/20 text-status-progress"
                              }`}
                            >
                              {user.role.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-tunet-text-muted">{user.phone}</td>
                          <td className="py-3 px-4">
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                user.is_active
                                  ? "bg-tunet-green/20 text-tunet-green"
                                  : "bg-status-overdue/20 text-status-overdue"
                              }`}
                            >
                              {user.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function AdminDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-tunet-bg">
      <div className="h-16 border-b border-tunet-border flex items-center px-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-44" />
        </div>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-tunet-surface border-tunet-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-12" />
                </div>
                <Skeleton className="w-10 h-10 rounded-lg" />
              </div>
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="px-6 pb-6">
        <Card className="bg-tunet-surface border-tunet-border">
          <CardHeader>
            <Skeleton className="h-4 w-28" />
          </CardHeader>
          <CardContent className="space-y-3">
            <SkeletonText lines={5} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
