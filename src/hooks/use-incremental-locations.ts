"use client";

import { useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Location } from "@/types";

export function useIncrementalLocations(
  setLocations: (updater: (prev: Location[]) => Location[]) => void
) {
  const applyChange = useCallback(
    (eventType: "INSERT" | "UPDATE" | "DELETE", row: Location | { id: string }) => {
      setLocations((prev) => {
        if (eventType === "DELETE") {
          return prev.filter((l) => l.id !== (row as { id: string }).id);
        }
        const incoming = row as Location;
        if (eventType === "INSERT") {
          if (prev.some((l) => l.id === incoming.id)) return prev;
          return [incoming, ...prev];
        }
        // UPDATE
        return prev.map((l) =>
          l.id === incoming.id ? { ...l, ...incoming } : l
        );
      });
    },
    [setLocations]
  );

  useEffect(() => {
    const channel = supabase
      .channel(`locations-incremental-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "locations" },
        async (payload) => {
          const eventType = payload.eventType as "INSERT" | "UPDATE" | "DELETE";
          if (eventType === "DELETE") {
            applyChange("DELETE", payload.old as { id: string });
            return;
          }
          const rowId = (payload.new as { id: string }).id;
          try {
            const { data, error } = await supabase
              .from("locations")
              .select(`
                *,
                user:users(id, name, pin, role, phone, telegram_id, is_active, created_at)
              `)
              .eq("id", rowId)
              .maybeSingle();
            if (!error && data) {
              applyChange(eventType, data as Location);
            }
          } catch (err) {
            console.error("Failed to refetch location row", err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [applyChange]);
}
