"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { fetchUsers, fetchTasks } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckSquare, AlertTriangle, Activity } from "lucide-react";
import { User, Task } from "@/types";

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [u, t] = await Promise.all([fetchUsers(), fetchTasks()]);
      setUsers(u);
      setTasks(t);
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

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-tunet-bg">
        {/* Header */}
        <div className="h-16 border-b border-tunet-border flex items-center px-6">
          <div>
            <h1 className="text-lg font-semibold text-tunet-text">Admin Dashboard</h1>
            <p className="text-xs text-tunet-text-muted">Overview of Tunet operations</p>
          </div>
        </div>

        {/* Stats cards */}
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-tunet-text-muted">Total Tasks</p>
                  <p className="text-2xl font-bold text-tunet-text">{totalTasks}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-status-assigned/20 flex items-center justify-center">
                  <CheckSquare className="w-5 h-5 text-status-assigned" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-tunet-text-muted mb-1">
                  <span>Completion rate</span>
                  <span>{totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%</span>
                </div>
                <div className="w-full h-1.5 bg-tunet-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-tunet-green rounded-full"
                    style={{
                      width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`,
                    }}
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

        {/* Team overview */}
        <div className="px-6 pb-6">
          <Card className="bg-tunet-surface border-tunet-border">
            <CardHeader>
              <CardTitle className="text-tunet-text">Team Members</CardTitle>
            </CardHeader>
            <CardContent>
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
                          <Badge variant="secondary" className="text-xs bg-tunet-green/20 text-tunet-green">
                            Active
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
