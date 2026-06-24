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
} from "@/lib/db";
import { Prospect, VisitLog, User, PROSPECT_STATUS_CONFIG } from "@/types";
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
import { Target, Search, Edit, Trash2, ClipboardCheck, MapPin } from "lucide-react";
import { COPY } from "@/lib/copy";
import { toast } from "sonner";

export default function AdminMarketingPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [visits, setVisits] = useState<VisitLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"prospek" | "kunjungan">("prospek");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editProspect, setEditProspect] = useState<Prospect | null>(null);
  const [deleteProspect, setDeleteProspect] = useState<Prospect | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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
    if (!q) return prospects;
    return prospects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.area.toLowerCase().includes(q)
    );
  }, [prospects, search]);

  const filteredVisits = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return visits;
    return visits.filter((v) => {
      const name =
        v.type === "prospek"
          ? v.prospect?.name || ""
          : v.tower?.name || "";
      return (
        name.toLowerCase().includes(q) ||
        v.notes?.toLowerCase().includes(q)
      );
    });
  }, [visits, search]);

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

  const handleSaved = async () => {
    const fresh = await fetchProspects();
    setProspects(fresh);
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
            <h1 className="text-lg font-semibold text-tunet-text">Marketing</h1>
            <p className="text-xs text-tunet-text-muted">Kelola data prospek dan kunjungan</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tunet-text-muted" />
              <Input
                placeholder="Cari..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64 bg-tunet-surface border-tunet-border text-tunet-text"
              />
            </div>
            {activeTab === "prospek" && (
              <Button onClick={handleCreate} className="bg-tunet-green hover:bg-tunet-green-dark text-white">
                <Target className="w-4 h-4 mr-2" />
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
                            <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">{COPY.pages.prospects.colActions}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProspects.map((prospect) => {
                            const statusConfig = PROSPECT_STATUS_CONFIG[prospect.status];
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
                                <td className="py-3 px-4 text-sm text-tunet-text-muted">{prospect.phone}</td>
                                <td className="py-3 px-4 text-sm text-tunet-text-muted">{prospect.area}</td>
                                <td className="py-3 px-4">
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                    style={{ backgroundColor: statusConfig.color + "20", color: statusConfig.color }}
                                  >
                                    {statusConfig.label}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-sm text-tunet-text-muted">{prospect.assignee?.name || "-"}</td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleEdit(prospect)}
                                      className="p-1.5 rounded hover:bg-tunet-surface-hover text-tunet-text-muted"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setDeleteProspect(prospect)}
                                      className="p-1.5 rounded hover:bg-status-overdue/10 text-tunet-text-muted hover:text-status-overdue"
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
                            <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">Catatan</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">Koordinat</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">Oleh</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-tunet-text-muted">Tanggal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredVisits.map((visit) => {
                            const isProspek = visit.type === "prospek";
                            const statusConfig = isProspek
                              ? PROSPECT_STATUS_CONFIG[visit.status_snapshot as keyof typeof PROSPECT_STATUS_CONFIG]
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
                                <td className="py-3 px-4 text-sm text-tunet-text-muted max-w-[200px] truncate">{visit.notes || "-"}</td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1 text-xs text-tunet-text-muted">
                                    <MapPin className="w-3 h-3" />
                                    <span className="font-mono">{visit.location_lat.toFixed(4)}, {visit.location_lng.toFixed(4)}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-tunet-text-muted">{visit.visitor?.name || "-"}</td>
                                <td className="py-3 px-4 text-xs text-tunet-text-muted">{new Date(visit.created_at).toLocaleDateString("id-ID")}</td>
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

        {/* Prospect Form */}
        <AdminProspectForm
          open={formOpen}
          onOpenChange={setFormOpen}
          prospect={editProspect}
          users={users}
          onSaved={handleSaved}
          currentUser={currentUser}
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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospect: Prospect | null;
  users: User[];
  onSaved: () => void;
  currentUser: User | null;
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
            <label className="text-sm font-medium text-tunet-text">{COPY.pages.prospects.name}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 bg-tunet-bg border-tunet-border text-tunet-text" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-tunet-text">{COPY.pages.prospects.phone}</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 bg-tunet-bg border-tunet-border text-tunet-text" />
            </div>
            <div>
              <label className="text-sm font-medium text-tunet-text">{COPY.pages.prospects.area}</label>
              <Input value={area} onChange={(e) => setArea(e.target.value)} className="mt-1 bg-tunet-bg border-tunet-border text-tunet-text" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-tunet-text">{COPY.pages.prospects.address}</label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 bg-tunet-bg border-tunet-border text-tunet-text" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-tunet-text">{COPY.pages.prospects.status}</label>
              <Select value={status} onValueChange={(v) => v && setStatus(v)}>
                <SelectTrigger className="mt-1 bg-tunet-bg border-tunet-border text-tunet-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-tunet-surface border-tunet-border">
                  {Object.entries(PROSPECT_STATUS_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-tunet-text">{COPY.pages.prospects.assignTo}</label>
              <Select value={assignedTo} onValueChange={(v) => v && setAssignedTo(v)}>
                <SelectTrigger className="mt-1 bg-tunet-bg border-tunet-border text-tunet-text">
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
            <label className="text-sm font-medium text-tunet-text">{COPY.pages.prospects.notes}</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 bg-tunet-bg border-tunet-border text-tunet-text" placeholder="Catatan tambahan..." />
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
