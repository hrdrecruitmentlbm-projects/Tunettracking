"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  BellOff,
  ExternalLink,
  X,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { COPY } from "@/lib/copy";
import { getRelativeTime } from "@/lib/time";
import { useMediaQuery } from "@/hooks/use-media-query";

interface NotificationsPanelProps {
  userId: string;
  onCountChange?: (count: number) => void;
}

export function NotificationsPanel({ userId, onCountChange }: NotificationsPanelProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mountId] = useState(() => Math.random().toString(36).slice(2));
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 767px)");

  const loadNotifications = async () => {
    setLoading(true);
    const data = await fetchNotifications(userId);
    setNotifications(data);
    onCountChange?.(data.filter((n) => !n.read).length);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNotifications();

    const channel = supabase
      .channel(`notifications-realtime-${userId}-${mountId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          // Apply incremental insert
          const newNotif = payload.new as Notification;
          setNotifications((prev) => {
            if (prev.some((n) => n.id === newNotif.id)) return prev;
            return [newNotif, ...prev];
          });
          onCountChange?.(notifications.filter((n) => !n.read).length + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read) {
      await markNotificationRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
      onCountChange?.(notifications.filter((n) => !n.read && n.id !== notification.id).length);
    }
    // Navigate to task if task_id exists
    const taskId = notification.task_id || (notification.metadata?.task_id as string | undefined);
    if (taskId) {
      setOpen(false);
      const stored = typeof window !== "undefined" ? localStorage.getItem("tutrack-user") : null;
      const role = stored ? (JSON.parse(stored).role as string) : null;
      if (role === "foc") {
        router.push(`/dashboard/foc?task=${taskId}`);
      } else if (role === "marketing") {
        router.push(`/dashboard/tasks?highlight=${taskId}`);
      } else {
        router.push(`/dashboard/tasks?highlight=${taskId}`);
      }
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead(userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    onCountChange?.(0);
    toast.success(COPY.notifications.markAllRead);
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

  const grouped = useMemo(() => {
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const earlier: Notification[] = [];
    const now = new Date();
    const todayKey = now.toDateString();
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(now.getDate() - 1);
    const yesterdayKey = yesterdayDate.toDateString();

    for (const n of notifications) {
      const k = new Date(n.created_at).toDateString();
      if (k === todayKey) today.push(n);
      else if (k === yesterdayKey) yesterday.push(n);
      else earlier.push(n);
    }
    return [
      { label: COPY.notifications.groups.today, items: today },
      { label: COPY.notifications.groups.yesterday, items: yesterday },
      { label: COPY.notifications.groups.earlier, items: earlier },
    ].filter((g) => g.items.length > 0);
  }, [notifications]);

  // Focus trap + escape key for notification panel
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      triggerRef.current?.focus();
    }
    if (e.key === "Tab" && panelRef.current) {
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  // Focus first notification when panel opens
  useEffect(() => {
    if (open && panelRef.current) {
      const firstFocusable = panelRef.current.querySelector<HTMLElement>(
        'button, [href], [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        aria-label={`Notifikasi${unreadCount > 0 ? ` (${unreadCount} belum dibaca)` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-tunet-text-muted hover:bg-tunet-surface-hover cursor-pointer relative w-full"
      >
        <Bell className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm">{(COPY.notifications as { title: string }).title || "Notifikasi"}</span>
        {unreadCount > 0 && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-tunet-green text-white text-xs rounded-full flex items-center justify-center" aria-hidden="true">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          {isMobile ? (
            /* Mobile: bottom sheet */
            <div
              ref={panelRef}
              role="dialog"
              aria-label={COPY.notifications.title}
              onKeyDown={handleKeyDown}
              className="fixed inset-x-0 bottom-0 z-50 bg-tunet-surface border-t border-tunet-border rounded-t-2xl shadow-lg max-h-[75vh] flex flex-col animate-in slide-in-from-bottom duration-200"
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-tunet-border" />
              </div>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-tunet-border">
                <h3 className="text-sm font-medium text-tunet-text">{COPY.notifications.title}</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="flex items-center gap-1 text-xs text-tunet-green hover:text-tunet-green/80"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      {COPY.notifications.markAllRead}
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-tunet-surface-hover text-tunet-text-muted"
                    aria-label="Tutup notifikasi"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {/* List */}
              <div className="overflow-y-auto flex-1">
                {loading ? (
                  <div className="p-4 text-center text-tunet-text-muted text-xs">
                    Memuat notifikasi...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4">
                    <EmptyState
                      icon={BellOff}
                      title={COPY.empty.noNotifications.title}
                      description={COPY.empty.noNotifications.description}
                      variant="inline"
                    />
                  </div>
                ) : (
                  <div>
                    {grouped.map((group) => (
                      <div key={group.label}>
                        <div className="sticky top-0 bg-tunet-surface px-4 py-1.5 text-[10px] font-medium text-tunet-text-muted uppercase tracking-wide border-b border-tunet-border">
                          {group.label}
                        </div>
                        {group.items.map((notification) => {
                          const hasTaskLink = !!(notification.task_id || notification.metadata?.task_id);
                          return (
                            <button
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`notif-row flex items-start gap-3 px-4 py-3 border-b border-tunet-border w-full text-left transition-colors ${
                                !notification.read
                                  ? "bg-gradient-to-r from-tunet-signal/10 via-tunet-signal/5 to-transparent hover:from-tunet-signal/15"
                                  : "hover:bg-tunet-surface-hover"
                              }`}
                            >
                              <div className="mt-0.5">{getIcon(notification.type)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className={`text-xs font-medium ${notification.read ? "text-tunet-text-muted" : "text-tunet-text"}`}>
                                    {notification.title}
                                  </p>
                                  {hasTaskLink && (
                                    <ExternalLink className="w-3 h-3 text-tunet-text-muted flex-shrink-0" aria-hidden="true" />
                                  )}
                                </div>
                                <p className="text-xs text-tunet-text-muted mt-0.5 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-[10px] text-tunet-text-muted mt-1">
                                  {getRelativeTime(notification.created_at)}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 rounded-full bg-tunet-green flex-shrink-0 mt-1" aria-label="Belum dibaca" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Desktop: right-side popover */
            <div
              ref={panelRef}
              role="dialog"
              aria-label={COPY.notifications.title}
              onKeyDown={handleKeyDown}
              className="absolute left-full top-0 ml-2 w-80 bg-tunet-surface border border-tunet-border rounded-lg shadow-lg z-50 max-h-[70vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-tunet-border">
                <h3 className="text-sm font-medium text-tunet-text">{COPY.notifications.title}</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-xs text-tunet-green hover:text-tunet-green/80"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    {COPY.notifications.markAllRead}
                  </button>
                )}
              </div>

              {/* List */}
              <div className="overflow-y-auto flex-1">
                {loading ? (
                  <div className="p-4 text-center text-tunet-text-muted text-xs">
                    Memuat notifikasi...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4">
                    <EmptyState
                      icon={BellOff}
                      title={COPY.empty.noNotifications.title}
                      description={COPY.empty.noNotifications.description}
                      variant="inline"
                    />
                  </div>
                ) : (
                  <div>
                    {grouped.map((group) => (
                      <div key={group.label}>
                        <div className="sticky top-0 bg-tunet-surface px-4 py-1.5 text-[10px] font-medium text-tunet-text-muted uppercase tracking-wide border-b border-tunet-border">
                          {group.label}
                        </div>
                        {group.items.map((notification) => {
                          const hasTaskLink = !!(notification.task_id || notification.metadata?.task_id);
                          return (
                            <button
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`notif-row flex items-start gap-3 px-4 py-3 border-b border-tunet-border w-full text-left transition-colors ${
                                !notification.read
                                  ? "bg-gradient-to-r from-tunet-signal/10 via-tunet-signal/5 to-transparent hover:from-tunet-signal/15"
                                  : "hover:bg-tunet-surface-hover"
                              }`}
                            >
                              <div className="mt-0.5">{getIcon(notification.type)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className={`text-xs font-medium ${notification.read ? "text-tunet-text-muted" : "text-tunet-text"}`}>
                                    {notification.title}
                                  </p>
                                  {hasTaskLink && (
                                    <ExternalLink className="w-3 h-3 text-tunet-text-muted flex-shrink-0" aria-hidden="true" />
                                  )}
                                </div>
                                <p className="text-xs text-tunet-text-muted mt-0.5 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-[10px] text-tunet-text-muted mt-1">
                                  {getRelativeTime(notification.created_at)}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 rounded-full bg-tunet-green flex-shrink-0 mt-1" aria-label="Belum dibaca" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

