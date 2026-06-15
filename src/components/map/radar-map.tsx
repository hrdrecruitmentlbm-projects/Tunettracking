"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Location, Task } from "@/types";
import { fetchLocations, fetchTasks } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { getRelativeTime } from "@/lib/time";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

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

interface RadarMapProps {
  height?: string;
  showRoles?: ("foc" | "noc")[];
  focusUserId?: string | null;
}

export function RadarMap({
  height = "100%",
  showRoles = ["foc"],
  focusUserId = null,
}: RadarMapProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    async function load() {
      const [locs, tks] = await Promise.all([fetchLocations(), fetchTasks()]);
      setLocations(locs);
      setTasks(tks);
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

    return () => {
      supabase.removeChannel(locChannel);
      supabase.removeChannel(taskChannel);
    };
  }, []);

  const center: [number, number] = [-7.4833, 109.2333];

  const visibleLocations = locations.filter((loc) => {
    const role = loc.user?.role;
    return role && showRoles.includes(role as "foc" | "noc");
  });

  const getMarkerColor = (location: Location) => {
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

  return (
    <div style={{ height }} className="rounded-xl overflow-hidden border border-tunet-border">
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
        <MapFocusController locations={visibleLocations} focusUserId={focusUserId} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
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
