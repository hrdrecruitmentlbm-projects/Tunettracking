"use client";

import { useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { UserRole } from "@/types";

const PRESET_MINUTES = [1, 2, 5, 10, 15];

interface LocationTrackingSettingsCardProps {
  role?: UserRole;
}

export function LocationTrackingSettingsCard({
  role,
}: LocationTrackingSettingsCardProps) {
  const isAdmin = role === "admin";
  const [intervalMinutes, setIntervalMinutes] = useState<number>(2);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/location/settings", {
          cache: "no-store",
        });
        if (res.ok && !cancelled) {
          const json = (await res.json()) as {
            settings?: { interval_minutes?: number };
          };
          const mins = json.settings?.interval_minutes;
          if (typeof mins === "number" && mins >= 1 && mins <= 60) {
            setIntervalMinutes(mins);
            localStorage.setItem(
              "tutrack-location-interval-minutes",
              String(mins)
            );
          }
        }
      } catch {
        const cached = Number(
          localStorage.getItem("tutrack-location-interval-minutes")
        );
        if (!cancelled && Number.isInteger(cached) && cached >= 1 && cached <= 60) {
          setIntervalMinutes(cached);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    const mins = Math.round(intervalMinutes);
    if (!Number.isInteger(mins) || mins < 1 || mins > 60) {
      toast.error("Masukkan interval antara 1 sampai 60 menit");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/location/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval_minutes: mins }),
      });
      const json = (await res.json()) as {
        error?: string;
        settings?: { interval_minutes: number };
      };
      if (!res.ok) {
        toast.error(json.error || "Gagal menyimpan interval pelacakan GPS");
        return;
      }

      const savedMins = json.settings?.interval_minutes ?? mins;
      setIntervalMinutes(savedMins);
      localStorage.setItem(
        "tutrack-location-interval-minutes",
        String(savedMins)
      );
      window.dispatchEvent(
        new CustomEvent("tutrack-location-settings-updated", {
          detail: { interval_minutes: savedMins },
        })
      );
      toast.success(`Interval pelacakan GPS disimpan (${savedMins} menit)`);
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-tunet-surface border-tunet-border">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-tunet-signal/15 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-tunet-signal" />
          </div>
          <div>
            <CardTitle className="text-tunet-text">
              Interval Pelacakan GPS Lapangan
            </CardTitle>
            <CardDescription>
              Atur berapa menit sekali posisi karyawan (FOC &amp; Marketing) dikirim otomatis saat aplikasi dibuka
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 py-2 text-xs text-tunet-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Memuat pengaturan interval GPS...
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label
                htmlFor="gps-interval-minutes"
                className="text-xs text-tunet-text-muted"
              >
                Interval Kirim Lokasi (Menit)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  id="gps-interval-minutes"
                  type="number"
                  min={1}
                  max={60}
                  disabled={!isAdmin}
                  value={intervalMinutes}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setIntervalMinutes(Number.isNaN(val) ? 2 : val);
                  }}
                  className="w-28 bg-tunet-bg border-tunet-border text-tunet-text font-mono"
                />
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_MINUTES.map((mins) => {
                    const active = intervalMinutes === mins;
                    return (
                      <button
                        key={mins}
                        type="button"
                        disabled={!isAdmin}
                        onClick={() => setIntervalMinutes(mins)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                          active
                            ? "bg-tunet-green/20 border-tunet-green text-tunet-green"
                            : "bg-tunet-bg border-tunet-border text-tunet-text-muted hover:text-tunet-text",
                          !isAdmin && "cursor-not-allowed opacity-70"
                        )}
                      >
                        {mins} mnt
                      </button>
                    );
                  })}
                </div>
              </div>
              <p className="text-[11px] leading-relaxed text-tunet-text-muted">
                Pelacakan aktif otomatis saat karyawan membuka aplikasi dan berhenti otomatis jika aplikasi ditutup atau layar HP mati. Izin GPS cukup diberikan sekali saat absen.
              </p>
            </div>

            {isAdmin && (
              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-tunet-green hover:bg-tunet-green-dark text-white"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Interval GPS"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
