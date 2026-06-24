"use client";

import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { fetchProspects, createProspect, updateProspect, softDeleteProspect, fetchUsers } from "@/lib/db";
import { Prospect, User, PROSPECT_STATUS_CONFIG } from "@/types";
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
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { COPY } from "@/lib/copy";
import { toast } from "sonner";

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editProspect, setEditProspect] = useState<Prospect | null>(null);
  const [deleteProspect, setDeleteProspect] = useState<Prospect | null>(null);
  const [currentUser, setCurrentUserId] = useState<User | null>(null);

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
      const [p, u] = await Promise.all([fetchProspects(), fetchUsers()]);
      setProspects(p);
      setUsers(u);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return prospects;
    return prospects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.area.toLowerCase().includes(q)
    );
  }, [prospects, search]);

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
      toast.success(COPY.pages.prospects.deleted);
      setProspects((prev) => prev.filter((p) => p.id !== deleteProspect.id));
    } else {
      toast.error(COPY.pages.prospects.failedDelete);
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
        <ProspectsSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-tunet-bg">
        <div className="h-16 border-b border-tunet-border flex items-center justify-between px-6 gap-3 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold text-tunet-text">{COPY.pages.prospects.title}</h1>
            <p className="text-xs text-tunet-text-muted">{COPY.pages.prospects.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tunet-text-muted" />
              <Input
                placeholder="Cari prospek..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64 bg-tunet-surface border-tunet-border text-tunet-text"
              />
            </div>
            <Button onClick={handleCreate} className="bg-tunet-green hover:bg-tunet-green-dark text-white">
              <Plus className="w-4 h-4 mr-2" />
              {COPY.pages.prospects.addNew}
            </Button>
          </div>
        </div>

        <div className="p-6">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <EmptyState
                icon={Search}
                title={COPY.pages.prospects.empty.title}
                description={COPY.pages.prospects.empty.description}
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
                      {filtered.map((prospect) => {
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
        </div>

        <ProspectForm
          open={formOpen}
          onOpenChange={setFormOpen}
          prospect={editProspect}
          users={users}
          onSaved={handleSaved}
          currentUser={currentUser}
        />

        <Dialog open={!!deleteProspect} onOpenChange={() => setDeleteProspect(null)}>
          <DialogContent className="bg-tunet-surface border-tunet-border">
            <DialogHeader>
              <DialogTitle className="text-tunet-text">{COPY.pages.prospects.deleted}</DialogTitle>
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
      </div>
    </DashboardLayout>
  );
}

function ProspectForm({
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
      setAssignedTo(currentUser?.id || "");
    }
  }, [prospect, currentUser, open]);

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

  const marketingUsers = useMemo(() => {
    const filtered = users.filter((u) => u.role === "marketing");
    const result = [...filtered];
    if (currentUser && !result.some((u) => u.id === currentUser.id)) {
      result.unshift(currentUser);
    }
    return result;
  }, [users, currentUser]);

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
              <Select value={status} onValueChange={(v) => setStatus(v || "belum_diproses")}>
                <SelectTrigger className="mt-1 bg-tunet-bg border-tunet-border text-tunet-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-tunet-surface border-tunet-border">
                  {Object.entries(PROSPECT_STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-tunet-text">{COPY.pages.prospects.assignTo}</label>
              <Select key={assignedTo || "empty"} value={assignedTo} onValueChange={(v) => setAssignedTo(v || "")}>
                <SelectTrigger className="mt-1 bg-tunet-bg border-tunet-border text-tunet-text">
                  <SelectValue placeholder="Pilih..." />
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
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 bg-tunet-bg border-tunet-border text-tunet-text" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-tunet-border text-tunet-text">
              {COPY.actions.cancel}
            </Button>
            <Button type="submit" disabled={saving} className="bg-tunet-green hover:bg-tunet-green-dark text-white">
              {saving ? COPY.pages.prospects.saving : COPY.pages.prospects.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProspectsSkeleton() {
  return (
    <div className="min-h-screen bg-tunet-bg">
      <div className="h-16 border-b border-tunet-border flex items-center justify-between px-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-44" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="p-6">
        <Card className="bg-tunet-surface border-tunet-border">
          <CardContent className="p-0">
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
