"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { fetchProspects, fetchTowerSites, fetchUsers, fetchVisitLogs } from "@/lib/db";
import { formatTimeWIB, getWibDateString } from "@/lib/time";
import { useProspectStatuses } from "@/hooks/use-prospect-statuses";
import { isClosingStatus } from "@/lib/marketing-closing";
import { Prospect, TowerSite, User, VisitLog } from "@/types";
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Download,
  ExternalLink,
  MapPin,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

type RangePreset = "all" | "today" | "yesterday" | "7d" | "30d" | "month" | "custom";
type TypeFilter = "all" | "prospek" | "tower";

interface DayBreakdown {
  date: string;
  total: number;
  prospek: number;
  tower: number;
  closing: number;
  visitors: Array<{ id: string; name: string; count: number }>;
}

interface VisitorSummary {
  id: string;
  name: string;
  role?: string;
  today: number;
  yesterday: number;
  last7d: number;
  closing: number;
  total: number;
}

function addDaysToWibDate(baseYmd: string, deltaDays: number): string {
  const [year, month, day] = baseYmd.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day + deltaDays, 12, 0, 0));
  return getWibDateString(d);
}

function getVisitorKey(id?: string | null, name?: string | null): string {
  const cleanName = (name || "").trim().toLowerCase();
  if (cleanName) return `name:${cleanName}`;
  return `id:${id || "unknown"}`;
}

function formatShortDayLabel(dateStr: string): string {
  const iso = `${dateStr}T12:00:00+07:00`;
  return new Date(iso).toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminKunjunganPage() {
  const [visits, setVisits] = useState<VisitLog[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [towerSites, setTowerSites] = useState<TowerSite[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [rangePreset, setRangePreset] = useState<RangePreset>("all");
  const [customDate, setCustomDate] = useState<string>("");
  const [visitorFilter, setVisitorFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [closingOnly, setClosingOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedVisit, setSelectedVisit] = useState<VisitLog | null>(null);

  const { statuses: prospectStatuses, getConfig: getProspectStatusConfig } = useProspectStatuses();

  useEffect(() => {
    let active = true;
    async function loadInitial() {
      try {
        const [v, p, t, u] = await Promise.all([
          fetchVisitLogs({ limit: 2000 }),
          fetchProspects(),
          fetchTowerSites(),
          fetchUsers(),
        ]);
        if (!active) return;
        setVisits(v);
        setProspects(p);
        setTowerSites(t);
        setUsers(u);
      } catch (err) {
        console.error("Failed to load visit recap:", err);
        toast.error("Gagal memuat rekap kunjungan");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadInitial();
    return () => {
      active = false;
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [v, p, t, u] = await Promise.all([
        fetchVisitLogs({ limit: 2000 }),
        fetchProspects(),
        fetchTowerSites(),
        fetchUsers(),
      ]);
      setVisits(v);
      setProspects(p);
      setTowerSites(t);
      setUsers(u);
      toast.success("Data kunjungan diperbarui");
    } catch (err) {
      console.error("Failed to refresh visit recap:", err);
      toast.error("Gagal menyegarkan data kunjungan");
    } finally {
      setRefreshing(false);
    }
  }, []);

  const todayWib = useMemo(() => getWibDateString(), []);
  const yesterdayWib = useMemo(() => addDaysToWibDate(todayWib, -1), [todayWib]);
  const sevenDaysAgoWib = useMemo(() => addDaysToWibDate(todayWib, -6), [todayWib]);
  const thirtyDaysAgoWib = useMemo(() => addDaysToWibDate(todayWib, -29), [todayWib]);
  const monthStartWib = useMemo(() => `${todayWib.slice(0, 7)}-01`, [todayWib]);

  // Base scope filtered by visitor, type, closingOnly, and search (used to build daily breakdown & KPIs)
  const scopedVisits = useMemo(() => {
    const q = search.toLowerCase().trim();
    return visits.filter((v) => {
      if (
        visitorFilter !== "all" &&
        getVisitorKey(v.visited_by, v.visitor?.name) !== visitorFilter
      ) {
        return false;
      }
      if (typeFilter !== "all" && v.type !== typeFilter) return false;
      if (closingOnly && !isClosingStatus(v.status_snapshot, prospectStatuses)) {
        return false;
      }
      if (!q) return true;
      const targetName =
        v.type === "prospek" ? v.prospect?.name || "" : v.tower?.name || "";
      return (
        targetName.toLowerCase().includes(q) ||
        (v.notes || "").toLowerCase().includes(q) ||
        (v.visitor?.name || "").toLowerCase().includes(q) ||
        (v.status_snapshot || "").toLowerCase().includes(q)
      );
    });
  }, [visits, visitorFilter, typeFilter, closingOnly, prospectStatuses, search]);

  const matchesDateRange = useCallback(
    (d: string) => {
      if (!d) return false;
      switch (rangePreset) {
        case "today":
          return d === todayWib;
        case "yesterday":
          return d === yesterdayWib;
        case "7d":
          return d >= sevenDaysAgoWib && d <= todayWib;
        case "30d":
          return d >= thirtyDaysAgoWib && d <= todayWib;
        case "month":
          return d >= monthStartWib && d <= todayWib;
        case "custom":
          return customDate ? d === customDate : true;
        case "all":
        default:
          return true;
      }
    },
    [
      rangePreset,
      customDate,
      todayWib,
      yesterdayWib,
      sevenDaysAgoWib,
      thirtyDaysAgoWib,
      monthStartWib,
    ]
  );

  const activeRangeLabel = useMemo(() => {
    switch (rangePreset) {
      case "today":
        return "Hari Ini";
      case "yesterday":
        return "Kemarin";
      case "7d":
        return "7 Hari Terakhir";
      case "30d":
        return "30 Hari Terakhir";
      case "month":
        return "Bulan Ini";
      case "custom":
        return customDate ? formatShortDayLabel(customDate) : "Tanggal Tertentu";
      case "all":
      default:
        return "Semua Hari";
    }
  }, [rangePreset, customDate]);

  // Apply date preset / custom date to detail table
  const dateFilteredVisits = useMemo(() => {
    return scopedVisits.filter((v) =>
      matchesDateRange(getWibDateString(v.created_at))
    );
  }, [scopedVisits, matchesDateRange]);

  // KPI metrics (Hari Ini / Kemarin / 7 Hari from scopedVisits; Closing & Total Tercatat follow active date range)
  const kpi = useMemo(() => {
    let todayTotal = 0;
    let todayProspek = 0;
    let todayTower = 0;
    let yesterdayTotal = 0;
    let last7dTotal = 0;

    for (const v of scopedVisits) {
      const d = getWibDateString(v.created_at);
      if (!d) continue;
      if (d === todayWib) {
        todayTotal += 1;
        if (v.type === "prospek") todayProspek += 1;
        else todayTower += 1;
      }
      if (d === yesterdayWib) {
        yesterdayTotal += 1;
      }
      if (d >= sevenDaysAgoWib && d <= todayWib) {
        last7dTotal += 1;
      }
    }

    let closingVisits = 0;
    const activeDates = new Set<string>();
    for (const v of dateFilteredVisits) {
      const d = getWibDateString(v.created_at);
      if (d) activeDates.add(d);
      if (isClosingStatus(v.status_snapshot, prospectStatuses)) {
        closingVisits += 1;
      }
    }

    const closingProspectsCount =
      typeFilter === "tower"
        ? 0
        : prospects.filter((p) => {
            if (!isClosingStatus(p.status, prospectStatuses)) return false;
            if (
              visitorFilter !== "all" &&
              getVisitorKey(p.assigned_to, p.assignee?.name) !== visitorFilter
            ) {
              return false;
            }
            if (rangePreset === "all") return true;
            const d = getWibDateString(p.updated_at || p.created_at);
            return matchesDateRange(d);
          }).length;

    const closingTowersCount =
      typeFilter === "prospek"
        ? 0
        : towerSites.filter((t) => {
            if (!isClosingStatus(t.status)) return false;
            if (
              visitorFilter !== "all" &&
              getVisitorKey(t.assigned_to, t.assignee?.name) !== visitorFilter
            ) {
              return false;
            }
            if (rangePreset === "all") return true;
            const d = getWibDateString(t.updated_at || t.created_at);
            return matchesDateRange(d);
          }).length;

    return {
      todayTotal,
      todayProspek,
      todayTower,
      yesterdayTotal,
      deltaTodayVsYesterday: todayTotal - yesterdayTotal,
      last7dTotal,
      avgPerDay7d: (last7dTotal / 7).toFixed(1),
      totalAll: dateFilteredVisits.length,
      activeDaysCount: activeDates.size,
      closingTargets: closingProspectsCount + closingTowersCount,
      closingProspects: closingProspectsCount,
      closingTowers: closingTowersCount,
      closingVisits,
    };
  }, [
    scopedVisits,
    dateFilteredVisits,
    prospects,
    towerSites,
    prospectStatuses,
    typeFilter,
    visitorFilter,
    rangePreset,
    matchesDateRange,
    todayWib,
    yesterdayWib,
    sevenDaysAgoWib,
  ]);

  // Daily breakdown: includes Today & Yesterday unless filtering by Hanya Closing or search
  const dailyBreakdown = useMemo<DayBreakdown[]>(() => {
    const byDate = new Map<
      string,
      {
        total: number;
        prospek: number;
        tower: number;
        closing: number;
        visitors: Map<string, { name: string; count: number }>;
      }
    >();

    const ensureDate = (date: string) => {
      let entry = byDate.get(date);
      if (!entry) {
        entry = { total: 0, prospek: 0, tower: 0, closing: 0, visitors: new Map() };
        byDate.set(date, entry);
      }
      return entry;
    };

    if (!closingOnly && search.trim() === "") {
      if (rangePreset === "all" || rangePreset === "7d" || rangePreset === "30d" || rangePreset === "month") {
        ensureDate(todayWib);
        ensureDate(yesterdayWib);
      } else if (rangePreset === "today") {
        ensureDate(todayWib);
      } else if (rangePreset === "yesterday") {
        ensureDate(yesterdayWib);
      } else if (rangePreset === "custom" && customDate) {
        ensureDate(customDate);
      }
    }

    for (const v of dateFilteredVisits) {
      const d = getWibDateString(v.created_at);
      if (!d) continue;
      const entry = ensureDate(d);
      entry.total += 1;
      if (v.type === "prospek") entry.prospek += 1;
      else entry.tower += 1;
      if (isClosingStatus(v.status_snapshot, prospectStatuses)) {
        entry.closing += 1;
      }

      const vName = (v.visitor?.name || "Tidak diketahui").trim();
      const vKey = getVisitorKey(v.visited_by, v.visitor?.name);
      const existing = entry.visitors.get(vKey);
      if (existing) {
        existing.count += 1;
      } else {
        entry.visitors.set(vKey, { name: vName, count: 1 });
      }
    }

    return Array.from(byDate.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, info]) => ({
        date,
        total: info.total,
        prospek: info.prospek,
        tower: info.tower,
        closing: info.closing,
        visitors: Array.from(info.visitors.entries())
          .map(([id, val]) => ({ id, name: val.name, count: val.count }))
          .sort((a, b) => b.count - a.count),
      }));
  }, [
    dateFilteredVisits,
    rangePreset,
    customDate,
    closingOnly,
    search,
    todayWib,
    yesterdayWib,
    prospectStatuses,
  ]);

  const maxDailyCount = useMemo(
    () => Math.max(1, ...dailyBreakdown.map((d) => d.total)),
    [dailyBreakdown]
  );

  // Per-visitor breakdown (respects active date range, typeFilter, closingOnly, search, and merges duplicate names)
  const visitorBreakdown = useMemo<VisitorSummary[]>(() => {
    const map = new Map<string, VisitorSummary>();

    // Seed active marketing users so zero-visit staff still appear
    for (const u of users) {
      if (u.is_active !== false && u.role === "marketing") {
        const key = getVisitorKey(u.id, u.name);
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            name: u.name.trim(),
            role: u.role,
            today: 0,
            yesterday: 0,
            last7d: 0,
            closing: 0,
            total: 0,
          });
        }
      }
    }

    const q = search.toLowerCase().trim();
    for (const v of visits) {
      if (typeFilter !== "all" && v.type !== typeFilter) continue;
      if (closingOnly && !isClosingStatus(v.status_snapshot, prospectStatuses)) {
        continue;
      }
      if (q) {
        const targetName =
          v.type === "prospek" ? v.prospect?.name || "" : v.tower?.name || "";
        const matchesQuery =
          targetName.toLowerCase().includes(q) ||
          (v.notes || "").toLowerCase().includes(q) ||
          (v.visitor?.name || "").toLowerCase().includes(q) ||
          (v.status_snapshot || "").toLowerCase().includes(q);
        if (!matchesQuery) continue;
      }

      const name = (v.visitor?.name || "Tidak diketahui").trim();
      const key = getVisitorKey(v.visited_by, v.visitor?.name);
      let entry = map.get(key);
      if (!entry) {
        entry = {
          id: key,
          name,
          role: v.visitor?.role,
          today: 0,
          yesterday: 0,
          last7d: 0,
          closing: 0,
          total: 0,
        };
        map.set(key, entry);
      }

      const d = getWibDateString(v.created_at);
      if (matchesDateRange(d)) {
        entry.total += 1;
      }
      if (d === todayWib) entry.today += 1;
      if (d === yesterdayWib) entry.yesterday += 1;
      if (d >= sevenDaysAgoWib && d <= todayWib) entry.last7d += 1;
    }

    // Add closing target count (Prospects + Tower Sites in Closing/ACC status) matching active date range
    if (typeFilter !== "tower") {
      for (const p of prospects) {
        if (!isClosingStatus(p.status, prospectStatuses)) continue;
        if (
          rangePreset !== "all" &&
          !matchesDateRange(getWibDateString(p.updated_at || p.created_at))
        ) {
          continue;
        }
        const name = (p.assignee?.name || "Belum Ditugaskan").trim();
        const key = getVisitorKey(p.assigned_to, p.assignee?.name);
        const entry = map.get(key) || {
          id: key,
          name,
          role: p.assignee?.role,
          today: 0,
          yesterday: 0,
          last7d: 0,
          closing: 0,
          total: 0,
        };
        entry.closing += 1;
        map.set(key, entry);
      }
    }
    if (typeFilter !== "prospek") {
      for (const t of towerSites) {
        if (!isClosingStatus(t.status)) continue;
        if (
          rangePreset !== "all" &&
          !matchesDateRange(getWibDateString(t.updated_at || t.created_at))
        ) {
          continue;
        }
        const name = (t.assignee?.name || "Belum Ditugaskan").trim();
        const key = getVisitorKey(t.assigned_to, t.assignee?.name);
        const entry = map.get(key) || {
          id: key,
          name,
          role: t.assignee?.role,
          today: 0,
          yesterday: 0,
          last7d: 0,
          closing: 0,
          total: 0,
        };
        entry.closing += 1;
        map.set(key, entry);
      }
    }

    return Array.from(map.values()).sort(
      (a, b) =>
        b.total - a.total ||
        b.closing - a.closing ||
        b.today - a.today ||
        b.last7d - a.last7d
    );
  }, [
    visits,
    prospects,
    towerSites,
    users,
    typeFilter,
    closingOnly,
    search,
    rangePreset,
    matchesDateRange,
    prospectStatuses,
    todayWib,
    yesterdayWib,
    sevenDaysAgoWib,
  ]);

  // Unique visitors for dropdown filter (deduplicated by normalized name)
  const visitorOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const u of users) {
      if (u.is_active !== false && u.role === "marketing") {
        const key = getVisitorKey(u.id, u.name);
        if (!seen.has(key)) seen.set(key, u.name.trim());
      }
    }
    for (const v of visits) {
      if (v.visitor?.name) {
        const key = getVisitorKey(v.visited_by, v.visitor.name);
        if (!seen.has(key)) seen.set(key, v.visitor.name.trim());
      }
    }
    return Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [visits, users]);

  const selectedVisitorLabel = useMemo(() => {
    if (visitorFilter === "all") return "Semua Petugas";
    return visitorOptions.find((u) => u.id === visitorFilter)?.name || "Semua Petugas";
  }, [visitorFilter, visitorOptions]);

  const handleSelectDay = (date: string) => {
    if (rangePreset === "custom" && customDate === date) {
      setRangePreset("all");
      setCustomDate("");
    } else {
      setRangePreset("custom");
      setCustomDate(date);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Tanggal (WIB)",
      "Jam (WIB)",
      "Tipe",
      "Nama Lokasi/Prospek",
      "Status",
      "Catatan",
      "Latitude",
      "Longitude",
      "Petugas",
    ];
    const rows = dateFilteredVisits.map((v) => {
      const targetName =
        (v.type === "prospek" ? v.prospect?.name : v.tower?.name) || "-";
      const statusLabel =
        v.type === "prospek"
          ? getProspectStatusConfig(v.status_snapshot).label
          : v.status_snapshot;
      return [
        `"${getWibDateString(v.created_at)}"`,
        `"${formatTimeWIB(v.created_at)}"`,
        `"${v.type === "prospek" ? "Prospek" : "Tower"}"`,
        `"${targetName.replace(/"/g, '""')}"`,
        `"${statusLabel.replace(/"/g, '""')}"`,
        `"${(v.notes || "").replace(/"/g, '""')}"`,
        `"${v.location_lat}"`,
        `"${v.location_lng}"`,
        `"${(v.visitor?.name || "-").replace(/"/g, '""')}"`,
      ].join(",");
    });

    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rekap_kunjungan_${todayWib}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Berhasil mengunduh ${dateFilteredVisits.length} data kunjungan`);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-tunet-bg">
        {/* Header */}
        <div className="min-h-16 border-b border-tunet-border flex items-center justify-between px-4 sm:px-6 py-3 gap-3 flex-wrap">
          <div>
            <Breadcrumbs
              items={[
                { label: "Admin", href: "/dashboard/admin" },
                { label: "Rekap Kunjungan" },
              ]}
              className="mb-1"
            />
            <h1 className="text-lg font-semibold text-tunet-text">
              Rekap Kunjungan
            </h1>
            <p className="text-xs text-tunet-text-muted">
              Jumlah kunjungan hari ini dan hari-hari sebelumnya per tanggal & petugas
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tunet-text-muted" />
              <Input
                id="visit-recap-search"
                placeholder="Cari prospek, catatan, petugas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-56 sm:w-64 bg-tunet-surface border-tunet-border text-tunet-text h-9 text-xs"
              />
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              variant="outline"
              size="sm"
              className="border-tunet-border bg-tunet-surface text-tunet-text hover:bg-tunet-surface-hover h-9 text-xs"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`}
              />
              Segarkan
            </Button>
            <Button
              onClick={handleExportCSV}
              disabled={loading || dateFilteredVisits.length === 0}
              variant="outline"
              size="sm"
              className="border-tunet-border bg-tunet-surface text-tunet-text hover:bg-tunet-surface-hover h-9 text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-5 max-w-7xl">
          {/* KPI Summary Cards */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <Card className="bg-tunet-surface border-tunet-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-tunet-text-muted">
                        Kunjungan Hari Ini
                      </p>
                      <p className="text-2xl font-bold text-tunet-green mt-1 font-mono-data">
                        {kpi.todayTotal}
                      </p>
                      <p className="text-[11px] text-tunet-text-muted mt-1">
                        {kpi.todayProspek} Prospek · {kpi.todayTower} Tower
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-tunet-green/15 flex items-center justify-center shrink-0">
                      <ClipboardCheck className="w-5 h-5 text-tunet-green" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-tunet-surface border-tunet-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-tunet-text-muted">
                        Kunjungan Kemarin
                      </p>
                      <p className="text-2xl font-bold text-amber-400 mt-1 font-mono-data">
                        {kpi.yesterdayTotal}
                      </p>
                      <p className="text-[11px] text-tunet-text-muted mt-1">
                        Hari ini{" "}
                        {kpi.deltaTodayVsYesterday >= 0
                          ? `+${kpi.deltaTodayVsYesterday}`
                          : kpi.deltaTodayVsYesterday}{" "}
                        vs kemarin
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-amber-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-tunet-surface border-tunet-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-tunet-text-muted">
                        7 Hari Terakhir
                      </p>
                      <p className="text-2xl font-bold text-blue-400 mt-1 font-mono-data">
                        {kpi.last7dTotal}
                      </p>
                      <p className="text-[11px] text-tunet-text-muted mt-1">
                        Rata-rata {kpi.avgPerDay7d} / hari
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                onClick={() => setClosingOnly((prev) => !prev)}
                className={`bg-tunet-surface border-tunet-border cursor-pointer transition-colors hover:bg-tunet-surface-hover ${
                  closingOnly ? "ring-1 ring-emerald-500/60 border-emerald-500/40" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-tunet-text-muted">
                        Total Closing
                      </p>
                      <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono-data">
                        {kpi.closingTargets}
                      </p>
                      <p className="text-[11px] text-tunet-text-muted mt-1">
                        {kpi.closingProspects} Prospek · {kpi.closingTowers} Tower ({kpi.closingVisits} kunj.)
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-tunet-surface border-tunet-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-tunet-text-muted">
                        {rangePreset === "all" ? "Total Tercatat" : "Kunjungan di Rentang"}
                      </p>
                      <p className="text-2xl font-bold text-purple-400 mt-1 font-mono-data">
                        {kpi.totalAll}
                      </p>
                      <p className="text-[11px] text-tunet-text-muted mt-1">
                        {activeRangeLabel} · {kpi.activeDaysCount} hari aktif
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0">
                      <CalendarDays className="w-5 h-5 text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filter Bar */}
          <Card className="bg-tunet-surface border-tunet-border">
            <CardContent className="p-3.5 flex flex-wrap items-center gap-3">
              {/* Quick Date Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(
                  [
                    { key: "all", label: "Semua Hari" },
                    { key: "today", label: "Hari Ini" },
                    { key: "yesterday", label: "Kemarin" },
                    { key: "7d", label: "7 Hari" },
                    { key: "30d", label: "30 Hari" },
                    { key: "month", label: "Bulan Ini" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setRangePreset(item.key);
                      setCustomDate("");
                    }}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors border ${
                      rangePreset === item.key
                        ? "bg-tunet-green/20 text-tunet-green border-tunet-green/40"
                        : "bg-tunet-bg text-tunet-text-muted border-tunet-border hover:text-tunet-text"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Specific Date Picker */}
              <div className="flex items-center gap-1.5">
                <Input
                  type="date"
                  aria-label="Pilih tanggal spesifik"
                  value={customDate}
                  max={todayWib}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomDate(val);
                    setRangePreset(val ? "custom" : "all");
                  }}
                  className="h-8 w-38 bg-tunet-bg border-tunet-border text-tunet-text text-xs font-mono-data"
                />
                {rangePreset === "custom" && customDate && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomDate("");
                      setRangePreset("all");
                    }}
                    className="p-1.5 rounded-md border border-tunet-border bg-tunet-bg text-tunet-text-muted hover:text-tunet-text"
                    title="Reset tanggal"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="h-5 w-px bg-tunet-border hidden md:block" />

              {/* Visitor Filter */}
              <Select value={visitorFilter} onValueChange={(val) => setVisitorFilter(val ?? "all")}>
                <SelectTrigger className="w-44 h-8 bg-tunet-bg border-tunet-border text-tunet-text text-xs">
                  <SelectValue placeholder="Semua Petugas">
                    {selectedVisitorLabel}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-tunet-surface border-tunet-border">
                  <SelectItem value="all">Semua Petugas</SelectItem>
                  {visitorOptions.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Type + Closing Filter */}
              <div className="flex items-center gap-1.5 ml-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => setClosingOnly((prev) => !prev)}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors border ${
                    closingOnly
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : "bg-tunet-bg text-tunet-text-muted border-tunet-border hover:text-tunet-text"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Hanya Closing
                </button>
                {(
                  [
                    { key: "all", label: "Semua Tipe" },
                    { key: "prospek", label: "Prospek" },
                    { key: "tower", label: "Tower" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTypeFilter(t.key)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors border ${
                      typeFilter === t.key
                        ? "bg-tunet-surface-hover text-tunet-text border-tunet-text-muted/40"
                        : "bg-tunet-bg text-tunet-text-muted border-tunet-border hover:text-tunet-text"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Two-Column Breakdown: Per Tanggal + Per Petugas */}
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <Skeleton className="h-80 lg:col-span-7 rounded-xl" />
              <Skeleton className="h-80 lg:col-span-5 rounded-xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Daily Breakdown */}
              <Card className="bg-tunet-surface border-tunet-border lg:col-span-7">
                <CardHeader className="pb-3 border-b border-tunet-border">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm font-semibold text-tunet-text flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-tunet-green" />
                        Kunjungan Per Hari
                      </CardTitle>
                      <p className="text-[11px] text-tunet-text-muted mt-0.5">
                        Klik tanggal untuk melihat detail kunjungan di hari tersebut
                      </p>
                    </div>
                    <span className="text-xs text-tunet-text-muted font-mono-data">
                      {dailyBreakdown.length} hari
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-0 max-h-[380px] overflow-y-auto divide-y divide-tunet-border">
                  {dailyBreakdown.length === 0 ? (
                    <div className="p-8 text-center text-xs text-tunet-text-muted">
                      Tidak ada data kunjungan pada filter ini.
                    </div>
                  ) : (
                    dailyBreakdown.map((day) => {
                      const isToday = day.date === todayWib;
                      const isYesterday = day.date === yesterdayWib;
                      const isSelected =
                        rangePreset === "custom" && customDate === day.date;
                      const barPct =
                        day.total === 0
                          ? 0
                          : Math.max(6, Math.round((day.total / maxDailyCount) * 100));

                      return (
                        <button
                          key={day.date}
                          type="button"
                          onClick={() => handleSelectDay(day.date)}
                          className={`w-full text-left px-4 py-3 transition-colors hover:bg-tunet-surface-hover flex flex-col gap-2 ${
                            isSelected ? "bg-tunet-green/10" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-tunet-text">
                                {formatShortDayLabel(day.date)}
                              </span>
                              {isToday && (
                                <Badge className="bg-tunet-green/20 text-tunet-green border-tunet-green/30 text-[10px] px-1.5 py-0">
                                  Hari Ini
                                </Badge>
                              )}
                              {isYesterday && (
                                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0">
                                  Kemarin
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                              {day.closing > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[11px] font-medium">
                                  Closing {day.closing}
                                </span>
                              )}
                              {day.prospek > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 text-[11px]">
                                  Prospek {day.prospek}
                                </span>
                              )}
                              {day.tower > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 text-[11px]">
                                  Tower {day.tower}
                                </span>
                              )}
                              <span
                                className={`font-bold font-mono-data min-w-[54px] text-right ${
                                  day.total > 0 ? "text-tunet-text" : "text-tunet-text-muted"
                                }`}
                              >
                                {day.total} kunj.
                              </span>
                            </div>
                          </div>

                          {/* Proportional bar */}
                          <div className="w-full h-1.5 rounded-full bg-tunet-bg overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isToday ? "bg-tunet-green" : "bg-blue-400/80"
                              }`}
                              style={{ width: `${barPct}%` }}
                            />
                          </div>

                          {/* Active visitors that day */}
                          {day.visitors.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {day.visitors.map((vis) => (
                                <span
                                  key={vis.id}
                                  className="text-[11px] text-tunet-text-muted bg-tunet-bg border border-tunet-border rounded px-1.5 py-0.5"
                                >
                                  {vis.name}{" "}
                                  <span className="text-tunet-text font-mono-data">
                                    ({vis.count})
                                  </span>
                                </span>
                              ))}
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              {/* Per-Visitor Breakdown */}
              <Card className="bg-tunet-surface border-tunet-border lg:col-span-5">
                <CardHeader className="pb-3 border-b border-tunet-border">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm font-semibold text-tunet-text flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-400" />
                        Kunjungan Per Petugas
                      </CardTitle>
                      <p className="text-[11px] text-tunet-text-muted mt-0.5">
                        Periode: {activeRangeLabel}
                        {closingOnly ? " · Hanya Closing" : ""}
                        {typeFilter !== "all"
                          ? ` · Tipe ${typeFilter === "prospek" ? "Prospek" : "Tower"}`
                          : ""}
                      </p>
                    </div>
                    {visitorFilter !== "all" && (
                      <button
                        type="button"
                        onClick={() => setVisitorFilter("all")}
                        className="text-[11px] text-tunet-green hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0 max-h-[380px] overflow-y-auto">
                  {visitorBreakdown.length === 0 ? (
                    <div className="p-8 text-center text-xs text-tunet-text-muted">
                      Belum ada petugas tercatat.
                    </div>
                  ) : (
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-tunet-surface border-b border-tunet-border">
                        <tr className="text-tunet-text-muted">
                          <th className="text-left py-2.5 px-4 font-medium">Petugas</th>
                          <th className="text-right py-2.5 px-2 font-medium">Hari Ini</th>
                          <th className="text-right py-2.5 px-2 font-medium">Kemarin</th>
                          <th className="text-right py-2.5 px-2 font-medium">7 Hari</th>
                          <th className="text-right py-2.5 px-2 font-medium">Closing</th>
                          <th className="text-right py-2.5 px-4 font-medium">
                            {rangePreset === "all" ? "Total" : "Di Rentang"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-tunet-border">
                        {visitorBreakdown.map((v) => {
                          const active = visitorFilter === v.id;
                          return (
                            <tr
                              key={v.id}
                              onClick={() =>
                                setVisitorFilter(active ? "all" : v.id)
                              }
                              className={`cursor-pointer transition-colors hover:bg-tunet-surface-hover ${
                                active ? "bg-tunet-green/10" : ""
                              }`}
                            >
                              <td className="py-2.5 px-4 font-medium text-tunet-text">
                                {v.name}
                              </td>
                              <td
                                className={`py-2.5 px-2 text-right font-mono-data font-semibold ${
                                  v.today > 0 ? "text-tunet-green" : "text-tunet-text-muted"
                                }`}
                              >
                                {v.today}
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono-data text-tunet-text-muted">
                                {v.yesterday}
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono-data text-blue-400">
                                {v.last7d}
                              </td>
                              <td
                                className={`py-2.5 px-2 text-right font-mono-data font-semibold ${
                                  v.closing > 0 ? "text-emerald-400" : "text-tunet-text-muted"
                                }`}
                              >
                                {v.closing}
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono-data text-tunet-text">
                                {v.total}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Detail Visit List */}
          <Card className="bg-tunet-surface border-tunet-border">
            <CardHeader className="pb-3 border-b border-tunet-border">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="text-sm font-semibold text-tunet-text">
                    Detail Daftar Kunjungan
                    {rangePreset !== "all" ? ` · ${activeRangeLabel}` : ""}
                    {closingOnly ? " · Hanya Closing" : ""}
                  </CardTitle>
                  <p className="text-[11px] text-tunet-text-muted mt-0.5">
                    Menampilkan {dateFilteredVisits.length} kunjungan sesuai filter
                  </p>
                </div>
                {(rangePreset !== "all" ||
                  visitorFilter !== "all" ||
                  typeFilter !== "all" ||
                  closingOnly ||
                  search.trim() !== "") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRangePreset("all");
                      setCustomDate("");
                      setVisitorFilter("all");
                      setTypeFilter("all");
                      setClosingOnly(false);
                      setSearch("");
                    }}
                    className="h-7 text-xs border-tunet-border text-tunet-text-muted hover:text-tunet-text"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Reset Semua Filter
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : dateFilteredVisits.length === 0 ? (
                <div className="py-12">
                  <EmptyState
                    icon={ClipboardCheck}
                    title="Belum ada kunjungan pada filter ini"
                    description="Coba pilih tanggal lain atau ubah filter petugas/tipe."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-tunet-border text-tunet-text-muted">
                        <th className="text-left py-3 px-4 text-xs font-medium">Tipe</th>
                        <th className="text-left py-3 px-4 text-xs font-medium">Nama</th>
                        <th className="text-left py-3 px-4 text-xs font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-xs font-medium min-w-[200px]">
                          Catatan
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium">Koordinat</th>
                        <th className="text-left py-3 px-4 text-xs font-medium">Oleh</th>
                        <th className="text-left py-3 px-4 text-xs font-medium">Waktu (WIB)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-tunet-border">
                      {dateFilteredVisits.map((visit) => {
                        const isProspek = visit.type === "prospek";
                        const targetName = isProspek
                          ? visit.prospect?.name || "-"
                          : visit.tower?.name || "-";
                        const statusConfig = isProspek
                          ? getProspectStatusConfig(visit.status_snapshot)
                          : undefined;
                        const wibDate = getWibDateString(visit.created_at);

                        return (
                          <tr
                            key={visit.id}
                            tabIndex={0}
                            onClick={() => setSelectedVisit(visit)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                setSelectedVisit(visit);
                              }
                            }}
                            className="hover:bg-tunet-surface-hover cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-tunet-green"
                          >
                            <td className="py-3 px-4">
                              <Badge
                                variant="secondary"
                                className={`text-xs ${
                                  isProspek
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-amber-500/20 text-amber-400"
                                }`}
                              >
                                {isProspek ? "Prospek" : "Tower"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-tunet-text font-medium">
                              {targetName}
                            </td>
                            <td className="py-3 px-4">
                              {statusConfig ? (
                                <Badge
                                  variant="secondary"
                                  className="text-xs"
                                  style={{
                                    backgroundColor: statusConfig.color + "20",
                                    color: statusConfig.color,
                                  }}
                                >
                                  {statusConfig.label}
                                </Badge>
                              ) : (
                                <span className="text-xs text-tunet-text-muted">
                                  {visit.status_snapshot}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs text-tunet-text-muted max-w-xs truncate">
                              {visit.notes || "-"}
                            </td>
                            <td className="py-3 px-4 text-xs font-mono-data">
                              <a
                                href={`https://maps.google.com/?q=${visit.location_lat},${visit.location_lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-blue-400 hover:underline"
                              >
                                <MapPin className="w-3 h-3 shrink-0" />
                                {visit.location_lat.toFixed(4)},{" "}
                                {visit.location_lng.toFixed(4)}
                              </a>
                            </td>
                            <td className="py-3 px-4 text-xs text-tunet-text">
                              {visit.visitor?.name || "-"}
                            </td>
                            <td className="py-3 px-4 text-xs text-tunet-text-muted whitespace-nowrap">
                              <span className="text-tunet-text font-mono-data">
                                {formatTimeWIB(visit.created_at)}
                              </span>{" "}
                              · {wibDate}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Visit Detail Drawer */}
        <Sheet open={!!selectedVisit} onOpenChange={() => setSelectedVisit(null)}>
          <SheetContent className="bg-tunet-surface border-tunet-border text-tunet-text sm:max-w-md flex flex-col">
            {selectedVisit && (
              <>
                <SheetHeader className="border-b border-tunet-border">
                  <SheetTitle className="text-tunet-text flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-tunet-green shrink-0" />
                    <span className="truncate">
                      {selectedVisit.type === "prospek"
                        ? selectedVisit.prospect?.name || "-"
                        : selectedVisit.tower?.name || "-"}
                    </span>
                  </SheetTitle>
                  <SheetDescription className="text-tunet-text-muted">
                    Detail Log Kunjungan
                  </SheetDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        selectedVisit.type === "prospek"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {selectedVisit.type === "prospek" ? "Prospek" : "Tower"}
                    </Badge>
                    {selectedVisit.type === "prospek" ? (
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor:
                            getProspectStatusConfig(selectedVisit.status_snapshot)
                              .color + "20",
                          color: getProspectStatusConfig(
                            selectedVisit.status_snapshot
                          ).color,
                        }}
                      >
                        {
                          getProspectStatusConfig(selectedVisit.status_snapshot)
                            .label
                        }
                      </span>
                    ) : (
                      <span className="text-xs text-tunet-text-muted">
                        {selectedVisit.status_snapshot}
                      </span>
                    )}
                  </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                  <div>
                    <p className="text-xs text-tunet-text-muted mb-1">
                      Catatan Kunjungan
                    </p>
                    <div className="p-3 rounded-lg bg-tunet-bg border border-tunet-border text-sm text-tunet-text whitespace-pre-wrap leading-relaxed">
                      {selectedVisit.notes || "Tidak ada catatan."}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-tunet-text-muted">Petugas Kunjungan</p>
                      <p className="text-tunet-text font-medium mt-0.5">
                        {selectedVisit.visitor?.name || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-tunet-text-muted">Waktu (WIB)</p>
                      <p className="text-tunet-text font-medium mt-0.5">
                        {formatShortDayLabel(
                          getWibDateString(selectedVisit.created_at)
                        )}{" "}
                        · {formatTimeWIB(selectedVisit.created_at)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-tunet-text-muted mb-1">
                      Lokasi GPS
                    </p>
                    <a
                      href={`https://maps.google.com/?q=${selectedVisit.location_lat},${selectedVisit.location_lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-tunet-bg border border-tunet-border text-xs text-blue-400 hover:bg-tunet-surface-hover transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="font-mono flex-1">
                        {selectedVisit.location_lat},{" "}
                        {selectedVisit.location_lng}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
}
