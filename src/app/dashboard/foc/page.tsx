"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TaskCard } from "@/components/tasks/task-card";
import { fetchTasks, upsertLocation, updateTaskStatus } from "@/lib/db";
import { Task, TaskStatus } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Radio,
  RadioOff,
  CheckCircle,
  RefreshCw,
  Navigation,
  Send,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";

const LOCATION_INTERVAL = 2 * 60 * 1000; // 2 minutes in ms
const TELEGRAM_BOT_USERNAME = "TunetOpsTrackingBot";

export default function FOCDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const storedUser = typeof window !== "undefined" ? localStorage.getItem("tunetops-user") : null;
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const userId = currentUser?.id;
  const telegramUsername = currentUser?.telegram_id;

  useEffect(() => {
    async function load() {
      const t = await fetchTasks();
      setTasks(t);
      setLoading(false);
    }
    load();
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
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

  const sendLocationToServer = useCallback(async () => {
    if (!userId) return;

    return new Promise<void>((resolve) => {
      if (!("geolocation" in navigator)) {
        toast.error("Geolocation not supported");
        resolve();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(loc);
          setLastUpdated(new Date());

          const success = await upsertLocation(userId, loc.lat, loc.lng, position.coords.accuracy);
          if (success) {
            console.log("Location sent to server:", loc.lat, loc.lng);
          }
          resolve();
        },
        (error) => {
          console.error("GPS error:", error);
          resolve();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, [userId]);

  const handleManualUpdate = async () => {
    setUpdatingLocation(true);
    await sendLocationToServer();
    toast.success("Location updated!");
    setUpdatingLocation(false);
  };

  const toggleLocation = async () => {
    if (locationEnabled) {
      // Disable location tracking
      setLocationEnabled(false);
      setCurrentLocation(null);
      setLastUpdated(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      toast.info("Location sharing disabled");
    } else {
      // Enable location tracking
      if (!("geolocation" in navigator)) {
        toast.error("Geolocation not supported");
        return;
      }

      toast.info("Getting your location...");

      // Get first location immediately
      await sendLocationToServer();
      setLocationEnabled(true);
      toast.success("Location sharing enabled!");

      // Set up periodic updates every 2 minutes
      intervalRef.current = setInterval(async () => {
        await sendLocationToServer();
      }, LOCATION_INTERVAL);
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

        {/* Location sharing */}
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
                        ? "Updates every 2 minutes. NOC can see your position."
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

              {/* Location info */}
              {locationEnabled && currentLocation && (
                <div className="mt-3 pt-3 border-t border-tunet-border space-y-2">
                  <div className="flex items-center gap-2 text-xs text-tunet-text-muted">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>
                      {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                    </span>
                  </div>
                  {lastUpdated && (
                    <div className="flex items-center gap-2 text-xs text-tunet-text-muted">
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
                    </div>
                  )}
                  <Button
                    onClick={handleManualUpdate}
                    disabled={updatingLocation}
                    variant="outline"
                    size="sm"
                    className="w-full border-tunet-border text-tunet-text hover:bg-tunet-surface-hover"
                  >
                    {updatingLocation ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3.5 h-3.5 mr-2" />
                        Update My Location Now
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Telegram section */}
        <div className="px-4 pb-4">
          <Card className="bg-tunet-surface border-tunet-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      telegramUsername
                        ? "bg-tunet-green/20 text-tunet-green"
                        : "bg-tunet-surface-hover text-tunet-text-muted"
                    }`}
                  >
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-tunet-text">Telegram Bot</p>
                    <p className="text-xs text-tunet-text-muted">
                      {telegramUsername
                        ? `Linked: ${telegramUsername}`
                        : "Not linked. Ask admin to set your Telegram username."}
                    </p>
                  </div>
                </div>
                {telegramUsername ? (
                  <a
                    href={`https://t.me/${TELEGRAM_BOT_USERNAME}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-3 py-2 text-sm rounded-md bg-tunet-green/20 text-tunet-green hover:bg-tunet-green/30"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Open Bot
                  </a>
                ) : (
                  <Badge variant="outline" className="text-status-overdue border-status-overdue">
                    Not Set
                  </Badge>
                )}
              </div>

              {telegramUsername && (
                <div className="mt-3 pt-3 border-t border-tunet-border">
                  <p className="text-xs text-tunet-text-muted mb-2">
                    📍 Share location via Telegram — works even when browser is closed
                  </p>
                  <ol className="text-xs text-tunet-text-muted space-y-1 list-decimal list-inside">
                    <li>Open the bot and send /start</li>
                    <li>Tap 📎 → Location → Share</li>
                    <li>Your marker appears on the radar map</li>
                  </ol>
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
