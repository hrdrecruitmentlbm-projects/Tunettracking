import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Service-role client for server-side storage operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

const BUCKET = "task-attachments";
const MAX_DIMENSION = 800;
const JPEG_QUALITY = 60;
const THUMB_SIZE = 200;

export interface ProcessedPhoto {
  buffer: Buffer;
  thumbnailBuffer: Buffer;
  width: number;
  height: number;
  fileSize: number;
}

/**
 * Compress and process an image buffer:
 * - Converts to WebP
 * - Resizes to max 800px
 * - Strips EXIF (privacy)
 * - Generates 200px thumbnail
 */
export async function processImage(inputBuffer: Buffer): Promise<ProcessedPhoto> {
  const metadata = await sharp(inputBuffer).metadata();

  // Process main image: resize, convert to WebP, strip EXIF
  const processed = await sharp(inputBuffer)
    .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: JPEG_QUALITY })
    .toBuffer({ resolveWithObject: true });

  // Generate thumbnail
  const thumbnail = await sharp(inputBuffer)
    .resize(THUMB_SIZE, THUMB_SIZE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 70 })
    .toBuffer();

  return {
    buffer: processed.data,
    thumbnailBuffer: thumbnail,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    fileSize: processed.info.size,
  };
}

/**
 * Upload a photo to Supabase Storage.
 * Returns the storage paths for the original and thumbnail.
 */
export async function uploadToStorage(
  taskId: string,
  fileBuffer: Buffer
): Promise<{ filePath: string; thumbnailPath: string; fileSize: number }> {
  const photoId = crypto.randomUUID();
  const filePath = `${taskId}/${photoId}.webp`;
  const thumbnailPath = `${taskId}/${photoId}-thumb.webp`;

  const { buffer, thumbnailBuffer, fileSize } = await processImage(fileBuffer);

  // Convert to Blob to avoid Buffer serialization issues in @supabase/storage-js
  const blob = new Blob([new Uint8Array(buffer)], { type: "image/webp" });
  const thumbBlob = new Blob([new Uint8Array(thumbnailBuffer)], { type: "image/webp" });

  // Upload original
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filePath, blob, { contentType: "image/webp" });
  if (uploadError) throw uploadError;

  // Upload thumbnail
  const { error: thumbError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(thumbnailPath, thumbBlob, { contentType: "image/webp" });
  if (thumbError) throw thumbError;

  return { filePath, thumbnailPath, fileSize };
}

/**
 * Delete files from Supabase Storage.
 */
export async function deleteFromStorage(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await supabaseAdmin.storage.from(BUCKET).remove(paths);
  if (error) console.error("[storage] delete error:", error);
}

/**
 * Generate a signed URL for a storage path (1 hour TTL).
 */
export async function getSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}

/**
 * Generate signed URLs for multiple paths.
 */
export async function getSignedUrls(paths: string[]): Promise<string[]> {
  const urls = await Promise.all(paths.map(getSignedUrl));
  return urls;
}

const ATTENDANCE_PREFIX = "attendance";

/**
 * Upload an attendance photo to Supabase Storage.
 * Path: attendance/{userId}/{date}-{uuid}.webp
 */
export async function uploadAttendanceToStorage(
  userId: string,
  fileBuffer: Buffer
): Promise<{ filePath: string; fileSize: number }> {
  const photoId = crypto.randomUUID();
  const date = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
  const filePath = `${ATTENDANCE_PREFIX}/${userId}/${date}-${photoId}.webp`;

  const { buffer, fileSize } = await processImage(fileBuffer);

  // Convert to Blob to avoid Buffer serialization issues in @supabase/storage-js
  const blob = new Blob([new Uint8Array(buffer)], { type: "image/webp" });

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filePath, blob, { contentType: "image/webp" });
  if (error) throw error;

  return { filePath, fileSize };
}

/**
 * Get a signed URL for an attendance photo (1 hour TTL).
 */
export async function getAttendanceSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}
