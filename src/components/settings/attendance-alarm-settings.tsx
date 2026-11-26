"use client";

import { useEffect, useState } from "react";
import {
  AlarmClock,
  Bell,
  Loader2,
  Send,
  Volume2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { playAlarmChime, unlockAlarmAudio } from "@/lib/alarm-sound";
import { cn } from "@/lib/utils";
import {
  AttendanceReminderSettings,
  DEFAULT_ATTENDANCE_REMINDER_SETTINGS,
  UserRole,
} from "@/types";

const DAY_LABELS: Array<{ day: number; short: string }> = [
  { day: 1, short: "Sen" },
  { day: 2, short: "Sel" },
  { day: 3, short: "Rab" },
  { day: 4, short: "Kam" },
  { day: 5, short: "Jum" },
  { day: 6, short: "Sab" },
  { day: 0, short: "Min" },
];

interface AttendanceAlarmSettingsProps {
  role?: UserRole;
}

export function AttendanceAlarmSettingsCard({
  role,
}: AttendanceAlarmSettingsProps) {
  const isAdmin = role === "admin";
  const [settings, setSettings] = useState<AttendanceReminderSettings>(
    DEFAULT_ATTENDANCE_REMINDER_SETTINGS
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [notifPerm, setNotifPerm] = useState<string>(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    return Notification.permission;
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/attendance/reminder-settings", {
          cache: "no-store",
        });
        if (res.ok && !cancelled) {
          const json = (await res.json()) as {
            settings: AttendanceReminderSettings;
          };
          setSettings(json.settings);
        }
      } catch {
        // Keep default state on network error
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleDay = (day: number) => {
    setSettings((prev) => {
      const exists = prev.active_days.includes(day);
      const next = exists
        ? prev.active_days.filter((d) => d !== day)
        : [...prev.active_days, day];
      return { ...prev, active_days: next };
    });
  };

  const handleSave = async () => {
    if (settings.active_days.length === 0) {
      toast.error("Pilih minimal 1 hari kerja aktif");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/attendance/reminder-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: settings.enabled,
          berangkat_time: settings.berangkat_time,
          pulang_time: settings.pulang_time,
          grace_minutes: settings.grace_minutes,
          active_days: settings.active_days,
          sound_enabled: settings.sound_enabled,
          telegram_enabled: settings.telegram_enabled,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Gagal menyimpan pengaturan alarm absen");
        return;
      }
      setSettings(json.settings);
      window.dispatchEvent(new Event("tutrack-reminder-settings-updated"));
      toast.success("Pengaturan jam & alarm absen disimpan");
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setSaving(false);
    }
  };

  const handleTestSound = async () => {
    const ok = await unlockAlarmAudio();
    const played = ok ? await playAlarmChime() : false;
    if (played) {
      toast.success("Suara alarm aktif");
    } else {
      toast.error("Browser tidak mengizinkan audio");
    }
  };

  const handleEnableBrowserNotif = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Browser ini tidak mendukung notifikasi");
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
    if (perm === "granted") {
      toast.success("Notifikasi browser diaktifkan");
    } else {
      toast.error("Izin notifikasi ditolak di browser");
    }
  };

  const handleTriggerTelegram = async () => {
    setTriggering(true);
    try {
      const res = await fetch("/api/attendance/reminders/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Gagal mengirim pengingat");
        return;
      }
      const label = json.type === "pulang" ? "Pulang" : "Berangkat";
      if (!json.telegramConfigured) {
        toast.info(
          `Ditemukan ${json.missingCount} karyawan belum absen ${label} (TELEGRAM_BOT_TOKEN belum dikonfigurasi)`
        );
      } else {
        toast.success(
          `Pengingat ${label}: ${json.sentCount} pesan Telegram terkirim (${json.missingCount} karyawan belum absen)`
        );
      }
    } catch {
      toast.error("Gagal memicu pengingat Telegram");
    } finally {
      setTriggering(false);
    }
  };

  return (
    <Card className="bg-tunet-surface border-tunet-border">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-tunet-ember/20 flex items-center justify-center">
            <AlarmClock className="w-5 h-5 text-tunet-ember" />
          </div>
          <div>
            <CardTitle className="text-tunet-text">
              Pengaturan Alarm &amp; Pengingat Absen
            </CardTitle>
            <CardDescription>
              {isAdmin
                ? "Atur jam berangkat, jam pulang, hari kerja, suara alarm web, dan pengingat Telegram otomatis"
                : "Jadwal alarm pengingat absen aktif (WIB) dan uji suara di perangkat Anda"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-tunet-text-muted py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat pengaturan alarm...
          </div>
        ) : (
          <>
            {isAdmin && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-tunet-text">
                      Aktifkan Alarm Absen Otomatis
                    </p>
                    <p className="text-xs text-tunet-text-muted">
                      Bunyikan alarm di web dan kirim pengingat jika melewati jam yang ditentukan
                    </p>
                  </div>
                  <Switch
                    id="alarm-enabled"
                    checked={settings.enabled}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({ ...prev, enabled: checked }))
                    }
                    aria-label="Aktifkan Alarm Absen Otomatis"
                  />
                </div>

                <Separator className="bg-tunet-border" />
              </>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="alarm-berangkat-time"
                  className="text-xs font-medium text-tunet-text"
                >
                  Jam Berangkat (WIB)
                </label>
                <Input
                  id="alarm-berangkat-time"
                  type="time"
                  value={settings.berangkat_time}
                  disabled={!isAdmin}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      berangkat_time: e.target.value,
                    }))
                  }
                  className="bg-tunet-bg border-tunet-border text-tunet-text font-mono-data"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="alarm-pulang-time"
                  className="text-xs font-medium text-tunet-text"
                >
                  Jam Pulang (WIB)
                </label>
                <Input
                  id="alarm-pulang-time"
                  type="time"
                  value={settings.pulang_time}
                  disabled={!isAdmin}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      pulang_time: e.target.value,
                    }))
                  }
                  className="bg-tunet-bg border-tunet-border text-tunet-text font-mono-data"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="alarm-grace-minutes"
                  className="text-xs font-medium text-tunet-text"
                >
                  Toleransi (Menit)
                </label>
                <Input
                  id="alarm-grace-minutes"
                  type="number"
                  min={0}
                  max={120}
                  value={settings.grace_minutes}
                  disabled={!isAdmin}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      grace_minutes: Math.max(
                        0,
                        Math.min(120, Number(e.target.value) || 0)
                      ),
                    }))
                  }
                  className="bg-tunet-bg border-tunet-border text-tunet-text font-mono-data"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-tunet-text">
                Hari Kerja Aktif
              </p>
              <div className="flex flex-wrap gap-1.5">
                {DAY_LABELS.map(({ day, short }) => {
                  const active = settings.active_days.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => toggleDay(day)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                        active
                          ? "bg-tunet-green/20 border-tunet-green/50 text-tunet-green"
                          : "bg-tunet-bg border-tunet-border text-tunet-text-muted",
                        !isAdmin && "opacity-75 cursor-default"
                      )}
                    >
                      {short}
                    </button>
                  );
                })}
              </div>
            </div>

            {isAdmin && (
              <>
                <Separator className="bg-tunet-border" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-tunet-text">
                      Suara Alarm di Aplikasi Web
                    </p>
                    <p className="text-xs text-tunet-text-muted">
                      Memutar nada alarm berulang di browser jika belum absen
                    </p>
                  </div>
                  <Switch
                    id="alarm-sound-enabled"
                    checked={settings.sound_enabled}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        sound_enabled: checked,
                      }))
                    }
                    aria-label="Suara Alarm di Aplikasi Web"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-tunet-text">
                      Pengingat Otomatis Bot Telegram
                    </p>
                    <p className="text-xs text-tunet-text-muted">
                      Kirim pesan Telegram ke karyawan yang belum absen (membutuhkan bot Telegram aktif)
                    </p>
                  </div>
                  <Switch
                    id="alarm-telegram-enabled"
                    checked={settings.telegram_enabled}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        telegram_enabled: checked,
                      }))
                    }
                    aria-label="Pengingat Otomatis Bot Telegram"
                  />
                </div>
              </>
            )}

            <Separator className="bg-tunet-border" />

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestSound}
                className="border-tunet-border text-tunet-text"
              >
                <Volume2 className="w-3.5 h-3.5 mr-1.5" />
                Uji Suara Alarm
              </Button>

              {notifPerm !== "unsupported" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleEnableBrowserNotif}
                  disabled={notifPerm === "granted"}
                  className="border-tunet-border text-tunet-text"
                >
                  {notifPerm === "granted" ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-tunet-green" />
                      Notifikasi Browser Aktif
                    </>
                  ) : (
                    <>
                      <Bell className="w-3.5 h-3.5 mr-1.5" />
                      Izinkan Notifikasi Browser
                    </>
                  )}
                </Button>
              )}

              {isAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTriggerTelegram}
                  disabled={triggering}
                  className="border-tunet-border text-tunet-text"
                >
                  {triggering ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Kirim Pengingat Telegram Sekarang
                </Button>
              )}

              {isAdmin && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="ml-auto bg-tunet-green hover:bg-tunet-green-dark text-white"
                >
                  {saving ? "Menyimpan..." : "Simpan Jam Absen"}
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
