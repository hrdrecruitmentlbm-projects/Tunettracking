"use client";

import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  fetchProspects,
  fetchVisitLogs,
  fetchUsers,
  createProspect,
  updateProspect,
  softDeleteProspect,
  fetchProspectHistory,
} from "@/lib/db";
import { Prospect, VisitLog, User, ProspectStatusConfig, ProspectHistory } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Target, Search, Edit, Trash2, ClipboardCheck, MapPin, History, Download, ExternalLink, Phone, Eye, Filter } from "lucide-react";
import { COPY } from "@/lib/copy";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { useProspectStatuses } from "@/hooks/use-prospect-statuses";

export default function AdminMarketingPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [visits, setVisits] = useState<VisitLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { statuses: prospectStatuses, getConfig: getProspectStatusConfig } = useProspectStatuses();
  const [activeTab, setActiveTab] = useState<"prospek" | "kunjungan">("prospek");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editProspect, setEditProspect] = useState<Prospect | null>(null);
  const [deleteProspect, setDeleteProspect] = useState<Prospect | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [historyProspect, setHistoryProspect] = useState<Prospect | null>(null);
  const [history, setHistory] = useState<ProspectHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [detailVisit, setDetailVisit] = useState<VisitLog | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("tutrack-user");
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentUser(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [p, v, u] = await Promise.all([
          fetchProspects(),
          fetchVisitLogs(),
          fetchUsers(),
        ]);
        setProspects(p);
        setVisits(v);
        setUsers(u);
      } catch (err) {
        console.error("Failed to load marketing data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredProspects = useMemo(() => {
    const q = search.toLowerCase().trim();
    return prospects.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.area.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [prospects, search, statusFilter]);

  const filteredVisits = useMemo(() => {
    const q = search.toLowerCase().trim();
    return visits.filter((v) => {
      const name =
        v.type === "prospek"
          ? v.prospect?.name || ""
          : v.tower?.name || "";
      const matchesSearch =
        !q ||
        name.toLowerCase().includes(q) ||
        v.notes?.toLowerCase().includes(q) ||
        v.visitor?.name?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || v.status_snapshot === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [visits, search, statusFilter]);

  const today = new Date().toISOString().slice(0, 10);
  const activeProspects = prospects.filter(
    (p) => p.status !== "acc" && p.status !== "tidak"
  );
  const accProspects = prospects.filter((p) => p.status === "acc");
  const todayVisits = visits.filter((v) => v.created_at?.slice(0, 10) === today);

  const handleCreate = () => {
    setEditProspect(null);
    setFormOpen(true);
  };

  const handleEdit = (prospect: Prospect) => {
    setEditProspect(prospect);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteProspect || !currentUser) return;
    const ok = await softDeleteProspect(deleteProspect.id, currentUser.id);
    if (ok) {
      toast.success("Prospek berhasil dihapus");
      setProspects((prev) => prev.filter((p) => p.id !== deleteProspect.id));
    } else {
      toast.error("Gagal menghapus prospek");
    }
    setDeleteProspect(null);
  };

  const handleStatusChange = async (prospectId: string, newStatus: string) => {
    const result = await updateProspect(prospectId, { status: newStatus, changedBy: currentUser?.id || "" });
    if (result) {
      setProspects((prev) =>
        prev.map((p) => (p.id === prospectId ? { ...p, status: newStatus as Prospect["status"] } : p))
      );
      toast.success("Status berhasil diperbarui");
    } else {
      toast.error("Gagal memperbarui status");
    }
  };

  const handleHistory = async (prospect: Prospect) => {
    setHistoryProspect(prospect);
    setHistoryLoading(true);
    try {
      const data = await fetchProspectHistory(prospect.id);
      setHistory(data);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSaved = async () => {
    const fresh = await fetchProspects();
    setProspects(fresh);
  };

  const handleExportCSV = () => {
    if (activeTab === "prospek") {
      const headers = ["Nama", "Telepon", "Area", "Alamat", "Status", "Penanggung Jawab", "Tanggal Dibuat"];
      const rows = filteredProspects.map((p) => [
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.phone}"`,
        `"${p.area.replace(/"/g, '""')}"`,
        `"${(p.address || "").replace(/"/g, '""')}"`,
        `"${getProspectStatusConfig(p.status).label}"`,
        `"${p.assignee?.name || "-"}"`,
        `"${new Date(p.created_at).toLocaleDateString("id-ID")}"`,
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `prospek_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Data prospek berhasil di-export ke CSV");
    } else {
      const headers = ["Tipe", "Nama", "Status", "Catatan", "Latitude", "Longitude", "Oleh", "Tanggal"];
      const rows = filteredVisits.map((v) => [
        `"${v.type === "prospek" ? "Prospek" : "Tower"}"`,
        `"${(v.type === "prospek" ? v.prospect?.name : v.tower?.name) || "-"}"`,
        `"${v.status_snapshot}"`,
        `"${(v.notes || "").replace(/"/g, '""')}"`,
        `"${v.location_lat}"`,
        `"${v.location_lng}"`,
        `"${v.visitor?.name || "-"}"`,
        `"${new Date(v.created_at).toLocaleString("id-ID")}"`,
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `kunjungan_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Data kunjungan berhasil di-export ke CSV");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <AdminMarketingSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-tunet-bg">
        {/* Header */}
        <div className="h-16 border-b border-tunet-border flex items-center justify-between px-6 gap-3 flex-wrap">
          <div>
            <Breadcrumbs items={[{ label: "Admin", href: "/dashboard/admin" }, { label: "Marketing" }]} className="mb-1" />
            <h1 className="text-lg font-semibold text-tunet-text">Marketing</h1>
            <p className="text-xs text-tunet-text-muted">Kelola data prospek dan kunjungan</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
                <SelectTrigger id="filter-status" className="w-36 h-9 bg-tunet-surface border-tunet-border text-tunet-text text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <Filter className="w-3.5 h-3.5 text-tunet-text-muted" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-tunet-surface border-tunet-border">
                  <SelectItem value="all">Semua Status</SelectItem>
                  {prospectStatuses.map((s) => (
                    <SelectItem key={s.key} value={s.key}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tunet-text-muted" />
              <Input
                id="prospect-search"
                placeholder="Cari..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64 bg-tunet-surface border-tunet-border text-tunet-text h-9 text-xs"
              />
            </div>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              className="border-tunet-border bg-tunet-surface text-tunet-text hover:bg-tunet-surface-hover h-9 text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export CSV
            </Button>
            {activeTab === "prospek" && (
              <Button onClick={handleCreate} size="sm" className="bg-tunet-green hover:bg-tunet-green-dark text-white h-9 text-xs">
                <Target className="w-3.5 h-3.5 mr-1.5" />
                {COPY.pages.prospects.addNew}
              </Button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Total Prospek"
              value={prospects.length}
              icon={<Target className="w-5 h-5 text-blue-400" />}
              color="blue"
            />
            <StatCard
              label="Aktif"
              value={activeProspects.length}
              icon={<Target className="w-5 h-5 text-tunet-green" />}
              color="green"
            />
            <StatCard
              label="Selesai (ACC)"
              value={accProspects.length}
              icon={<Target className="w-5 h-5 text-purple-400" />}
              color="purple"
            />
            <StatCard
              label="Kunjungan Hari Ini"
              value={todayVisits.length}
              icon={<ClipboardCheck className="w-5 h-5 text-amber-400" />}
              color="amber"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => { setActiveTab("prospek"); setSearch(""); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "prospek"
                  ? "bg-tunet-green/20 text-tunet-green"
                  : "text-tunet-text-muted hover:bg-tunet-surface-hover"
              }`}
            >
              Prospek ({prospects.length})
            </button>
            <button
              onClick={() => { setActiveTab("kunjungan"); setSearch(""); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "kunjungan"
                  ? "bg-tunet-green/20 text-tunet-green"
                  : "text-tunet-text-muted hover:bg-tunet-surface-hover"
              }`}
            >
              Kunjungan ({visits.length})
            </button>
          </div>

          {/* Prospek Tab */}
          {activeTab === "prospek" && (
            <>
              {filteredProspects.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <EmptyState
                    icon={Target}
                    title="Belum ada prospek"
                    description="Data prospek akan muncul di sini"
                  />
                </div>
              ) : (
                <Card className="bg-tunet-surface border-tunet-border">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-tunet-border">
                            <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">{COPY.pages.prospects.colName}</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">{COPY.pages.prospects.colPhone}</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">{COPY.pages.prospects.colArea}</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">{COPY.pages.prospects.colStatus}</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">{COPY.pages.prospects.colAssignee}</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">{COPY.pages.prospects.colDateAdded}</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">{COPY.pages.prospects.colActions}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProspects.map((prospect) => {
                            return (
                              <tr key={prospect.id} className="border-b border-tunet-border last:border-0 hover:bg-tunet-surface-hover">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-medium">
                                      {prospect.name.charAt(0)}
                                    </div>
                                    <span className="text-sm text-tunet-text">{prospect.name}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-tunet-text-muted">
                                  <div className="flex items-center gap-1.5">
                                    <span>{prospect.phone}</span>
                                    {prospect.phone && (
                                      <a
                                        href={`https://wa.me/${prospect.phone.replace(/[^0-9]/g, "").replace(/^0/, "62")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                                        title="Chat WhatsApp"
                                        aria-label="Chat WhatsApp"
                                      >
                                        <Phone className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-tunet-text-muted">{prospect.area}</td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <select
                                      id={`prospect-status-${prospect.id}`}
                                      aria-label="Status prospek"
                                      value={prospect.status}
                                      onChange={(e) => handleStatusChange(prospect.id, e.target.value)}
                                      className="text-xs font-medium rounded-full px-3 py-1 border-0 cursor-pointer focus:ring-2 focus:ring-tunet-green/50 outline-none"
                                      style={{
                                        backgroundColor: getProspectStatusConfig(prospect.status).color + "20",
                                        color: getProspectStatusConfig(prospect.status).color,
                                      }}
                                    >
                                      {prospectStatuses.map((s) => (
                                        <option key={s.key} value={s.key} className="bg-tunet-surface text-tunet-text">
                                          {s.label}
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={() => handleHistory(prospect)}
                                      className="p-1 rounded hover:bg-tunet-surface-hover text-tunet-text-muted"
                                      title="Riwayat"
                                      aria-label="Riwayat"
                                    >
                                      <History className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-tunet-text-muted">{prospect.assignee?.name || "-"}</td>
                                <td className="py-3 px-4 text-xs text-tunet-text-muted">
                                  {new Date(prospect.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleEdit(prospect)}
                                      className="p-1.5 rounded hover:bg-tunet-surface-hover text-tunet-text-muted"
                                      aria-label="Edit prospek"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setDeleteProspect(prospect)}
                                      className="p-1.5 rounded hover:bg-status-overdue/10 text-tunet-text-muted hover:text-status-overdue"
                                      aria-label="Hapus prospek"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Kunjungan Tab */}
          {activeTab === "kunjungan" && (
            <>
              {filteredVisits.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <EmptyState
                    icon={ClipboardCheck}
                    title="Belum ada kunjungan"
                    description="Data kunjungan akan muncul di sini"
                  />
                </div>
              ) : (
                <Card className="bg-tunet-surface border-tunet-border">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-tunet-border">
                            <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">Tipe</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">Nama</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">Status</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted min-w-[220px]">Catatan</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">Koordinat</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">Oleh</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">Tanggal</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredVisits.map((visit) => {
                            const isProspek = visit.type === "prospek";
                            const statusConfig = isProspek
                              ? getProspectStatusConfig(visit.status_snapshot)
                              : undefined;
                            return (
                              <tr key={visit.id} className="border-b border-tunet-border last:border-0 hover:bg-tunet-surface-hover">
                                <td className="py-3 px-4">
                                  <Badge
                                    variant="secondary"
                                    className={`text-xs ${isProspek ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"}`}
                                  >
                                    {isProspek ? "Prospek" : "Tower"}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-sm text-tunet-text">
                                  {isProspek ? visit.prospect?.name || "-" : visit.tower?.name || "-"}
                                </td>
                                <td className="py-3 px-4">
                                  {statusConfig ? (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                      style={{ backgroundColor: statusConfig.color + "20", color: statusConfig.color }}
                                    >
                                      {statusConfig.label}
                                    </Badge>
                                  ) : (
                                    <span className="text-sm text-tunet-text-muted">{visit.status_snapshot || "-"}</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-sm text-tunet-text whitespace-normal break-words max-w-xs">{visit.notes || "-"}</td>
                                <td className="py-3 px-4">
                                  <a
                                    href={`https://maps.google.com/?q=${visit.location_lat},${visit.location_lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-blue-400 hover:underline group"
                                    title="Buka di Google Maps"
                                  >
                                    <MapPin className="w-3 h-3 text-tunet-text-muted group-hover:text-blue-400" />
                                    <span className="font-mono">{visit.location_lat.toFixed(4)}, {visit.location_lng.toFixed(4)}</span>
                                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </a>
                                </td>
                                <td className="py-3 px-4 text-sm text-tunet-text-muted">{visit.visitor?.name || "-"}</td>
                                <td className="py-3 px-4 text-xs text-tunet-text-muted">{new Date(visit.created_at).toLocaleDateString("id-ID")}</td>
                                <td className="py-3 px-4">
                                  <button
                                    onClick={() => setDetailVisit(visit)}
                                    className="p-1.5 rounded hover:bg-tunet-surface-hover text-tunet-text-muted hover:text-tunet-text transition-colors"
                                    title="Lihat Detail Kunjungan"
                                    aria-label="Detail Kunjungan"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Visit Detail Dialog */}
        <Dialog open={!!detailVisit} onOpenChange={() => setDetailVisit(null)}>
          <DialogContent className="bg-tunet-surface border-tunet-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-tunet-text flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-tunet-green" />
                Detail Log Kunjungan
              </DialogTitle>
            </DialogHeader>
            {detailVisit && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-tunet-bg border border-tunet-border">
                  <div>
                    <p className="text-xs text-tunet-text-muted">Tipe Kunjungan</p>
                    <Badge variant="secondary" className={`mt-1 text-xs ${detailVisit.type === "prospek" ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"}`}>
                      {detailVisit.type === "prospek" ? "Prospek" : "Tower"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-tunet-text-muted">Status</p>
                    <p className="text-sm font-medium text-tunet-text mt-0.5">
                      {detailVisit.type === "prospek"
                        ? getProspectStatusConfig(detailVisit.status_snapshot).label
                        : detailVisit.status_snapshot}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-tunet-text-muted">Nama Targets</p>
                  <p className="text-sm font-semibold text-tunet-text mt-0.5">
                    {detailVisit.type === "prospek" ? detailVisit.prospect?.name || "-" : detailVisit.tower?.name || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-tunet-text-muted mb-1">Catatan Kunjungan</p>
                  <div className="p-3 rounded-lg bg-tunet-bg border border-tunet-border text-sm text-tunet-text whitespace-pre-wrap leading-relaxed">
                    {detailVisit.notes || "Tidak ada catatan."}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-tunet-text-muted">Petugas Kunjungan</p>
                    <p className="text-tunet-text font-medium mt-0.5">{detailVisit.visitor?.name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-tunet-text-muted">Waktu Kunjungan</p>
                    <p className="text-tunet-text font-medium mt-0.5">{new Date(detailVisit.created_at).toLocaleString("id-ID")}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-tunet-text-muted mb-1">Lokasi GPS</p>
                  <a
                    href={`https://maps.google.com/?q=${detailVisit.location_lat},${detailVisit.location_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-tunet-bg border border-tunet-border text-xs text-blue-400 hover:bg-tunet-surface-hover transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <span className="font-mono flex-1">{detailVisit.location_lat}, {detailVisit.location_lng}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setDetailVisit(null)} className="bg-tunet-surface border-tunet-border text-tunet-text hover:bg-tunet-surface-hover">
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={!!deleteProspect} onOpenChange={() => setDeleteProspect(null)}>
          <DialogContent className="bg-tunet-surface border-tunet-border">
            <DialogHeader>
              <DialogTitle className="text-tunet-text">Hapus Prospek</DialogTitle>
              <DialogDescription className="text-tunet-text-muted">
                Yakin ingin menghapus &quot;{deleteProspect?.name}&quot;? Data akan dipindahkan ke sampah.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteProspect(null)} className="border-tunet-border text-tunet-text">
                {COPY.actions.cancel}
              </Button>
              <Button onClick={handleDelete} className="bg-status-overdue hover:bg-status-overdue/90 text-white">
                {COPY.actions.delete}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* History Dialog */}
        <Dialog open={!!historyProspect} onOpenChange={() => { setHistoryProspect(null); setHistory([]); }}>
          <DialogContent className="bg-tunet-surface border-tunet-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-tunet-text">Riwayat Status</DialogTitle>
              <DialogDescription className="text-tunet-text-muted">
                {historyProspect?.name}
              </DialogDescription>
            </DialogHeader>
            {historyLoading ? (
              <div className="space-y-3 py-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-tunet-text-muted py-4 text-center">Belum ada riwayat perubahan status</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto py-2">
                {history.map((h) => (
                  <div key={h.id} className="flex items-start gap-3 p-3 rounded-lg bg-tunet-bg border border-tunet-border">
                    <div className="w-8 h-8 rounded-full bg-tunet-green/20 flex items-center justify-center text-tunet-green text-sm font-medium flex-shrink-0">
                      {h.changer?.name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-tunet-text font-medium">{h.changer?.name || "Unknown"}</span>
                        <span className="text-xs text-tunet-text-muted">mengubah status</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span
                          className="px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: getProspectStatusConfig(h.old_status).color + "20", color: getProspectStatusConfig(h.old_status).color }}
                        >
                          {getProspectStatusConfig(h.old_status).label}
                        </span>
                        <span className="text-tunet-text-muted">→</span>
                        <span
                          className="px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: getProspectStatusConfig(h.new_status).color + "20", color: getProspectStatusConfig(h.new_status).color }}
                        >
                          {getProspectStatusConfig(h.new_status).label}
                        </span>
                      </div>
                      <p className="text-xs text-tunet-text-muted mt-1">
                        {new Date(h.changed_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })},{" "}
                        {new Date(h.changed_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Prospect Form */}
        <AdminProspectForm
          open={formOpen}
          onOpenChange={setFormOpen}
          prospect={editProspect}
          users={users}
          onSaved={handleSaved}
          currentUser={currentUser}
          statuses={prospectStatuses}
        />
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <Card className="bg-tunet-surface border-tunet-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-tunet-text-muted">{label}</p>
            <p className={`text-2xl font-bold text-${color}-400 mt-1`}>{value}</p>
          </div>
          <div className={`w-10 h-10 rounded-lg bg-${color}-500/20 flex items-center justify-center`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminProspectForm({
  open,
  onOpenChange,
  prospect,
  users,
  onSaved,
  currentUser,
  statuses,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospect: Prospect | null;
  users: User[];
  onSaved: () => void;
  currentUser: User | null;
  statuses: ProspectStatusConfig[];
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [status, setStatus] = useState("belum_diproses");
  const [notes, setNotes] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (prospect) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(prospect.name);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhone(prospect.phone);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAddress(prospect.address);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setArea(prospect.area);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus(prospect.status);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotes(prospect.notes);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAssignedTo(prospect.assigned_to);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName("");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhone("");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAddress("");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setArea("");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("belum_diproses");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotes("");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAssignedTo("");
    }
  }, [prospect, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !assignedTo) {
      toast.error("Nama dan penanggung jawab wajib diisi");
      return;
    }
    setSaving(true);
    try {
      if (prospect) {
        const result = await updateProspect(prospect.id, {
          name, phone, address, area, status, notes, assigned_to: assignedTo,
        });
        if (result) {
          toast.success(COPY.pages.prospects.updated);
        } else {
          toast.error(COPY.pages.prospects.failedUpdate);
        }
      } else {
        const result = await createProspect({
          name, phone, address, area, status, notes, assigned_to: assignedTo,
          location_lat: -6.2088, location_lng: 106.8456,
        });
        if (result.data) {
          toast.success(COPY.pages.prospects.created);
        } else {
          toast.error(result.error || COPY.pages.prospects.failedCreate);
        }
      }
      onSaved();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const marketingUsers = useMemo(() => users.filter((u) => u.role === "marketing"), [users]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-tunet-surface border-tunet-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-tunet-text">
            {prospect ? COPY.pages.prospects.editTitle : COPY.pages.prospects.createTitle}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="prospect-name" className="text-sm font-medium text-tunet-text">{COPY.pages.prospects.name}</label>
            <Input id="prospect-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 bg-tunet-bg border-tunet-border text-tunet-text" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="prospect-phone" className="text-sm font-medium text-tunet-text">{COPY.pages.prospects.phone}</label>
              <Input id="prospect-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 bg-tunet-bg border-tunet-border text-tunet-text" />
            </div>
            <div>
              <label htmlFor="prospect-area" className="text-sm font-medium text-tunet-text">{COPY.pages.prospects.area}</label>
              <Input id="prospect-area" value={area} onChange={(e) => setArea(e.target.value)} className="mt-1 bg-tunet-bg border-tunet-border text-tunet-text" />
            </div>
          </div>
          <div>
            <label htmlFor="prospect-address" className="text-sm font-medium text-tunet-text">{COPY.pages.prospects.address}</label>
            <Input id="prospect-address" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 bg-tunet-bg border-tunet-border text-tunet-text" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="prospect-status" className="text-sm font-medium text-tunet-text">{COPY.pages.prospects.status}</label>
              <Select value={status} onValueChange={(v) => v && setStatus(v)}>
                <SelectTrigger id="prospect-status" className="mt-1 bg-tunet-bg border-tunet-border text-tunet-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-tunet-surface border-tunet-border">
                  {statuses.map((s) => (
                    <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="prospect-assignee" className="text-sm font-medium text-tunet-text">{COPY.pages.prospects.assignTo}</label>
              <Select value={assignedTo} onValueChange={(v) => v && setAssignedTo(v)}>
                <SelectTrigger id="prospect-assignee" className="mt-1 bg-tunet-bg border-tunet-border text-tunet-text">
                  <SelectValue placeholder="Pilih penanggung jawab" />
                </SelectTrigger>
                <SelectContent className="bg-tunet-surface border-tunet-border">
                  {marketingUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label htmlFor="prospect-notes" className="text-sm font-medium text-tunet-text">{COPY.pages.prospects.notes}</label>
            <Input id="prospect-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 bg-tunet-bg border-tunet-border text-tunet-text" placeholder="Catatan tambahan..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-tunet-border text-tunet-text">
              {COPY.actions.cancel}
            </Button>
            <Button type="submit" disabled={saving} className="bg-tunet-green hover:bg-tunet-green-dark text-white">
              {saving ? COPY.pages.prospects.saving : COPY.pages.prospects.save}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AdminMarketingSkeleton() {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-tunet-bg">
        <div className="h-16 border-b border-tunet-border flex items-center px-6">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    </DashboardLayout>
  );
}
