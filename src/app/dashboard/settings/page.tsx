"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User as UserIcon, Bell, Moon, Sun } from "lucide-react";

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

export default function SettingsPage() {
  const initial = getStoredUser();
  const [user, setUser] = useState<User | null>(initial?.user ?? null);
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [darkMode, setDarkMode] = useState(true);

  const handleSave = () => {
    if (user) {
      const updatedUser = { ...user, name, phone };
      localStorage.setItem("tunetops-user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast.success("Settings saved!");
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-tunet-bg">
        {/* Header */}
        <div className="h-16 border-b border-tunet-border flex items-center px-6">
          <div>
            <h1 className="text-lg font-semibold text-tunet-text">Settings</h1>
            <p className="text-xs text-tunet-text-muted">Manage your account preferences</p>
          </div>
        </div>

        <div className="p-6 max-w-2xl space-y-6">
          {/* Profile */}
          <Card className="bg-tunet-surface border-tunet-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-tunet-green/20 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-tunet-green" />
                </div>
                <div>
                  <CardTitle className="text-tunet-text">Profile</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-tunet-text">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-tunet-bg border-tunet-border text-tunet-text"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-tunet-text">Phone</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-tunet-bg border-tunet-border text-tunet-text"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-tunet-text">Role</label>
                <Input
                  value={user?.role.toUpperCase() || ""}
                  disabled
                  className="bg-tunet-bg border-tunet-border text-tunet-text-muted"
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
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
                  <CardTitle className="text-tunet-text">Appearance</CardTitle>
                  <CardDescription>Customize the look of the app</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-tunet-text">Dark Mode</p>
                  <p className="text-xs text-tunet-text-muted">Toggle between dark and light theme</p>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    darkMode ? "bg-tunet-green" : "bg-tunet-surface-hover"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      darkMode ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="bg-tunet-surface border-tunet-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-status-assigned/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-status-assigned" />
                </div>
                <div>
                  <CardTitle className="text-tunet-text">Notifications</CardTitle>
                  <CardDescription>Configure notification preferences</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-tunet-text">Task Assignments</p>
                  <p className="text-xs text-tunet-text-muted">Get notified when tasks are assigned</p>
                </div>
                <button className="w-12 h-6 rounded-full bg-tunet-green">
                  <div className="w-5 h-5 rounded-full bg-white translate-x-6" />
                </button>
              </div>
              <Separator className="bg-tunet-border" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-tunet-text">Status Updates</p>
                  <p className="text-xs text-tunet-text-muted">Get notified on task status changes</p>
                </div>
                <button className="w-12 h-6 rounded-full bg-tunet-green">
                  <div className="w-5 h-5 rounded-full bg-white translate-x-6" />
                </button>
              </div>
              <Separator className="bg-tunet-border" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-tunet-text">Overdue Alerts</p>
                  <p className="text-xs text-tunet-text-muted">Get notified when tasks are overdue</p>
                </div>
                <button className="w-12 h-6 rounded-full bg-tunet-green">
                  <div className="w-5 h-5 rounded-full bg-white translate-x-6" />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Save button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              className="bg-tunet-green hover:bg-tunet-green-dark text-white"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
