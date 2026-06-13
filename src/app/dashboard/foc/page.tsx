"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TaskCard } from "@/components/tasks/task-card";
import { fetchTasks, upsertLocation, updateTaskStatus } from "@/lib/db";
import { Task, TaskStatus } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Radio, RadioOff, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function FOCDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  const storedUser = typeof window !== "undefined" ? localStorage.getItem("tunetops-user") : null;
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const userId = currentUser?.id;

  useEffect(() => {
    async function load() {
      const t = await fetchTasks();
      setTasks(t);
      setLoading(false);
    }
    load();
  }, []);

  const myTasks = tasks.filter((t) => t.assigned_to === userId);
  const pendingTasks = myTasks.filter((t) => t.status !== "done");
  const completedTasks = myTasks.filter((t) => t.status === "done");

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (!userId) return;
    const success = await updateTaskStatus(taskId, newStatus, userId);
    if (success) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t
        )
      );
      toast.success("Task status updated!");
    } else {
      toast.error("Failed to update task status");
    }
  };

  const toggleLocation = async () => {
    if (locationEnabled) {
      setLocationEnabled(false);
      setCurrentLocation(null);
      toast.info("Location sharing disabled");
    } else {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const loc = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setCurrentLocation(loc);
            setLocationEnabled(true);
            if (userId) {
              await upsertLocation(userId, loc.lat, loc.lng, position.coords.accuracy);
            }
            toast.success("Location sharing enabled!");
          },
          (error) => {
            toast.error("Unable to get location. Please enable GPS.");
          }
        );
      } else {
        toast.error("Geolocation is not supported by your browser");
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-tunet-bg">
        {/* Header */}
        <div className="h-16 border-b border-tunet-border flex items-center justify-between px-4">
          <div>
            <h1 className="text-lg font-semibold text-tunet-text">My Tasks</h1>
            <p className="text-xs text-tunet-text-muted">Field Operations Center</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-tunet-green border-tunet-green">
              {pendingTasks.length} pending
            </Badge>
          </div>
        </div>

        {/* Location sharing toggle */}
        <div className="p-4 border-b border-tunet-border">
          <Card className="bg-tunet-surface border-tunet-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      locationEnabled
                        ? "bg-tunet-green/20 text-tunet-green"
                        : "bg-tunet-surface-hover text-tunet-text-muted"
                    }`}
                  >
                    {locationEnabled ? (
                      <Radio className="w-5 h-5 animate-pulse" />
                    ) : (
                      <RadioOff className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-tunet-text">Share My Location</p>
                    <p className="text-xs text-tunet-text-muted">
                      {locationEnabled
                        ? "NOC can see your real-time location"
                        : "Enable to let NOC track your position"}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={toggleLocation}
                  variant={locationEnabled ? "outline" : "default"}
                  className={
                    locationEnabled
                      ? "border-tunet-green text-tunet-green hover:bg-tunet-green/10"
                      : "bg-tunet-green hover:bg-tunet-green-dark text-white"
                  }
                >
                  {locationEnabled ? "Disable" : "Enable"}
                </Button>
              </div>
              {currentLocation && (
                <div className="mt-3 pt-3 border-t border-tunet-border flex items-center gap-2 text-xs text-tunet-text-muted">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Task list */}
        <div className="p-4 space-y-4">
          {/* Active tasks */}
          {pendingTasks.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-tunet-text mb-3">Active Tasks</h2>
              <div className="space-y-3">
                {pendingTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
                ))}
              </div>
            </div>
          )}

          {/* Completed tasks */}
          {completedTasks.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-tunet-text-muted mb-3">Completed</h2>
              <div className="space-y-3 opacity-60">
                {completedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {myTasks.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-tunet-surface flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-tunet-green" />
              </div>
              <h3 className="text-lg font-medium text-tunet-text mb-1">No tasks assigned</h3>
              <p className="text-sm text-tunet-text-muted">
                You&apos;re all caught up! Check back later.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}


