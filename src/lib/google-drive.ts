import { google, drive_v3 } from "googleapis";
import { Readable } from "stream";

let driveClient: drive_v3.Drive | null = null;

function getDriveClient(): drive_v3.Drive {
  if (driveClient) return driveClient;

  const jsonStr = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!jsonStr) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set");
  }

  const credentials = JSON.parse(jsonStr);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  driveClient = google.drive({ version: "v3", auth });
  return driveClient;
}

function getFolderId(): string {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    throw new Error("GOOGLE_DRIVE_FOLDER_ID is not set");
  }
  return folderId;
}

/**
 * Find or create a subfolder within the parent folder.
 * Path segments are created lazily (e.g. "2026" → "06" → "25").
 */
async function ensureFolder(
  drive: drive_v3.Drive,
  parentId: string,
  name: string
): Promise<string> {
  // Search for existing folder
  const res = await drive.files.list({
    q: `'${parentId}' in parents and name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id)",
    spaces: "drive",
  });

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!;
  }

  // Create folder
  const folder = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
  });

  return folder.data.id!;
}

export interface UploadAttendancePhotoResult {
  fileId: string;
  directLink: string;
}

/**
 * Upload an attendance photo to Google Drive.
 * Creates nested folder structure: {year}/{month}/{day}/
 * Returns the file ID and a direct-view link.
 */
export async function uploadAttendancePhoto(
  fileBuffer: Buffer,
  fileName: string,
  attendanceDate: string
): Promise<UploadAttendancePhotoResult> {
  const drive = getDriveClient();
  const rootFolderId = getFolderId();

  // Parse date for folder structure: 2026-06-25 → 2026 / 06 / 25
  const [year, month, day] = attendanceDate.split("-");

  // Ensure folder path exists
  const yearFolder = await ensureFolder(drive, rootFolderId, year);
  const monthFolder = await ensureFolder(drive, yearFolder, month);
  const dayFolder = await ensureFolder(drive, monthFolder, day);

  // Upload file
  const file = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [dayFolder],
    },
    media: {
      mimeType: "image/webp",
      body: Readable.from(fileBuffer),
    },
    fields: "id",
  });

  const fileId = file.data.id!;

  // Make publicly viewable
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  const directLink = `https://drive.google.com/uc?export=view&id=${fileId}`;

  return { fileId, directLink };
}

/**
 * Delete a photo from Google Drive by file ID.
 */
export async function deleteAttendancePhoto(fileId: string): Promise<void> {
  const drive = getDriveClient();
  await drive.files.delete({ fileId });
}

/**
 * Get a direct-view link for a stored photo.
 */
export function getAttendancePhotoUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}
