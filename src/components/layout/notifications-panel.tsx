"use client";

import { useState, useEffect } from "react";
import { Notification } from "@/types";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Clock,
  Info,
  CheckCheck,
} from "lucide-react";

interface NotificationsPanelProps {
  userId: string;
  onCountChange?: (count: number) => void;
}

export function NotificationsPanel({ userId, onCountChange }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    const data = await fetchNotifications(userId);
    setNotifications(data);
    onCountChange?.(data.filter((n) => !n.read).length);
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    onCountChange?.(notifications.filter((n) => !n.read && n.id !== id).length);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead(userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    onCountChange?.(0);
    toast.success("All notifications marked as read");
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "task_assigned":
        return <Info className="w-4 h-4 text-blue-400" />;
      case "status_update":
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case "overdue":
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      default:
        return <Bell className="w-4 h-4 text-tunet-text-muted" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-tunet-text-muted hover:bg-tunet-surface-hover cursor-pointer relative w-full"
      >
        <Bell className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm">Notifications</span>
        {unreadCount > 0 && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-tunet-green text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-full top-0 ml-2 w-80 bg-tunet-surface border border-tunet-border rounded-lg shadow-lg z-50 max-h-[70vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-tunet-border">
              <h3 className="text-sm font-medium text-tunet-text">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs text-tunet-green hover:text-tunet-green/80"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-4 text-center text-tunet-text-muted text-xs">
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-tunet-text-muted text-xs">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => !notification.read && handleMarkRead(notification.id)}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-tunet-border cursor-pointer hover:bg-tunet-surface-hover transition-colors ${
                      !notification.read ? "bg-tunet-green/5" : ""
                    }`}
                  >
                    <div className="mt-0.5">{getIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${notification.read ? "text-tunet-text-muted" : "text-tunet-text"}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-tunet-text-muted mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-tunet-text-muted mt-1">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-tunet-green flex-shrink-0 mt-1" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
