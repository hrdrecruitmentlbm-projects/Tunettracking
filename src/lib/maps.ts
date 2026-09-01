import { Task } from "@/types";

/**
 * Google Maps directions deep link for a task's location.
 * Opens the native Maps app on Android/iOS; web Maps on desktop.
 * Falls back to a place search on the location name when coordinates are
 * missing or zeroed out (task form defaults to Bandung 0,0 on parse failure).
 */
export function buildRouteUrl(
  task: Pick<Task, "location_lat" | "location_lng" | "location_name">
): string {
  const hasCoords =
    Number.isFinite(task.location_lat) &&
    Number.isFinite(task.location_lng) &&
    !(task.location_lat === 0 && task.location_lng === 0);

  if (hasCoords) {
    return `https://www.google.com/maps/dir/?api=1&destination=${task.location_lat},${task.location_lng}&travelmode=driving`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    task.location_name
  )}`;
}
