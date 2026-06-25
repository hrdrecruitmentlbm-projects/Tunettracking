"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { fetchVisitLogs, createVisitLog, fetchProspects, fetchTowerSites, updateProspect, updateTowerSite, upsertLocation } from "@/lib/db";
import { VisitLog, Prospect, TowerSite, PROSPECT_STATUS_CONFIG, TOWER_SITE_STATUS_CONFIG } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ClipboardCheck, Plus, MapPin, Navigation, RefreshCw } from "lucide-react";
import { COPY } from "@/lib/copy";
import { toast } from "sonner";

export default function KunjunganPage() {
  return (
    <Suspense fallback={null}>
      <KunjunganContent />
    </Suspense>
  );
}

function KunjunganContent() {
  const [visits, setVisits] = useState<VisitLog[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [towerSites, setTowerSites] = useState<TowerSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"prospek" | "tower">("prospek");
  const [formOpen, setFormOpen] = useState(false);
  const [currentUser, setCurrentUserId] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("tutrack-user");
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentUserId(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    async function load() {
      const [v, p, t] = await Promise.all([
        fetchVisitLogs(),
        fetchProspects(),
        fetchTowerSites(),
      ]);
      setVisits(v);
      setProspects(p);
      setTowerSites(t);
      setLoading(false);
    }
    load();
  }, []);

  const filteredVisits = useMemo(
    () => visits.filter((v) => v.type === activeTab),
    [visits, activeTab]
  );

  const handleSaved = async () => {
    const fresh = await fetchVisitLogs();
    setVisits(fresh);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <KunjunganSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-tunet-bg pb-20 md:pb-0">
        <div className="h-16 border-b border-tunet-border flex items-center justify-between px-4 md:px-6 pl-16 md:pl-6">
          <div>
            <Breadcrumbs items={[{ label: "Marketing", href: "/dashboard/marketing" }, { label: "Kunjungan" }]} className="mb-1" />
            <h1 className="text-lg font-semibold text-tunet-text">{COPY.pages.kunjungan.title}</h1>
            <p className="text-xs text-tunet-text-muted">{COPY.pages.kunjungan.subtitle}</p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="bg-tunet-green hover:bg-tunet-green-dark text-white">
            <Plus className="w-4 h-4 mr-2" />
            {COPY.pages.kunjungan.logVisit}
          </Button>
        </div>

        <div className="p-4 md:p-6 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("prospek")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "prospek"
                  ? "bg-tunet-green/20 text-tunet-green"
                  : "text-tunet-text-muted hover:bg-tunet-surface-hover"
              }`}
            >
              {COPY.pages.kunjungan.tabProspek}
            </button>
            <button
              onClick={() => setActiveTab("tower")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "tower"
                  ? "bg-tunet-green/20 text-tunet-green"
                  : "text-tunet-text-muted hover:bg-tunet-surface-hover"
              }`}
            >
              {COPY.pages.kunjungan.tabTower}
            </button>
          </div>

          {/* Visit List */}
          {filteredVisits.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={ClipboardCheck}
                title={COPY.pages.kunjungan.empty.title}
                description={COPY.pages.kunjungan.empty.description}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVisits.map((visit) => {
                const isProspek = visit.type === "prospek";
                const statusConfig = isProspek
                  ? PROSPECT_STATUS_CONFIG[visit.status_snapshot as keyof typeof PROSPECT_STATUS_CONFIG]
                  : TOWER_SITE_STATUS_CONFIG[visit.status_snapshot as keyof typeof TOWER_SITE_STATUS_CONFIG];

                return (
                  <Card key={visit.id} className="bg-tunet-surface border-tunet-border">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isProspek ? "bg-blue-500/20" : "bg-amber-500/20"
                        }`}>
                          {isProspek ? (
                            <ClipboardCheck className="w-5 h-5 text-blue-400" />
                          ) : (
                            <ClipboardCheck className="w-5 h-5 text-amber-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-tunet-text">
                              {isProspek
                                ? visit.prospect?.name || "Prospek"
                                : visit.tower?.name || "Tower Site"}
                            </p>
                            <Badge
                              variant="secondary"
                              className="text-xs"
                              style={{
                                backgroundColor: statusConfig?.color + "20",
                                color: statusConfig?.color,
                              }}
                            >
                              {statusConfig?.label || visit.status_snapshot}
                            </Badge>
                          </div>
                          <p className="text-xs text-tunet-text-muted mb-2">{visit.notes}</p>
                          <div className="flex items-center gap-4 text-xs text-tunet-text-muted">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span className="font-mono">
                                {visit.location_lat.toFixed(4)}, {visit.location_lng.toFixed(4)}
                              </span>
                            </div>
                            <span>{new Date(visit.created_at).toLocaleString("id-ID")}</span>
                            <span>Oleh: {visit.visitor?.name || "-"}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <VisitForm
          open={formOpen}
          onOpenChange={setFormOpen}
          prospects={prospects}
          towerSites={towerSites}
          onSaved={handleSaved}
          currentUser={currentUser}
        />
      </div>
    </DashboardLayout>
  );
}

function VisitForm({
  open,
  onOpenChange,
  prospects,
  towerSites,
  onSaved,
  currentUser,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospects: Prospect[];
  towerSites: TowerSite[];
  onSaved: () => void;
  currentUser: { id: string; name: string } | null;
}) {
  const [type, setType] = useState<"prospek" | "tower">("prospek");
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setType("prospek");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedId("");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotes("");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocation(null);
    }
  }, [open]);

  const shareLocation = useCallback(async () => {
    setGettingLocation(true);
    return new Promise<boolean>((resolve) => {
      if (!("geolocation" in navigator)) {
        toast.error(COPY.toasts.geolocationUnsupported);
        setGettingLocation(false);
        resolve(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setGettingLocation(false);
          resolve(true);
        },
        (error) => {
          console.error("GPS error:", error);
          toast.error(COPY.toasts.geolocationDenied);
          setGettingLocation(false);
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!location) {
      const ok = await shareLocation();
      if (!ok) {
        toast.error(COPY.pages.kunjungan.locationRequired);
        return;
      }
    }

    if (!selectedId || !status) {
      toast.error("Pilih item dan status wajib diisi");
      return;
    }

    setSaving(true);
    try {
      const loc = location || { lat: -6.2088, lng: 106.8456 };
      const result = await createVisitLog({
        type,
        prospect_id: type === "prospek" ? selectedId : undefined,
        tower_id: type === "tower" ? selectedId : undefined,
        visited_by: currentUser.id,
        status_snapshot: status,
        notes,
        location_lat: loc.lat,
        location_lng: loc.lng,
      });

      if (result.data) {
        // Update the prospect/tower status
        if (type === "prospek") {
          await updateProspect(selectedId, { status });
        } else {
          await updateTowerSite(selectedId, { status });
        }

        // Update location
        await upsertLocation(currentUser.id, loc.lat, loc.lng);

        toast.success(COPY.pages.kunjungan.saved);
        onSaved();
        onOpenChange(false);
      } else {
        toast.error(result.error || COPY.pages.kunjungan.failedSave);
      }
    } finally {
      setSaving(false);
    }
  };

  const items = type === "prospek" ? prospects : towerSites;
  const statusConfig = type === "prospek" ? PROSPECT_STATUS_CONFIG : TOWER_SITE_STATUS_CONFIG;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-tunet-surface border-tunet-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-tunet-text">{COPY.pages.kunjungan.logVisit}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setType("prospek"); setSelectedId(""); setStatus(""); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                type === "prospek"
                  ? "bg-tunet-green/20 text-tunet-green"
                  : "text-tunet-text-muted hover:bg-tunet-surface-hover"
              }`}
            >
              {COPY.pages.kunjungan.tabProspek}
            </button>
            <button
              type="button"
              onClick={() => { setType("tower"); setSelectedId(""); setStatus(""); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                type === "tower"
                  ? "bg-tunet-green/20 text-tunet-green"
                  : "text-tunet-text-muted hover:bg-tunet-surface-hover"
              }`}
            >
              {COPY.pages.kunjungan.tabTower}
            </button>
          </div>

          <div>
            <label htmlFor="visit-item" className="text-sm font-medium text-tunet-text">{COPY.pages.kunjungan.selectItem}</label>
            {items.length === 0 ? (
              <p className="mt-1 text-sm text-tunet-text-muted">Tidak ada data tersedia</p>
            ) : (
              <select
                id="visit-item"
                aria-label="Status kunjungan"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-tunet-bg border border-tunet-border rounded-md text-sm text-tunet-text"
              >
                <option value="">Pilih...</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label htmlFor="visit-status" className="text-sm font-medium text-tunet-text">{COPY.pages.kunjungan.selectStatus}</label>
            <Select id="visit-status" value={status} onValueChange={(v) => setStatus(v || "")}>
              <SelectTrigger id="visit-status" className="mt-1 bg-tunet-bg border-tunet-border text-tunet-text">
                <SelectValue placeholder="Pilih..." />
              </SelectTrigger>
              <SelectContent className="bg-tunet-surface border-tunet-border">
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="visit-notes" className="text-sm font-medium text-tunet-text">{COPY.pages.kunjungan.notes}</label>
            <Input
              id="visit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={COPY.pages.kunjungan.notesPlaceholder}
              className="mt-1 bg-tunet-bg border-tunet-border text-tunet-text"
            />
          </div>

          <div className="p-3 rounded-lg bg-tunet-bg border border-tunet-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-tunet-text-muted" />
                <span className="text-sm text-tunet-text">
                  {location
                    ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
                    : COPY.pages.kunjungan.locationRequired}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={shareLocation}
                disabled={gettingLocation}
                className="border-tunet-border text-tunet-text"
              >
                {gettingLocation ? (
                  <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5 mr-1" />
                )}
                {COPY.pages.kunjungan.shareLocation}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-tunet-border text-tunet-text">
              {COPY.actions.cancel}
            </Button>
            <Button type="submit" disabled={saving} className="bg-tunet-green hover:bg-tunet-green-dark text-white">
              {saving ? "Menyimpan..." : COPY.actions.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function KunjunganSkeleton() {
  return (
    <div className="min-h-screen bg-tunet-bg pb-20 md:pb-0">
      <div className="h-16 border-b border-tunet-border flex items-center justify-between px-4 md:px-6 pl-16 md:pl-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-44" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="p-4 md:p-6 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-tunet-border bg-tunet-surface p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
