"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { Location, Task } from "@/types";
import { fetchLocations, fetchTasks, fetchVisits, fetchPings, getFocColor, LocationVisit, LocationPing } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { getRelativeTime } from "@/lib/time";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const ROUTE_LINE_COLOR = "#94A3B8"; // slate-400 — non-monochrome, light enough to read on dark map

function createCustomIcon(
  color: string,
  initials: string,
  pulsing: boolean = false,
  highlighted: boolean = false
) {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="
          width: ${highlighted ? 48 : 40}px;
          height: ${highlighted ? 48 : 40}px;
          border-radius: 50%;
          background: ${color};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3)${highlighted ? `, 0 0 0 4px rgba(16, 185, 129, 0.4)` : ""};
          ${pulsing ? `animation: pulse 2s infinite;` : ""}
          transition: all 0.2s ease;
        ">${initials}</div>
        <div style="
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid ${color};
          margin-top: -2px;
        "></div>
      </div>
    `,
    iconSize: [highlighted ? 48 : 40, highlighted ? 56 : 48],
    iconAnchor: [highlighted ? 24 : 20, highlighted ? 56 : 48],
    popupAnchor: [0, highlighted ? -56 : -48],
  });
}

function createVisitIcon(color: string, number: number) {
  return L.divIcon({
    className: "visit-marker",
    html: `
      <div style="
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
        box-shadow: 0 0 0 2px rgba(255,255,255,0.9);
      ">${number}</div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });
}

function createPingIcon(color: string, number: number) {
  return L.divIcon({
    className: "ping-marker",
    html: `
      <div style="
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: #0f172a;
        border: 2px solid ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${color};
        font-weight: bold;
        font-size: 11px;
        box-shadow: 0 0 0 1px rgba(0,0,0,0.4);
      ">${number}</div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
}

function MapFocusController({
  locations,
  focusUserId,
}: {
  locations: Location[];
  focusUserId: string | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (!focusUserId) return;
    const loc = locations.find((l) => l.user_id === focusUserId);
    if (loc) {
      map.setView([loc.lat, loc.lng], 16, { animate: true });
    }
  }, [focusUserId, locations, map]);
  return null;
}

function formatTimeWIB(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(minutes: number | null): string {
  if (minutes == null) return "—";
  if (minutes < 60) return `${minutes} menit`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} jam` : `${h} jam ${m} menit`;
}

interface RadarMapProps {
  height?: string;
  showRoles?: ("foc" | "noc")[];
  focusUserId?: string | null;
  sessionDate?: string; // YYYY-MM-DD; defaults to today's session date
}

export function RadarMap({
  height = "100%",
  showRoles = ["foc"],
  focusUserId = null,
  sessionDate,
}: RadarMapProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [visits, setVisits] = useState<LocationVisit[]>([]);
  const [pings, setPings] = useState<LocationPing[]>([]);

  async function reloadVisits() {
    const v = await fetchVisits(sessionDate || new Date().toISOString().split("T")[0]);
    setVisits(v);
  }

  async function reloadPings() {
    const p = await fetchPings(sessionDate || new Date().toISOString().split("T")[0]);
    setPings(p);
  }

  useEffect(() => {
    async function load() {
      const [locs, tks] = await Promise.all([fetchLocations(), fetchTasks()]);
      setLocations(locs);
      setTasks(tks);
      await reloadVisits();
      await reloadPings();
    }
    load();

    const locChannel = supabase
      .channel("locations-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "locations" }, async () => {
        const locs = await fetchLocations();
        setLocations(locs);
      })
      .subscribe();

    const taskChannel = supabase
      .channel("tasks-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, async () => {
        const tks = await fetchTasks();
        setTasks(tks);
      })
      .subscribe();

    const visitChannel = supabase
      .channel("visits-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "location_visits" }, () => {
        reloadVisits();
      })
      .subscribe();

    const pingChannel = supabase
      .channel("pings-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "location_pings" }, () => {
        reloadPings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(locChannel);
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(visitChannel);
      supabase.removeChannel(pingChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionDate]);

  const center: [number, number] = [-7.4833, 109.2333];

  const visibleLocations = locations.filter((loc) => {
    const role = loc.user?.role;
    return role && showRoles.includes(role as "foc" | "noc");
  });

  const getMarkerColor = (location: Location) => {
    if (showRoles.includes("foc") && location.user?.role === "foc") {
      return getFocColor(location.user_id);
    }
    const hasActiveTask = tasks.some(
      (t) => t.assigned_to === location.user_id && t.status === "in_progress"
    );
    const hasOverdueTask = tasks.some(
      (t) =>
        t.assigned_to === location.user_id &&
        t.deadline &&
        new Date(t.deadline) < new Date() &&
        t.status !== "done"
    );

    if (hasOverdueTask) return "#EF4444";
    if (hasActiveTask) return "#10B981";
    return "#F59E0B";
  };

  // Group visits by user
  const visitsByUser = new Map<string, LocationVisit[]>();
  for (const v of visits) {
    const list = visitsByUser.get(v.user_id) ?? [];
    list.push(v);
    visitsByUser.set(v.user_id, list);
  }

  // Group pings by user
  const pingsByUser = new Map<string, LocationPing[]>();
  for (const p of pings) {
    const list = pingsByUser.get(p.user_id) ?? [];
    list.push(p);
    pingsByUser.set(p.user_id, list);
  }

  return (
    <div style={{ height }} className="rounded-xl overflow-hidden border border-tunet-border">
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
        <MapFocusController locations={visibleLocations} focusUserId={focusUserId} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Render ping polylines + numbered ping markers per user */}
        {Array.from(pingsByUser.entries()).map(([userId, userPings]) => {
          const color = getFocColor(userId);
          const currentLoc = visibleLocations.find((l) => l.user_id === userId);
          const sortedPings = [...userPings].sort((a, b) => a.ping_number - b.ping_number);

          // Polyline: ping 1 → ping 2 → ... → current position
          const points: [number, number][] = sortedPings.map((p) => [p.lat, p.lng]);
          if (currentLoc) points.push([Number(currentLoc.lat), Number(currentLoc.lng)]);

          return (
            <div key={`pings-${userId}`}>
              {points.length >= 2 && (
                <Polyline
                  positions={points}
                  pathOptions={{ color: ROUTE_LINE_COLOR, weight: 2, opacity: 0.7, dashArray: "4 6" }}
                />
              )}
              {sortedPings.map((p) => (
                <Marker
                  key={p.id}
                  position={[p.lat, p.lng]}
                  icon={createPingIcon(color, p.ping_number)}
                >
                  <Popup>
                    <div className="p-1">
                      <p className="font-bold">Ping #{p.ping_number}</p>
                      <p className="text-xs text-gray-600">📍 {p.lat.toFixed(5)}, {p.lng.toFixed(5)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeWIB(p.created_at)} WIB
                      </p>
                      {p.source && (
                        <p className="text-xs text-gray-500">via {p.source}</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </div>
          );
        })}

        {/* Render visit polylines + numbered stop markers per user */}
        {Array.from(visitsByUser.entries()).map(([userId, userVisits]) => {
          const color = getFocColor(userId);
          const currentLoc = visibleLocations.find((l) => l.user_id === userId);

          // Polyline: visit 1 → visit 2 → visit 3 → ... → current position
          const points: [number, number][] = userVisits.map((v) => [v.lat, v.lng]);
          if (currentLoc) points.push([Number(currentLoc.lat), Number(currentLoc.lng)]);

          return (
            <div key={`route-${userId}`}>
              {points.length >= 2 && (
                <Polyline
                  positions={points}
                  pathOptions={{ color: ROUTE_LINE_COLOR, weight: 3, opacity: 0.8 }}
                />
              )}
              {userVisits.map((v) => (
                <Marker
                  key={v.id}
                  position={[v.lat, v.lng]}
                  icon={createVisitIcon(color, v.visit_number)}
                >
                  <Popup>
                    <div className="p-1">
                      <p className="font-bold">Stop #{v.visit_number}</p>
                      <p className="text-xs text-gray-600">📍 {v.lat.toFixed(5)}, {v.lng.toFixed(5)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Tiba: {formatTimeWIB(v.arrived_at)} WIB
                      </p>
                      {v.departed_at && (
                        <p className="text-xs text-gray-500">
                          Berangkat: {formatTimeWIB(v.departed_at)} WIB
                        </p>
                      )}
                      <p className="text-xs text-gray-700 mt-1 font-medium">
                        Durasi: {formatDuration(v.duration_minutes)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </div>
          );
        })}

        {/* Render current position markers (existing behavior) */}
        {visibleLocations.map((location) => {
          const user = location.user;
          if (!user) return null;

          const initials = user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          const color = getMarkerColor(location);
          const hasOverdue = tasks.some(
            (t) =>
              t.assigned_to === location.user_id &&
              t.deadline &&
              new Date(t.deadline) < new Date() &&
              t.status !== "done"
          );
          const isHighlighted = focusUserId === location.user_id;

          return (
            <Marker
              key={location.id}
              position={[location.lat, location.lng]}
              icon={createCustomIcon(color, initials, hasOverdue, isHighlighted)}
              zIndexOffset={isHighlighted ? 1000 : 0}
            >
              <Popup>
                <div className="p-1">
                  <p className="font-bold">{user.name}</p>
                  <p className="text-sm text-gray-600 uppercase">{user.role}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Update: {getRelativeTime(location.updated_at)}
                  </p>
                  {location.accuracy && (
                    <p className="text-xs text-gray-500">
                      Akurasi: ±{Math.round(location.accuracy)}m
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
