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
import { Plus, MoreHorizontal, Pencil, Trash2, UserX, Eye, EyeOff } from "lucide-react";

interface StaffFormData {
  name: string;
  role: "admin" | "noc" | "foc";
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

  const loadUsers = async () => {
    const data = await fetchUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
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
      toast.error("Name, phone, and PIN are required");
      return;
    }

    if (formData.pin.length !== 4 || !/^\d{4}$/.test(formData.pin)) {
      toast.error("PIN must be exactly 4 digits");
      return;
    }

    setSaving(true);

    try {
      if (editingUser) {
        const updated = await updateUser(editingUser.id, formData);
        if (updated) {
          toast.success(`${formData.name} updated`);
          setDialogOpen(false);
          loadUsers();
        } else {
          toast.error("Failed to update user");
        }
      } else {
        const created = await createUser(formData);
        if (created) {
          toast.success(`${formData.name} added`);
          setDialogOpen(false);
          loadUsers();
        } else {
          toast.error("Failed to create user");
        }
      }
    } catch {
      toast.error("An error occurred");
    }

    setSaving(false);
  };

  const handleDeactivate = async () => {
    if (!deletingUser) return;

    const success = await deactivateUser(deletingUser.id);
    if (success) {
      toast.success(`${deletingUser.name} deactivated`);
      setDeleteDialogOpen(false);
      setDeletingUser(null);
      loadUsers();
    } else {
      toast.error("Failed to deactivate user");
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    const success = await deleteUser(deletingUser.id);
    if (success) {
      toast.success(`${deletingUser.name} deleted permanently`);
      setDeleteDialogOpen(false);
      setDeletingUser(null);
      loadUsers();
    } else {
      toast.error("Failed to delete user");
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

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-tunet-bg">
        {/* Header */}
        <div className="h-16 border-b border-tunet-border flex items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-semibold text-tunet-text">Team Management</h1>
            <p className="text-xs text-tunet-text-muted">Add, edit, and manage staff members</p>
          </div>
          <Button onClick={openCreateDialog} className="bg-tunet-green hover:bg-tunet-green-dark text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Staff
          </Button>
        </div>

        {/* Stats */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-tunet-surface border-tunet-border">
            <CardContent className="p-4">
              <p className="text-sm text-tunet-text-muted">Total Staff</p>
              <p className="text-2xl font-bold text-tunet-text">{users.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-tunet-surface border-tunet-border">
            <CardContent className="p-4">
              <p className="text-sm text-tunet-text-muted">Active</p>
              <p className="text-2xl font-bold text-tunet-green">{users.filter((u) => u.is_active).length}</p>
            </CardContent>
          </Card>
          <Card className="bg-tunet-surface border-tunet-border">
            <CardContent className="p-4">
              <p className="text-sm text-tunet-text-muted">Inactive</p>
              <p className="text-2xl font-bold text-status-overdue">{users.filter((u) => !u.is_active).length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Staff table */}
        <div className="px-6 pb-6">
          <Card className="bg-tunet-surface border-tunet-border">
            <CardHeader>
              <CardTitle className="text-tunet-text">All Staff</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-tunet-text-muted">Loading...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-tunet-text-muted mb-4">No staff members yet</p>
                  <Button onClick={openCreateDialog} className="bg-tunet-green hover:bg-tunet-green-dark text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Staff
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-tunet-border">
                        <TableHead className="text-tunet-text-muted">Name</TableHead>
                        <TableHead className="text-tunet-text-muted">Role</TableHead>
                        <TableHead className="text-tunet-text-muted">Phone</TableHead>
                        <TableHead className="text-tunet-text-muted">PIN</TableHead>
                        <TableHead className="text-tunet-text-muted">Telegram</TableHead>
                        <TableHead className="text-tunet-text-muted">Status</TableHead>
                        <TableHead className="text-tunet-text-muted text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
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
                              {user.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md p-2 text-tunet-text-muted hover:bg-tunet-surface-hover">
                                <MoreHorizontal className="w-4 h-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-tunet-surface border-tunet-border">
                                <DropdownMenuItem
                                  onClick={() => openEditDialog(user)}
                                  className="text-tunet-text cursor-pointer"
                                >
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openDeleteDialog(user)}
                                  className="text-status-overdue cursor-pointer"
                                >
                                  <UserX className="w-4 h-4 mr-2" />
                                  Deactivate / Delete
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-tunet-surface border-tunet-border">
          <DialogHeader>
            <DialogTitle className="text-tunet-text">
              {editingUser ? "Edit Staff" : "Add Staff"}
            </DialogTitle>
            <DialogDescription className="text-tunet-text-muted">
              {editingUser
                ? "Update staff member information"
                : "Add a new staff member to the team"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-tunet-text">Full Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ahmad Fauzi"
                className="bg-tunet-bg border-tunet-border text-tunet-text"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-tunet-text">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => {
                  if (value === "admin" || value === "noc" || value === "foc") {
                    setFormData({ ...formData, role: value });
                  }
                }}
              >
                <SelectTrigger className="bg-tunet-bg border-tunet-border text-tunet-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-tunet-surface border-tunet-border">
                  <SelectItem value="admin" className="text-tunet-text">Admin</SelectItem>
                  <SelectItem value="noc" className="text-tunet-text">NOC</SelectItem>
                  <SelectItem value="foc" className="text-tunet-text">FOC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-tunet-text">Phone *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. 081234567890"
                className="bg-tunet-bg border-tunet-border text-tunet-text"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-tunet-text">PIN (4 digits) *</Label>
              <Input
                value={formData.pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setFormData({ ...formData, pin: val });
                }}
                placeholder="e.g. 1234"
                maxLength={4}
                className="bg-tunet-bg border-tunet-border text-tunet-text font-mono tracking-widest"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-tunet-text">Telegram ID (optional)</Label>
              <Input
                value={formData.telegram_id}
                onChange={(e) => setFormData({ ...formData, telegram_id: e.target.value })}
                placeholder="e.g. @username"
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
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-tunet-green hover:bg-tunet-green-dark text-white"
            >
              {saving ? "Saving..." : editingUser ? "Save Changes" : "Add Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-tunet-surface border-tunet-border">
          <DialogHeader>
            <DialogTitle className="text-tunet-text">Manage Staff Member</DialogTitle>
            <DialogDescription className="text-tunet-text-muted">
              Choose how to remove <strong className="text-tunet-text">{deletingUser?.name}</strong> from the system.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="p-4 rounded-lg border border-tunet-border bg-tunet-bg">
              <p className="text-sm font-medium text-tunet-text mb-1">Deactivate (Recommended)</p>
              <p className="text-xs text-tunet-text-muted mb-3">
                Staff member cannot log in, but their data and task history are preserved.
              </p>
              <Button
                onClick={handleDeactivate}
                variant="outline"
                className="w-full border-status-overdue/50 text-status-overdue hover:bg-status-overdue/10"
              >
                <UserX className="w-4 h-4 mr-2" />
                Deactivate
              </Button>
            </div>

            <div className="p-4 rounded-lg border border-status-overdue/30 bg-status-overdue/5">
              <p className="text-sm font-medium text-status-overdue mb-1">Delete Permanently</p>
              <p className="text-xs text-tunet-text-muted mb-3">
                This will permanently remove all data. This action cannot be undone.
              </p>
              <Button
                onClick={handleDelete}
                className="w-full bg-status-overdue hover:bg-status-overdue/80 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Permanently
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="border-tunet-border text-tunet-text-muted"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
