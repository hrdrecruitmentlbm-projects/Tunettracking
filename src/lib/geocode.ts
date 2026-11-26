"use client";

import { useEffect, useState } from "react";

const addressCache = new Map<string, string>();
const inFlight = new Map<string, Promise<string | null>>();

function keyFor(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  const key = keyFor(lat, lng);
  const cached = addressCache.get(key);
  if (cached) return cached;

  const existing = inFlight.get(key);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lng)}&zoom=17&accept-language=id`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        address?: Record<string, string>;
        display_name?: string;
      };
      const addr = data.address;
      if (addr) {
        const parts = [
          addr.road || addr.pedestrian || addr.residential,
          addr.village || addr.suburb || addr.neighbourhood || addr.hamlet,
          addr.city_district || addr.district || addr.town || addr.city || addr.county,
        ].filter(Boolean);
        if (parts.length > 0) {
          const formatted = parts.join(", ");
          addressCache.set(key, formatted);
          return formatted;
        }
      }
      if (data.display_name) {
        const short = data.display_name.split(",").slice(0, 3).join(",").trim();
        addressCache.set(key, short);
        return short;
      }
      return null;
    } catch {
      return null;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

export interface ReverseGeocodeResult {
  address: string | null;
  loading: boolean;
}

export function useReverseGeocode(
  lat: number | null | undefined,
  lng: number | null | undefined,
  enabled: boolean = true
): ReverseGeocodeResult {
  const valid =
    enabled &&
    typeof lat === "number" &&
    typeof lng === "number" &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng);

  const cacheKey = valid ? keyFor(lat, lng) : "";
  const [resolved, setResolved] = useState<{
    key: string;
    address: string | null;
  } | null>(null);

  useEffect(() => {
    if (!valid || !cacheKey) return;
    if (addressCache.has(cacheKey)) return;

    let cancelled = false;
    reverseGeocode(lat, lng).then((addr) => {
      if (!cancelled) {
        setResolved({ key: cacheKey, address: addr });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [valid, cacheKey, lat, lng]);

  if (!valid || !cacheKey) {
    return { address: null, loading: false };
  }

  const cached = addressCache.get(cacheKey);
  if (cached) {
    return { address: cached, loading: false };
  }

  if (resolved?.key === cacheKey) {
    return { address: resolved.address, loading: false };
  }

  return { address: null, loading: true };
}

export function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
