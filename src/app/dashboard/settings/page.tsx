"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User as UserIcon, Bell, Moon, Sun } from "lucide-react";
import { COPY } from "@/lib/copy";

function getStoredUser(): { user: User; name: string; phone: string } | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("tunetops-user");
  if (!stored) return null;
  try {
    const userData = JSON.parse(stored) as User;
    return { user: userData, name: userData.name, phone: userData.phone || "" };
  } catch {
    return null;
  }
}

function getStoredSettings() {
  if (typeof window === "undefined") return { darkMode: true, taskAssignments: true, statusUpdates: true, overdueAlerts: true };
  return {
    darkMode: localStorage.getItem("tunetops-darkMode") !== "false",
    taskAssignments: localStorage.getItem("tunetops-taskAssignments") !== "false",
    statusUpdates: localStorage.getItem("tunetops-statusUpdates") !== "false",
    overdueAlerts: localStorage.getItem("tunetops-overdueAlerts") !== "false",
  };
}

export default function SettingsPage() {
  const initial = getStoredUser();
  const settings = getStoredSettings();
  const [user, setUser] = useState<User | null>(initial?.user ?? null);
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [darkMode, setDarkMode] = useState(settings.darkMode);
  const [taskAssignments, setTaskAssignments] = useState(settings.taskAssignments);
  const [statusUpdates, setStatusUpdates] = useState(settings.statusUpdates);
  const [overdueAlerts, setOverdueAlerts] = useState(settings.overdueAlerts);

  const handleSave = () => {
    if (user) {
      const updatedUser = { ...user, name, phone };
      localStorage.setItem("tunetops-user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
    localStorage.setItem("tunetops-darkMode", String(darkMode));
    localStorage.setItem("tunetops-taskAssignments", String(taskAssignments));
    localStorage.setItem("tunetops-statusUpdates", String(statusUpdates));
    localStorage.setItem("tunetops-overdueAlerts", String(overdueAlerts));
    toast.success(COPY.pages.settings.saved);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-tunet-bg">
        <div className="h-16 border-b border-tunet-border flex items-center px-6">
          <div>
            <h1 className="text-lg font-semibold text-tunet-text">{COPY.pages.settings.title}</h1>
            <p className="text-xs text-tunet-text-muted">{COPY.pages.settings.subtitle}</p>
          </div>
        </div>

        <div className="p-6 max-w-2xl space-y-6">
          <Card className="bg-tunet-surface border-tunet-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-tunet-green/20 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-tunet-green" />
                </div>
                <div>
                  <CardTitle className="text-tunet-text">{COPY.pages.settings.profile}</CardTitle>
                  <CardDescription>{COPY.pages.settings.profileDesc}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-tunet-text">{COPY.pages.settings.name}</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-tunet-bg border-tunet-border text-tunet-text"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-tunet-text">{COPY.pages.settings.phone}</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-tunet-bg border-tunet-border text-tunet-text"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-tunet-text">{COPY.pages.settings.role}</label>
                <Input
                  value={user?.role.toUpperCase() || ""}
                  disabled
                  className="bg-tunet-bg border-tunet-border text-tunet-text-muted"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-tunet-surface border-tunet-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-status-review/20 flex items-center justify-center">
                  {darkMode ? (
                    <Moon className="w-5 h-5 text-status-review" />
                  ) : (
                    <Sun className="w-5 h-5 text-status-progress" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-tunet-text">{COPY.pages.settings.appearance}</CardTitle>
                  <CardDescription>{COPY.pages.settings.appearanceDesc}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-tunet-text">{COPY.pages.settings.darkMode}</p>
                  <p className="text-xs text-tunet-text-muted">{COPY.pages.settings.darkModeDesc}</p>
                </div>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-tunet-surface border-tunet-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-status-assigned/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-status-assigned" />
                </div>
                <div>
                  <CardTitle className="text-tunet-text">{COPY.pages.settings.notifications}</CardTitle>
                  <CardDescription>{COPY.pages.settings.notificationsDesc}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-tunet-text">{COPY.pages.settings.taskAssignments}</p>
                  <p className="text-xs text-tunet-text-muted">{COPY.pages.settings.taskAssignmentsDesc}</p>
                </div>
                <Switch checked={taskAssignments} onCheckedChange={setTaskAssignments} />
              </div>
              <Separator className="bg-tunet-border" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-tunet-text">{COPY.pages.settings.statusUpdates}</p>
                  <p className="text-xs text-tunet-text-muted">{COPY.pages.settings.statusUpdatesDesc}</p>
                </div>
                <Switch checked={statusUpdates} onCheckedChange={setStatusUpdates} />
              </div>
              <Separator className="bg-tunet-border" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-tunet-text">{COPY.pages.settings.overdueAlerts}</p>
                  <p className="text-xs text-tunet-text-muted">{COPY.pages.settings.overdueAlertsDesc}</p>
                </div>
                <Switch checked={overdueAlerts} onCheckedChange={setOverdueAlerts} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              className="bg-tunet-green hover:bg-tunet-green-dark text-white"
            >
              {COPY.pages.settings.saveChanges}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
