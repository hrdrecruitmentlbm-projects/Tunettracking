"use client";

import { useEffect, useState } from "react";
import { useMap, useMapEvents } from "react-leaflet";

/**
 * Bottom-left HUD that follows the user's mouse on the map and shows
 * the live lat/lng coordinates. Renders as an absolutely-positioned
 * overlay inside the RadarMap container.
 */
export function CoordsHUD() {
  const map = useMap();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useMapEvents({
    mousemove: (e) => {
      setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
    mouseout: () => {
      setCoords(null);
    },
  });

  // Compute current map center for the static fallback line
  useEffect(() => {
    const c = map.getCenter();
    if (!coords) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCoords({ lat: c.lat, lng: c.lng });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!coords) return null;

  return (
    <div className="absolute bottom-3 left-3 z-[400] pointer-events-none">
      <div className="bg-tunet-surface/90 backdrop-blur-sm border border-tunet-border rounded-md px-3 py-2 shadow-lg">
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
