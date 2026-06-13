"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { fetchUsers, fetchLocations, fetchTasks } from "@/lib/db";
import { User, Location, Task } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Wifi } from "lucide-react";

const RadarMap = dynamic(() => import("@/components/map/radar-map").then((m) => m.RadarMap), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-xl bg-tunet-surface border border-tunet-border flex items-center justify-center">
      <div className="text-tunet-text-muted text-sm">Loading map...</div>
    </div>
  ),
});

export default function MapPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  useEffect(() => {
    async function load() {
      const [u, l, t] = await Promise.all([fetchUsers(), fetchLocations(), fetchTasks()]);
      setUsers(u);
      setLocations(l);
      setTasks(t);
    }
    load();
  }, []);

  const focUsers = users.filter((u) => u.role === "foc");
  const nocUsers = users.filter((u) => u.role === "noc");

  const getMarkerColor = (userId: string) => {
    const hasActiveTask = tasks.some(
      (t) => t.assigned_to === userId && t.status === "in_progress"
    );
    const hasOverdueTask = tasks.some(
      (t) =>
        t.assigned_to === userId &&
        t.deadline &&
        new Date(t.deadline) < new Date() &&
        t.status !== "done"
    );

    if (hasOverdueTask) return "bg-status-overdue";
    if (hasActiveTask) return "bg-tunet-green";
    return "bg-status-progress";
  };

  return (
    <div className="h-screen flex flex-col bg-tunet-bg">
      {/* Header */}
      <div className="h-16 border-b border-tunet-border flex items-center justify-between px-6">
        <div>
          <h1 className="text-lg font-semibold text-tunet-text">Radar Map</h1>
          <p className="text-xs text-tunet-text-muted">Real-time FOC & NOC locations</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-tunet-green" />
            <span className="text-xs text-tunet-text-muted">Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-progress" />
            <span className="text-xs text-tunet-text-muted">Idle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-overdue" />
            <span className="text-xs text-tunet-text-muted">Overdue</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 p-4">
          <RadarMap height="100%" />
        </div>

        {/* Side panel */}
        <div className="w-80 border-l border-tunet-border flex flex-col">
          {/* FOC list */}
          <div className="p-4 border-b border-tunet-border">
            <h2 className="text-sm font-medium text-tunet-text mb-3">
              FOC Members ({focUsers.length})
            </h2>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {focUsers.map((user) => {
                  const location = locations.find((l) => l.user_id === user.id);
                  return (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-tunet-surface-hover cursor-pointer"
                    >
                      <div className={`w-2 h-2 rounded-full ${getMarkerColor(user.id)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-tunet-text truncate">{user.name}</p>
                        <p className="text-xs text-tunet-text-muted">
                          {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "Unknown"}
                        </p>
                      </div>
                      <Wifi className="w-3.5 h-3.5 text-tunet-green" />
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* NOC list */}
          <div className="p-4 flex-1">
            <h2 className="text-sm font-medium text-tunet-text-muted mb-3">
              NOC ({nocUsers.length})
            </h2>
            <div className="space-y-2">
              {nocUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-status-assigned" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-tunet-text-muted truncate">{user.name}</p>
                    <p className="text-xs text-tunet-text-muted">In Office</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
