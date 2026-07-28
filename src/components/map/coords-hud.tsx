"use client";

import { useState } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { cn } from "@/lib/utils";

/**
 * Bottom-left HUD that follows the user's mouse on the map and shows
 * the live lat/lng coordinates. Renders as an absolutely-positioned
 * overlay inside the RadarMap container.
 */
export function CoordsHUD({ className }: { className?: string }) {
  const map = useMap();
  const [coords, setCoords] = useState(() => {
    const center = map.getCenter();
    return { lat: center.lat, lng: center.lng };
  });

  useMapEvents({
    mousemove: (e) => {
      setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
    mouseout: () => {
      const center = map.getCenter();
      setCoords({ lat: center.lat, lng: center.lng });
    },
    moveend: () => {
      const center = map.getCenter();
      setCoords({ lat: center.lat, lng: center.lng });
    },
  });

  return (
    <div
      aria-hidden="true"
      className={cn("absolute bottom-3 left-3 z-[400] pointer-events-none", className)}
    >
      <div className="bg-tunet-surface/90 backdrop-blur-md border border-tunet-border/80 rounded-lg px-3 py-2 shadow-lg">
        <div className="font-mono tabular-nums text-[10px] text-tunet-text leading-tight">
          {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
        </div>
        <div className="text-[9px] uppercase tracking-wider text-tunet-text-muted mt-0.5">
          WGS-84
        </div>
      </div>
    </div>
  );
}
