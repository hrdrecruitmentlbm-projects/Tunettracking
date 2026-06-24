"use client";

import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { Location, Task } from "@/types";
import { fetchLocations, fetchTasks, fetchVisits, fetchPings, getFocColor, getSessionDate, LocationVisit, LocationPing } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { getRelativeTime } from "@/lib/time";
import { useIncrementalLocations } from "@/hooks/use-incremental-locations";
import { MapPinOff } from "lucide-react";
import { COPY } from "@/lib/copy";
import { CoordsHUD } from "./coords-hud";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const ROUTE_LINE_COLOR = "#94A3B8"; // slate-400 — non-monochrome, light enough to read on dark map
const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

// Module-level route cache: key = sorted lat,lng pairs joined → OSRM route coords
// Prevents redundant API calls when the map re-renders with the same points.
const routeCache = new Map<string, [number, number][]>();

function cacheKey(points: [number, number][]): string {
  return points.map((p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`).join(";");
}

async function fetchOSRMRoute(points: [number, number][]): Promise<[number, number][]> {
  if (points.length < 2) return points;

  const key = cacheKey(points);
  const cached = routeCache.get(key);
  if (cached) return cached;

  // OSRM expects lng,lat pairs
  const coords = points.map((p) => `${p[1]},${p[0]}`).join(";");
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return points;
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.length) return points;

    // GeoJSON coords are [lng, lat]; convert to Leaflet [lat, lng]
    const coordsGeoJSON: [number, number][] = data.routes[0].geometry.coordinates;
    const route: [number, number][] = coordsGeoJSON.map((c) => [c[1], c[0]]);
    routeCache.set(key, route);
    return route;
  } catch {
    return points; // fallback to straight line
  }
}

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
        ${pulsing ? '<span class="radar-pulse"></span><span class="radar-pulse radar-pulse-delayed"></span>' : ""}
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
  showRoles?: ("foc" | "noc" | "marketing")[];
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
  const [routes, setRoutes] = useState<Map<string, [number, number][]>>(new Map());

  // When viewing a past date, the `locations` table reflects TODAY's position
  // (not the historical one), so we suppress the live markers and use the
  // last ping/visit of the selected session as the endpoint instead.
  const effectiveSessionDate = sessionDate || getSessionDate();
  const isHistorical = effectiveSessionDate !== getSessionDate();

  useIncrementalLocations(setLocations, !isHistorical);

  const reloadVisits = useCallback(async () => {
    const v = await fetchVisits(sessionDate || new Date().toISOString().split("T")[0]);
    setVisits(v);
  }, [sessionDate]);

  const reloadPings = useCallback(async () => {
    const p = await fetchPings(sessionDate || new Date().toISOString().split("T")[0]);
    setPings(p);
  }, [sessionDate]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Clear stale data to prevent flash of wrong-date markers
      setVisits([]);
      setPings([]);
      setRoutes(new Map());

      const [locs, tks] = await Promise.all([fetchLocations(), fetchTasks()]);
      if (cancelled) return;
      setLocations(locs);
      setTasks(tks);
      await reloadVisits();
      await reloadPings();
    }
    load();

    const visitChannel = supabase
      .channel(`visits-realtime-${sessionDate || "today"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "location_visits" }, () => {
        reloadVisits();
      })
      .subscribe();

    const pingChannel = supabase
      .channel(`pings-realtime-${sessionDate || "today"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "location_pings" }, () => {
        reloadPings();
      })
      .subscribe();

    const taskChannel = supabase
      .channel(`tasks-realtime-${Date.now()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, async () => {
        const tks = await fetchTasks();
        setTasks(tks);
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(visitChannel);
      supabase.removeChannel(pingChannel);
      supabase.removeChannel(taskChannel);
    };
  }, [sessionDate, reloadVisits, reloadPings]);

  // Fetch OSRM road-following routes for each user's ping/visit polyline.
  // Runs whenever pings or visits change. Falls back to straight lines on error.
  useEffect(() => {
    const pingsByUser = new Map<string, LocationPing[]>();
    for (const p of pings) {
      const list = pingsByUser.get(p.user_id) ?? [];
      list.push(p);
      pingsByUser.set(p.user_id, list);
    }

    const visitsByUser = new Map<string, LocationVisit[]>();
    for (const v of visits) {
      const list = visitsByUser.get(v.user_id) ?? [];
      list.push(v);
      visitsByUser.set(v.user_id, list);
    }

    const allUserIds = new Set([...pingsByUser.keys(), ...visitsByUser.keys()]);
    let cancelled = false;

    async function fetchAllRoutes() {
      const newRoutes = new Map<string, [number, number][]>();

      for (const userId of allUserIds) {
        // Ping route: pings sorted by ping_number + current position
        const userPings = (pingsByUser.get(userId) ?? [])
          .sort((a, b) => a.ping_number - b.ping_number);
        const pingPoints: [number, number][] = userPings.map((p) => [p.lat, p.lng]);
        if (pingPoints.length >= 2) {
          const route = await fetchOSRMRoute(pingPoints);
          if (cancelled) return;
          newRoutes.set(`ping-${userId}`, route);
        }

        // Visit route: visits sorted by visit_number
        const userVisits = (visitsByUser.get(userId) ?? [])
          .sort((a, b) => a.visit_number - b.visit_number);
        const visitPoints: [number, number][] = userVisits.map((v) => [v.lat, v.lng]);
        if (visitPoints.length >= 2) {
          const route = await fetchOSRMRoute(visitPoints);
          if (cancelled) return;
          newRoutes.set(`visit-${userId}`, route);
        }
      }

      setRoutes(newRoutes);
    }

    fetchAllRoutes();
    return () => { cancelled = true; };
  }, [pings, visits]);

  const center: [number, number] = [-7.4833, 109.2333];

  const visibleLocations = locations.filter((loc) => {
    const role = loc.user?.role;
    return role && showRoles.includes(role as "foc" | "noc" | "marketing");
  });

  if (false) {

  const getMarkerColor = (location: Location) => {
    if (showRoles.includes("foc") && location.user?.role === "foc") {
      return getFocColor(location.user_id);
    }
    if (location.user?.role === "marketing") {
      return "#A855F7";
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

  // For historical dates, render a marker at the last known position of
  // each user for that session — derived from visits (preferred) or pings.
  // This avoids showing today's position while still giving the user a
  // visual anchor of where they ended their day.
  function renderHistoricalEndpoints() {
    const endpoints: Array<{
      key: string;
      userId: string;
      userName: string;
      userRole: string;
      lat: number;
      lng: number;
      when: string;
      via: "visit" | "ping";
    }> = [];

    // Prefer visits (they have explicit departure times and represent stops).
    for (const [userId, userVisits] of visitsByUser.entries()) {
      const user = visibleLocations.find((l) => l.user_id === userId)?.user;
      if (!user) continue;
      const last = [...userVisits].sort((a, b) => a.visit_number - b.visit_number).at(-1);
      if (!last) continue;
      endpoints.push({
        key: `endpoint-visit-${last.id}`,
        userId,
        userName: user.name,
        userRole: user.role,
        lat: last.lat,
        lng: last.lng,
        when: last.departed_at ?? last.arrived_at,
        via: "visit",
      });
    }

    // For users with pings but no visits (short sessions), fall back to last ping.
    for (const [userId, userPings] of pingsByUser.entries()) {
      if (endpoints.some((e) => e.userId === userId)) continue;
      const user = visibleLocations.find((l) => l.user_id === userId)?.user;
      if (!user) continue;
      const last = [...userPings].sort((a, b) => a.ping_number - b.ping_number).at(-1);
      if (!last) continue;
      endpoints.push({
        key: `endpoint-ping-${last.id}`,
        userId,
        userName: user.name,
        userRole: user.role,
        lat: last.lat,
        lng: last.lng,
        when: last.created_at,
        via: "ping",
      });
    }

    return endpoints
      .filter((e) => showRoles.includes(e.userRole as "foc" | "noc" | "marketing"))
      .map((e) => {
        const initials = e.userName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        const color = e.userRole === "marketing" ? "#A855F7" : getFocColor(e.userId);
        const isHighlighted = focusUserId === e.userId;

        return (
          <Marker
            key={e.key}
            position={[e.lat, e.lng]}
            icon={createCustomIcon(color, initials, false, isHighlighted)}
            zIndexOffset={isHighlighted ? 1000 : 0}
          >
            <Popup>
              <div className="p-1">
                <p className="font-bold">{e.userName}</p>
                <p className="text-sm text-gray-600 uppercase">{e.userRole}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Posisi terakhir: {formatTimeWIB(e.when)} WIB
                </p>
                <p className="text-xs text-gray-500">
                  Sesi: {effectiveSessionDate}
                </p>
                <p className="text-xs text-gray-500">
                  Sumber: {e.via === "visit" ? "Stop terakhir" : "Ping terakhir"}
                </p>
              </div>
            </Popup>
          </Marker>
        );
      });
  }

  return (
    <div style={{ height }} className="rounded-xl overflow-hidden border border-tunet-border relative">
      {isHistorical && pings.length === 0 && visits.length === 0 && (
        <div className="absolute inset-0 z-[400] flex items-center justify-center bg-black/50 pointer-events-none">
          <div className="text-center space-y-2 px-6 py-4 rounded-lg bg-tunet-surface/80 border border-tunet-border">
            <MapPinOff className="w-8 h-8 text-tunet-text-muted mx-auto" />
            <p className="text-sm font-medium text-tunet-text">{COPY.pages.map.noDataTitle}</p>
            <p className="text-xs text-tunet-text-muted">
              {COPY.pages.map.noDataForDate(effectiveSessionDate)}
            </p>
          </div>
        </div>
      )}
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
        <MapFocusController locations={visibleLocations} focusUserId={focusUserId} />
        <CoordsHUD />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Render ping polylines + numbered ping markers per user */}
        {Array.from(pingsByUser.entries()).map(([userId, userPings]) => {
          const color = getFocColor(userId);
          const currentLoc = visibleLocations.find((l) => l.user_id === userId);
          const sortedPings = [...userPings].sort((a, b) => a.ping_number - b.ping_number);

          // Polyline: ping 1 -> ping 2 -> ... -> endpoint
          // For today, endpoint is the current (live) position.
          // For historical dates, endpoint is the last ping of that day.
          const points: [number, number][] = sortedPings.map((p) => [p.lat, p.lng]);
          if (currentLoc && !isHistorical) {
            points.push([Number(currentLoc.lat), Number(currentLoc.lng)]);
          }

          // Use OSRM road-following route if available, otherwise straight line
          const routeKey = `ping-${userId}`;
          const routeCoords = routes.get(routeKey) ?? points;

          return (
            <div key={`pings-${userId}`}>
              {routeCoords.length >= 2 && (
                <Polyline
                  positions={routeCoords}
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
          const userPings = pingsByUser.get(userId) ?? [];
          const lastPing = userPings.length
            ? [...userPings].sort((a, b) => a.ping_number - b.ping_number).at(-1)
            : null;

          // Polyline: visit 1 -> visit 2 -> visit 3 -> ... -> endpoint
          // For today, endpoint is the current (live) position.
          // For historical dates, endpoint is the last visit (or last ping as fallback).
          const points: [number, number][] = userVisits.map((v) => [v.lat, v.lng]);
          if (!isHistorical && currentLoc) {
            points.push([Number(currentLoc.lat), Number(currentLoc.lng)]);
          } else if (isHistorical && userVisits.length === 0 && lastPing) {
            // No visits, but we have pings — show a single point for context.
            points.push([lastPing.lat, lastPing.lng]);
          }

          // Use OSRM road-following route if available, otherwise straight line
          const routeKey = `visit-${userId}`;
          const routeCoords = routes.get(routeKey) ?? points;

          return (
            <div key={`route-${userId}`}>
              {routeCoords.length >= 2 && (
                <Polyline
                  positions={routeCoords}
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

        {/* Render endpoint markers:
             - Today: current live position markers (from `locations` table).
             - Historical: the last visit/ping of that day (so the marker
               reflects where the user actually was, not where they are now). */}
        {isHistorical
          ? renderHistoricalEndpoints()
          : visibleLocations.map((location) => {
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
