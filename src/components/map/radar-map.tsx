"use client";

import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { useTheme } from "next-themes";
import L from "leaflet";
import { Location, Task } from "@/types";
import { fetchLocations, fetchTasks, fetchVisits, fetchPings, getFocColor, getSessionDate, LocationVisit, LocationPing } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { getRelativeTime } from "@/lib/time";
import { googleMapsUrl, useReverseGeocode } from "@/lib/geocode";
import { useIncrementalLocations } from "@/hooks/use-incremental-locations";
import { ExternalLink, MapPin, MapPinOff } from "lucide-react";
import { COPY } from "@/lib/copy";
import { CoordsHUD } from "./coords-hud";
import { cn } from "@/lib/utils";
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCompactRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return "baru";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}j`;
  const days = Math.floor(hours / 24);
  return `${days}h`;
}

function createCustomIcon(
  color: string,
  initials: string,
  pulsing: boolean = false,
  highlighted: boolean = false,
  label?: string
) {
  const safeInitials = escapeHtml(initials);
  const safeLabel = label ? escapeHtml(label) : "";
  const size = highlighted ? 48 : 40;
  const height = highlighted ? 56 : 48;

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        ${pulsing ? '<span class="radar-pulse"></span><span class="radar-pulse radar-pulse-delayed"></span>' : ""}
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: ${color};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.35)${highlighted ? `, 0 0 0 4px rgba(16, 185, 129, 0.45)` : ""};
          transition: all 0.2s ease;
        ">${safeInitials}</div>
        <div style="
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid ${color};
          margin-top: -2px;
        "></div>
        ${
          safeLabel
            ? `<div style="
                position: absolute;
                top: ${height + 2}px;
                left: 50%;
                transform: translateX(-50%);
                white-space: nowrap;
                background: rgba(15, 23, 42, 0.9);
                color: #f8fafc;
                border: 1px solid ${highlighted ? "rgba(16, 185, 129, 0.7)" : "rgba(255, 255, 255, 0.16)"};
                border-radius: 9999px;
                padding: 2px 8px;
                font-size: 11px;
                font-weight: 600;
                line-height: 1.25;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
                pointer-events: none;
              ">${safeLabel}</div>`
            : ""
        }
      </div>
    `,
    iconSize: [size, height],
    iconAnchor: [size / 2, height],
    popupAnchor: [0, -height],
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
  visits,
  pings,
  focusUserId,
  focusPoint,
  isHistorical,
}: {
  locations: Location[];
  visits: LocationVisit[];
  pings: LocationPing[];
  focusUserId: string | null;
  focusPoint: { lat: number; lng: number; zoom?: number; key?: number } | null;
  isHistorical: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!focusPoint) return;
    map.setView([focusPoint.lat, focusPoint.lng], focusPoint.zoom ?? 17, {
      animate: true,
    });
  }, [focusPoint, map]);

  useEffect(() => {
    if (!focusUserId || focusPoint) return;
    if (isHistorical) {
      const lastVisit = [...visits]
        .filter((v) => v.user_id === focusUserId)
        .sort((a, b) => a.visit_number - b.visit_number)
        .at(-1);
      if (lastVisit) {
        map.setView([lastVisit.lat, lastVisit.lng], 15, { animate: true });
        return;
      }
      const lastPing = [...pings]
        .filter((p) => p.user_id === focusUserId)
        .sort((a, b) => a.ping_number - b.ping_number)
        .at(-1);
      if (lastPing) {
        map.setView([lastPing.lat, lastPing.lng], 15, { animate: true });
        return;
      }
    }
    const loc = locations.find((l) => l.user_id === focusUserId);
    if (loc) {
      map.setView([loc.lat, loc.lng], 16, { animate: true });
    }
  }, [focusUserId, focusPoint, isHistorical, locations, visits, pings, map]);

  return null;
}

function MapResizeController({ layoutKey }: { layoutKey?: string | number }) {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    let frame = 0;

    const invalidate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => map.invalidateSize({ animate: false }));
    };

    invalidate();
    const observer = new ResizeObserver(invalidate);
    observer.observe(container);
    const transitionTimer = window.setTimeout(invalidate, 320);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(transitionTimer);
      observer.disconnect();
    };
  }, [layoutKey, map]);

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

function PopupLocationDetails({
  lat,
  lng,
  updatedAt,
  accuracy,
  extraLine,
  geocodeEnabled,
}: {
  lat: number;
  lng: number;
  updatedAt: string;
  accuracy?: number | null;
  extraLine?: string;
  geocodeEnabled: boolean;
}) {
  const { address, loading } = useReverseGeocode(lat, lng, geocodeEnabled);

  return (
    <div className="mt-2 space-y-1.5 border-t border-gray-200 pt-2 text-xs text-gray-600">
      <div className="flex items-start gap-1.5 text-gray-800">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
        <span className="leading-snug">
          {address
            ? address
            : loading
            ? "Mencari nama jalan / area..."
            : "Alamat tidak tersedia"}
        </span>
      </div>
      <p className="font-mono text-[11px] text-gray-500">
        {lat.toFixed(5)}, {lng.toFixed(5)}
        {accuracy ? ` · ±${Math.round(accuracy)}m` : ""}
      </p>
      <p className="text-[11px] text-gray-500">
        Update: {formatTimeWIB(updatedAt)} WIB ({getRelativeTime(updatedAt)})
      </p>
      {extraLine && <p className="text-[11px] text-gray-500">{extraLine}</p>}
      <a
        href={googleMapsUrl(lat, lng)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-emerald-700"
      >
        <ExternalLink className="h-3 w-3" />
        Buka di Google Maps
      </a>
    </div>
  );
}

function LiveLocationMarker({
  location,
  color,
  initials,
  hasOverdue,
  isHighlighted,
}: {
  location: Location;
  color: string;
  initials: string;
  hasOverdue: boolean;
  isHighlighted: boolean;
}) {
  const [opened, setOpened] = useState(false);
  const user = location.user;
  if (!user) return null;

  const firstName = user.name.trim().split(/\s+/)[0] || user.name;
  const label = `${firstName} · ${formatCompactRelative(location.updated_at)}`;

  return (
    <Marker
      position={[location.lat, location.lng]}
      icon={createCustomIcon(color, initials, hasOverdue, isHighlighted, label)}
      zIndexOffset={isHighlighted ? 1000 : 0}
      eventHandlers={{
        popupopen: () => setOpened(true),
      }}
    >
      <Popup minWidth={230}>
        <div className="p-0.5">
          <p className="text-sm font-bold text-gray-900">{user.name}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {user.role}
          </p>
          <PopupLocationDetails
            lat={location.lat}
            lng={location.lng}
            updatedAt={location.updated_at}
            accuracy={location.accuracy}
            geocodeEnabled={opened || isHighlighted}
          />
        </div>
      </Popup>
    </Marker>
  );
}

function HistoricalEndpointMarker({
  endpoint,
  color,
  initials,
  isHighlighted,
  sessionDate,
}: {
  endpoint: {
    key: string;
    userId: string;
    userName: string;
    userRole: string;
    lat: number;
    lng: number;
    when: string;
    via: "visit" | "ping";
  };
  color: string;
  initials: string;
  isHighlighted: boolean;
  sessionDate: string;
}) {
  const [opened, setOpened] = useState(false);
  const firstName = endpoint.userName.trim().split(/\s+/)[0] || endpoint.userName;

  return (
    <Marker
      position={[endpoint.lat, endpoint.lng]}
      icon={createCustomIcon(color, initials, false, isHighlighted, firstName)}
      zIndexOffset={isHighlighted ? 1000 : 0}
      eventHandlers={{
        popupopen: () => setOpened(true),
      }}
    >
      <Popup minWidth={230}>
        <div className="p-0.5">
          <p className="text-sm font-bold text-gray-900">{endpoint.userName}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {endpoint.userRole}
          </p>
          <PopupLocationDetails
            lat={endpoint.lat}
            lng={endpoint.lng}
            updatedAt={endpoint.when}
            extraLine={`Sesi ${sessionDate} · ${
              endpoint.via === "visit" ? "Stop terakhir" : "Ping terakhir"
            }`}
            geocodeEnabled={opened || isHighlighted}
          />
        </div>
      </Popup>
    </Marker>
  );
}

/**
 * Basemap configuration.
 *
 * CARTO now requires an API key for basemaps.cartocdn.com — without one the
 * tiles load but render as "API KEY REQUIRED" placeholder images (HTTP 200,
 * so Leaflet shows no error). Keys are ONLY accepted on the new
 * `/rastertiles/...` endpoint with a `?key=` query param (the legacy
 * `/dark_all/...?apikey=` format rejects even valid keys and returns the
 * watermark). If NEXT_PUBLIC_CARTO_API_KEY is set we use the CartoDB Dark
 * Matter tiles with the key; otherwise we fall back to Esri's keyless
 * World Dark Gray Canvas so the map never shows the watermark.
 */
const CARTO_API_KEY = process.env.NEXT_PUBLIC_CARTO_API_KEY;

function cartoBasemap(style: "dark_all" | "light_all") {
  return {
    url: `https://{s}.basemaps.cartocdn.com/rastertiles/${style}/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
    subdomains: "abcd",
  };
}

const ESRI_BASEMAPS = {
  dark: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, Maxar",
    maxZoom: 16,
    subdomains: "abc",
  },
  light: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, Maxar",
    maxZoom: 16,
    subdomains: "abc",
  },
};

/** Pick the basemap matching the active theme, keeping the key-vs-Esri
 * fallback per theme. Falls back to dark when the theme isn't resolved yet
 * (matches the app's defaultTheme="dark"). */
function selectBasemap(resolvedTheme: string | undefined) {
  const theme = resolvedTheme === "light" ? "light" : "dark";
  return CARTO_API_KEY ? cartoBasemap(theme === "dark" ? "dark_all" : "light_all") : ESRI_BASEMAPS[theme];
}

interface RadarMapProps {
  height?: string;
  showRoles?: ("foc" | "noc" | "marketing")[];
  focusUserId?: string | null;
  focusPoint?: { lat: number; lng: number; zoom?: number; key?: number } | null;
  sessionDate?: string; // YYYY-MM-DD; defaults to today's session date
  incidentFilter?: "all" | "active" | "overdue";
  layoutKey?: string | number;
  refreshKey?: number;
  variant?: "card" | "flush";
  coordsClassName?: string;
}

export function RadarMap({
  height = "100%",
  showRoles = ["foc"],
  focusUserId = null,
  focusPoint = null,
  sessionDate,
  incidentFilter = "all",
  layoutKey,
  refreshKey = 0,
  variant = "card",
  coordsClassName,
}: RadarMapProps) {
  const { resolvedTheme } = useTheme();
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
    const v = await fetchVisits(effectiveSessionDate);
    setVisits(v);
  }, [effectiveSessionDate]);

  const reloadPings = useCallback(async () => {
    const p = await fetchPings(effectiveSessionDate);
    setPings(p);
  }, [effectiveSessionDate]);

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
  }, [sessionDate, refreshKey, reloadVisits, reloadPings]);

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
    if (!role || !showRoles.includes(role as "foc" | "noc" | "marketing")) {
      return false;
    }

    if (incidentFilter === "all") return true;

    const assignedTasks = tasks.filter(
      (task) => task.assigned_to === loc.user_id && task.status !== "done"
    );
    if (incidentFilter === "active") {
      return assignedTasks.some((task) => task.status === "in_progress");
    }

    return assignedTasks.some(
      (task) => task.deadline && new Date(task.deadline) < new Date()
    );
  });

  const overdueLocationCount = visibleLocations.filter((location) =>
    tasks.some(
      (task) =>
        task.assigned_to === location.user_id &&
        task.status !== "done" &&
        task.deadline &&
        new Date(task.deadline) < new Date()
    )
  ).length;

  const basemap = selectBasemap(resolvedTheme);

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

  const visibleUserIds = new Set(visibleLocations.map((loc) => loc.user_id));

  // Group visits by user (filtered to focused user if selected, else visible role users)
  const visitsByUser = new Map<string, LocationVisit[]>();
  for (const v of visits) {
    if (focusUserId ? v.user_id !== focusUserId : visibleUserIds.size > 0 && !visibleUserIds.has(v.user_id)) {
      continue;
    }
    const list = visitsByUser.get(v.user_id) ?? [];
    list.push(v);
    visitsByUser.set(v.user_id, list);
  }

  // Group pings by user (filtered to focused user if selected, else visible role users)
  const pingsByUser = new Map<string, LocationPing[]>();
  for (const p of pings) {
    if (focusUserId ? p.user_id !== focusUserId : visibleUserIds.size > 0 && !visibleUserIds.has(p.user_id)) {
      continue;
    }
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
          <HistoricalEndpointMarker
            key={e.key}
            endpoint={e}
            color={color}
            initials={initials}
            isHighlighted={isHighlighted}
            sessionDate={effectiveSessionDate}
          />
        );
      });
  }

  return (
    <div
      style={{ height }}
      role="region"
      aria-label="Peta operasional langsung"
      className={cn(
        "overflow-hidden relative bg-map-panel",
        variant === "card" && "rounded-xl border border-tunet-border"
      )}
    >
      <p className="sr-only" aria-live="polite">
        {visibleLocations.length} personel terlihat di peta.
        {overdueLocationCount > 0
          ? ` ${overdueLocationCount} personel memiliki tugas terlambat.`
          : " Tidak ada personel dengan tugas terlambat pada tampilan ini."}
      </p>
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
        <MapFocusController
          locations={visibleLocations}
          visits={visits}
          pings={pings}
          focusUserId={focusUserId}
          focusPoint={focusPoint}
          isHistorical={isHistorical}
        />
        <MapResizeController layoutKey={layoutKey} />
        <CoordsHUD className={coordsClassName} />
        <TileLayer
          key={basemap.url}
          attribution={basemap.attribution}
          url={basemap.url}
          maxZoom={basemap.maxZoom}
          subdomains={basemap.subdomains}
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
                    <div className="p-1 space-y-1">
                      <p className="font-bold text-gray-900">Ping #{p.ping_number}</p>
                      <p className="font-mono text-xs text-gray-600">
                        {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTimeWIB(p.created_at)} WIB
                      </p>
                      {p.source && (
                        <p className="text-xs text-gray-500">via {p.source}</p>
                      )}
                      <a
                        href={googleMapsUrl(p.lat, p.lng)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Google Maps
                      </a>
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
                    <div className="p-1 space-y-1">
                      <p className="font-bold text-gray-900">Stop #{v.visit_number}</p>
                      <p className="font-mono text-xs text-gray-600">
                        {v.lat.toFixed(5)}, {v.lng.toFixed(5)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Tiba: {formatTimeWIB(v.arrived_at)} WIB
                      </p>
                      {v.departed_at && (
                        <p className="text-xs text-gray-500">
                          Berangkat: {formatTimeWIB(v.departed_at)} WIB
                        </p>
                      )}
                      <p className="text-xs text-gray-700 font-medium">
                        Durasi: {formatDuration(v.duration_minutes)}
                      </p>
                      <a
                        href={googleMapsUrl(v.lat, v.lng)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Google Maps
                      </a>
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
                <LiveLocationMarker
                  key={location.id}
                  location={location}
                  color={color}
                  initials={initials}
                  hasOverdue={hasOverdue}
                  isHighlighted={isHighlighted}
                />
              );
            })}
      </MapContainer>
    </div>
  );
}
