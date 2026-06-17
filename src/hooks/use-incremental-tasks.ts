"use client";

import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Task } from "@/types";
import { normalizeTaskRow } from "@/lib/db";

export function useIncrementalTasks(
  setTasks: (updater: (prev: Task[]) => Task[]) => void,
  options: { includeDeleted?: boolean } = {}
) {
  const refs = useRef({ setTasks, includeDeleted: options.includeDeleted });

  useEffect(() => {
    refs.current.setTasks = setTasks;
    refs.current.includeDeleted = options.includeDeleted;
  });

  const applyChange = useCallback(
    (eventType: "INSERT" | "UPDATE" | "DELETE", row: Task | { id: string }) => {
      const { setTasks: set, includeDeleted } = refs.current;
      set((prev) => {
        if (eventType === "DELETE") {
          return prev.filter((t) => t.id !== (row as { id: string }).id);
        }
        const incoming = row as Task;
        if (eventType === "INSERT") {
          if (prev.some((t) => t.id === incoming.id)) return prev;
          return [incoming, ...prev];
        }
        if (incoming.deleted_at && !includeDeleted) {
          return prev.filter((t) => t.id !== incoming.id);
        }
        return prev.map((t) =>
          t.id === incoming.id ? { ...t, ...incoming } : t
        );
      });
    },
    []
  );

  useEffect(() => {
    const channel = supabase
      .channel(`tasks-incremental-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        async (payload) => {
          const eventType = payload.eventType as "INSERT" | "UPDATE" | "DELETE";
          if (eventType === "DELETE") {
            applyChange("DELETE", payload.old as { id: string });
            return;
          }
          const rowId = (payload.new as { id: string }).id;
          try {
            const { data, error } = await supabase
              .from("tasks")
              .select(`
                *,
                priority:priorities(name),
                assignee:users!tasks_assigned_to_fkey(id, name, pin, role, phone, telegram_id, is_active, created_at),
                creator:users!tasks_created_by_fkey(id, name, pin, role, phone, telegram_id, is_active, created_at),
                tags:task_tags(tag:tags(id, name, color))
              `)
              .eq("id", rowId)
              .maybeSingle();
            if (!error && data) {
              applyChange(eventType, normalizeTaskRow(data));
            }
          } catch (err) {
            console.error("Failed to refetch task row", err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [applyChange]);
}
