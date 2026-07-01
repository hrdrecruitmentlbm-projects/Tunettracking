"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { fetchUsers, createUser, updateUser, deleteUser, deactivateUser } from "@/lib/db";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { COPY } from "@/lib/copy";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Plus, MoreHorizontal, Pencil, Trash2, UserX, Eye, EyeOff, Users } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

interface StaffFormData {
  name: string;
  role: "admin" | "noc" | "foc" | "marketing";
  phone: string;
  pin: string;
  telegram_id: string;
}

const EMPTY_FORM: StaffFormData = {
  name: "",
  role: "foc",
  phone: "",
  pin: "",
  telegram_id: "",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<StaffFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showPin, setShowPin] = useState<Record<string, boolean>>({});
  const [showInactive, setShowInactive] = useState(false);

  const loadUsers = async () => {
    const data = await fetchUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
  }, []);

  const openCreateDialog = () => {
    setEditingUser(null);
    setFormData(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      role: user.role,
      phone: user.phone || "",
      pin: user.pin,
      telegram_id: user.telegram_id || "",
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone || !formData.pin) {
      toast.error(COPY.pages.team.requiredFields);
      return;
    }

    if (formData.pin.length !== 4 || !/^\d{4}$/.test(formData.pin)) {
      toast.error(COPY.pages.team.pinInvalid);
      return;
    }

    setSaving(true);

    try {
      if (editingUser) {
        const updated = await updateUser(editingUser.id, formData);
        if (updated) {
          toast.success(COPY.pages.team.memberUpdated(formData.name));
          setDialogOpen(false);
          loadUsers();
        } else {
          toast.error(COPY.pages.team.failedUpdateUser);
        }
      } else {
        const created = await createUser(formData);
        if (created) {
          toast.success(COPY.pages.team.memberAdded(formData.name));
          setDialogOpen(false);
          loadUsers();
        } else {
          toast.error(COPY.pages.team.failedCreateUser);
        }
      }
    } catch {
      toast.error(COPY.pages.team.errorOccurred);
    }

    setSaving(false);
  };

  const handleDeactivate = async () => {
    if (!deletingUser) return;

    const success = await deactivateUser(deletingUser.id);
    if (success) {
      toast.success(COPY.pages.team.memberDeactivated(deletingUser.name));
      setDeleteDialogOpen(false);
      setDeletingUser(null);
      loadUsers();
    } else {
      toast.error(COPY.pages.team.failedDeactivate);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    const success = await deleteUser(deletingUser.id);
    if (success) {
      toast.success(COPY.pages.team.memberDeleted(deletingUser.name));
      setDeleteDialogOpen(false);
      setDeletingUser(null);
      loadUsers();
    } else {
      toast.error(COPY.pages.team.failedDelete);
    }
  };

  const togglePinVisibility = (userId: string) => {
    setShowPin((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-tunet-green/20 text-tunet-green";
      case "noc":
        return "bg-status-assigned/20 text-status-assigned";
      case "foc":
        return "bg-status-progress/20 text-status-progress";
      default:
        return "bg-tunet-surface text-tunet-text-muted";
    }
  };

  const visibleUsers = showInactive ? users : users.filter((u) => u.is_active);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-tunet-bg">
        <div className="h-16 border-b border-tunet-border flex items-center justify-between px-6">
          <div>
            <Breadcrumbs items={[{ label: "Admin", href: "/dashboard/admin" }, { label: "Users" }]} className="mb-1" />
            <h1 className="text-lg font-semibold text-tunet-text">{COPY.pages.team.title}</h1>
            <p className="text-xs text-tunet-text-muted">{COPY.pages.team.subtitle}</p>
          </div>
          <Button onClick={openCreateDialog} className="bg-tunet-green hover:bg-tunet-green-dark text-white">
            <Plus className="w-4 h-4 mr-2" />
            {COPY.pages.team.addStaff}
          </Button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-tunet-surface border-tunet-border">
            <CardContent className="p-4">
              <p className="text-sm text-tunet-text-muted">{COPY.pages.team.totalStaff}</p>
              <p className="text-2xl font-bold text-tunet-text">{users.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-tunet-surface border-tunet-border">
            <CardContent className="p-4">
              <p className="text-sm text-tunet-text-muted">{COPY.pages.team.active}</p>
              <p className="text-2xl font-bold text-tunet-green">{users.filter((u) => u.is_active).length}</p>
            </CardContent>
          </Card>
          <Card className="bg-tunet-surface border-tunet-border">
            <CardContent className="p-4">
              <p className="text-sm text-tunet-text-muted">{COPY.pages.team.inactive}</p>
              <p className="text-2xl font-bold text-status-overdue">{users.filter((u) => !u.is_active).length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="px-6 pb-6">
          <Card className="bg-tunet-surface border-tunet-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-tunet-text">{COPY.pages.team.allStaff}</CardTitle>
              <button
                onClick={() => setShowInactive(!showInactive)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                  showInactive
                    ? "bg-status-overdue/10 text-status-overdue border border-status-overdue/30"
                    : "text-tunet-text-muted hover:bg-tunet-surface-hover border border-transparent"
                }`}
              >
                {showInactive ? (
                  <UserX className="w-3.5 h-3.5" />
                ) : (
                  <Users className="w-3.5 h-3.5" />
                )}
                {showInactive ? COPY.pages.team.hideInactive : COPY.pages.team.showInactive}
              </button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 px-4 py-3 border-b border-tunet-border"
                    >
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-2 w-20" />
                      </div>
                      <Skeleton className="h-4 w-12 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : visibleUsers.length === 0 ? (
                <EmptyState
                  icon={Plus}
                  title={COPY.empty.noTeamMembers.title}
                  description={COPY.empty.noTeamMembers.description}
                  action={
                    <Button
                      onClick={openCreateDialog}
                      className="bg-tunet-green hover:bg-tunet-green-dark text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {COPY.pages.team.addFirstStaff}
                    </Button>
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-tunet-border">
                        <TableHead className="text-tunet-text-muted">{COPY.pages.team.colName}</TableHead>
                        <TableHead className="text-tunet-text-muted">{COPY.pages.team.colRole}</TableHead>
                        <TableHead className="text-tunet-text-muted">{COPY.pages.team.colPhone}</TableHead>
                        <TableHead className="text-tunet-text-muted">{COPY.pages.team.colPin}</TableHead>
                        <TableHead className="text-tunet-text-muted">{COPY.pages.team.colTelegram}</TableHead>
                        <TableHead className="text-tunet-text-muted">{COPY.pages.team.colStatus}</TableHead>
                        <TableHead className="text-tunet-text-muted text-right">{COPY.pages.team.colActions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleUsers.map((user) => (
                        <TableRow key={user.id} className="border-tunet-border">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-tunet-green/20 flex items-center justify-center text-tunet-green text-sm font-medium">
                                {user.name.charAt(0)}
                              </div>
                              <span className="text-sm font-medium text-tunet-text">{user.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`text-xs ${getRoleColor(user.role)}`}>
                              {user.role.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-tunet-text-muted">{user.phone}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-tunet-text-muted font-mono">
                                {showPin[user.id] ? user.pin : "****"}
                              </span>
                              <button
                                onClick={() => togglePinVisibility(user.id)}
                                className="text-tunet-text-muted hover:text-tunet-text"
                                aria-label={showPin[user.id] ? "Hide PIN" : "Show PIN"}
                              >
                                {showPin[user.id] ? (
                                  <EyeOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-tunet-text-muted">
                            {user.telegram_id || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                user.is_active
                                  ? "bg-tunet-green/20 text-tunet-green"
                                  : "bg-status-overdue/20 text-status-overdue"
                              }`}
                            >
                              {user.is_active ? COPY.pages.team.active : COPY.pages.team.inactive}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger>
                                <MoreHorizontal className="w-4 h-4 text-tunet-text-muted" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                  <Pencil className="w-4 h-4 mr-2" />
                                  {COPY.pages.team.edit}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openDeleteDialog(user)}
                                  className="text-status-overdue"
                                >
                                  <UserX className="w-4 h-4 mr-2" />
                                  {COPY.pages.team.deactivateOrDelete}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-tunet-surface border-tunet-border">
          <DialogHeader>
            <DialogTitle className="text-tunet-text">
              {editingUser ? COPY.pages.team.editStaff : COPY.pages.team.addStaffForm}
            </DialogTitle>
            <DialogDescription className="text-tunet-text-muted">
              {editingUser ? COPY.pages.team.updateMember : COPY.pages.team.addNewMember}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="user-name" className="text-tunet-text">{COPY.pages.team.fullName} *</Label>
              <Input
                id="user-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="cth. Ahmad Fauzi"
                className="bg-tunet-bg border-tunet-border text-tunet-text"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-role" className="text-tunet-text">{COPY.pages.team.role} *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => {
                  if (value === "admin" || value === "noc" || value === "foc" || value === "marketing") {
                    setFormData({ ...formData, role: value });
                  }
                }}
              >
                <SelectTrigger id="user-role" className="bg-tunet-bg border-tunet-border text-tunet-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-tunet-surface border-tunet-border">
                  <SelectItem value="admin" className="text-tunet-text">Admin</SelectItem>
                  <SelectItem value="noc" className="text-tunet-text">NOC</SelectItem>
                  <SelectItem value="foc" className="text-tunet-text">FOC</SelectItem>
                  <SelectItem value="marketing" className="text-tunet-text">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-phone" className="text-tunet-text">{COPY.pages.team.phone} *</Label>
              <Input
                id="user-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="cth. 081234567890"
                className="bg-tunet-bg border-tunet-border text-tunet-text"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-pin" className="text-tunet-text">{COPY.pages.team.pinLabel} *</Label>
              <Input
                id="user-pin"
                value={formData.pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setFormData({ ...formData, pin: val });
                }}
                placeholder="cth. 1234"
                maxLength={4}
                className="bg-tunet-bg border-tunet-border text-tunet-text font-mono tracking-widest"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-telegram" className="text-tunet-text">{COPY.pages.team.telegramIdOptional}</Label>
              <Input
                id="user-telegram"
                value={formData.telegram_id}
                onChange={(e) => setFormData({ ...formData, telegram_id: e.target.value })}
                placeholder="cth. @username"
                className="bg-tunet-bg border-tunet-border text-tunet-text"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-tunet-border text-tunet-text-muted"
            >
              {COPY.pages.team.cancel}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-tunet-green hover:bg-tunet-green-dark text-white"
            >
              {saving ? COPY.pages.team.saving : editingUser ? COPY.pages.team.saveChanges : COPY.pages.team.addStaff}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-tunet-surface border-tunet-border">
          <DialogHeader>
            <DialogTitle className="text-tunet-text">{COPY.pages.team.manageMember}</DialogTitle>
            <DialogDescription className="text-tunet-text-muted">
              {COPY.pages.team.chooseHowToRemove(deletingUser?.name || "")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="p-4 rounded-lg border border-tunet-border bg-tunet-bg">
              <p className="text-sm font-medium text-tunet-text mb-1">{COPY.pages.team.deactivateRecommended}</p>
              <p className="text-xs text-tunet-text-muted mb-3">
                {COPY.pages.team.deactivateDescription}
              </p>
              <Button
                onClick={handleDeactivate}
                variant="outline"
                className="w-full border-status-overdue/50 text-status-overdue hover:bg-status-overdue/10"
              >
                <UserX className="w-4 h-4 mr-2" />
                {COPY.pages.team.deactivate}
              </Button>
            </div>

            <div className="p-4 rounded-lg border border-status-overdue/30 bg-status-overdue/5">
              <p className="text-sm font-medium text-status-overdue mb-1">{COPY.pages.team.deletePermanently}</p>
              <p className="text-xs text-tunet-text-muted mb-3">
                {COPY.pages.team.deleteDescription}
              </p>
              <Button
                onClick={handleDelete}
                className="w-full bg-status-overdue hover:bg-status-overdue/80 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {COPY.pages.team.deletePermanently}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="border-tunet-border text-tunet-text-muted"
            >
              {COPY.pages.team.cancel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
