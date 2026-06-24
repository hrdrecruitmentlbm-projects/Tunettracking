"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { User, Tag } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User as UserIcon, Bell, Moon, Sun, Tag as TagIcon, Plus, Pencil, Trash2 } from "lucide-react";
import { COPY } from "@/lib/copy";
import { fetchTags, createTag, updateTag, deleteTag } from "@/lib/db";

function getStoredUser(): { user: User; name: string; phone: string } | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("tutrack-user");
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
    darkMode: localStorage.getItem("tutrack-darkMode") !== "false",
    taskAssignments: localStorage.getItem("tutrack-taskAssignments") !== "false",
    statusUpdates: localStorage.getItem("tutrack-statusUpdates") !== "false",
    overdueAlerts: localStorage.getItem("tutrack-overdueAlerts") !== "false",
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

  const [tags, setTags] = useState<Tag[]>([]);
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState("#3B82F6");
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [savingTag, setSavingTag] = useState(false);

  const loadTags = useCallback(async () => {
    const data = await fetchTags();
    setTags(data);
  }, []);

  useEffect(() => {
    if (user?.role === "admin") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadTags();
    }
  }, [user, loadTags]);

  const handleSaveTag = async () => {
    if (!tagName.trim()) {
      toast.error("Nama label harus diisi");
      return;
    }
    setSavingTag(true);
    if (editingTagId) {
      const updated = await updateTag(editingTagId, tagName.trim(), tagColor);
      if (updated) {
        toast.success("Label diperbarui");
        setEditingTagId(null);
      } else {
        toast.error("Gagal memperbarui label");
      }
    } else {
      const created = await createTag(tagName.trim(), tagColor);
      if (created) {
        toast.success("Label ditambahkan");
      } else {
        toast.error("Gagal menambahkan label");
      }
    }
    setTagName("");
    setTagColor("#3B82F6");
    await loadTags();
    setSavingTag(false);
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTagId(tag.id);
    setTagName(tag.name);
    setTagColor(tag.color);
  };

  const handleDeleteTag = async (id: string) => {
    const ok = await deleteTag(id);
    if (ok) {
      toast.success("Label dihapus");
      await loadTags();
      if (editingTagId === id) {
        setEditingTagId(null);
        setTagName("");
        setTagColor("#3B82F6");
      }
    } else {
      toast.error("Gagal menghapus label");
    }
  };

  const handleSave = () => {
    if (user) {
      const updatedUser = { ...user, name, phone };
      localStorage.setItem("tutrack-user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
    localStorage.setItem("tutrack-darkMode", String(darkMode));
    localStorage.setItem("tutrack-taskAssignments", String(taskAssignments));
    localStorage.setItem("tutrack-statusUpdates", String(statusUpdates));
    localStorage.setItem("tutrack-overdueAlerts", String(overdueAlerts));
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

          {user?.role === "admin" && (
            <Card className="bg-tunet-surface border-tunet-border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-tunet-ember/20 flex items-center justify-center">
                    <TagIcon className="w-5 h-5 text-tunet-ember" />
                  </div>
                  <div>
                    <CardTitle className="text-tunet-text">Label Tugas</CardTitle>
                    <CardDescription>Kelola label untuk tugas</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={tagColor}
                    onChange={(e) => setTagColor(e.target.value)}
                    className="w-9 h-9 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <Input
                    placeholder="Nama label"
                    value={tagName}
                    onChange={(e) => setTagName(e.target.value)}
                    className="bg-tunet-bg border-tunet-border text-tunet-text flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveTag}
                    disabled={savingTag || !tagName.trim()}
                    className="bg-tunet-green hover:bg-tunet-green-dark text-white"
                  >
                    {editingTagId ? <Pencil className="w-3.5 h-3.5 mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                    {editingTagId ? "Simpan" : "Tambah"}
                  </Button>
                  {editingTagId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingTagId(null);
                        setTagName("");
                        setTagColor("#3B82F6");
                      }}
                      className="border-tunet-border text-tunet-text-muted"
                    >
                      Batal
                    </Button>
                  )}
                </div>

                <Separator className="bg-tunet-border" />

                <div className="space-y-2">
                  {tags.length === 0 ? (
                    <p className="text-xs text-tunet-text-muted text-center py-4">Belum ada label</p>
                  ) : (
                    tags.map((tag) => (
                      <div
                        key={tag.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-tunet-bg border border-tunet-border"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="text-sm text-tunet-text">{tag.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditTag(tag)}
                            className="p-1 text-tunet-text-muted hover:text-tunet-text"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTag(tag.id)}
                            className="p-1 text-tunet-text-muted hover:text-status-overdue"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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
