/**
 * Fetch a short-lived signed URL for an attendance selfie from the
 * photo API route. Shared by the admin log table and the matrix popover.
 */
export async function fetchAttendancePhotoUrl(filePath: string): Promise<string> {
  const id = filePath.split("/").pop() || "photo";
  const res = await fetch(
    `/api/attendance/photo/${id}?path=${encodeURIComponent(filePath)}`
  );
  if (!res.ok) throw new Error("Failed to fetch photo");
  const data = (await res.json()) as { url: string };
  return data.url;
}
