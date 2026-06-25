import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import {
  recordAttendance,
  getTodayAttendance,
  getAttendanceHistoryGrouped,
  getAttendanceStats,
} from "@/lib/db-attendance";
import { uploadAttendancePhoto } from "@/lib/google-drive";
import { processImage } from "@/lib/storage";
import { AttendanceType } from "@/types";

function isAttendanceType(v: unknown): v is AttendanceType {
  return v === "berangkat" || v === "pulang";
}

const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

/**
 * POST /api/attendance
 * Record a Berangkat or Pulang check-in for the current user.
 * Supports both JSON (pulang) and FormData (berangkat with photo).
 */
export async function POST(request: NextRequest) {
  try {
    const session = getApiSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";
    let type: AttendanceType;
    let location_lat: number | null = null;
    let location_lng: number | null = null;
    let notes: string | null = null;
    let todos: string[] | undefined;
    let photoFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      // FormData path (berangkat with photo)
      const formData = await request.formData();
      const payloadStr = formData.get("payload") as string | null;
      if (!payloadStr) {
        return NextResponse.json({ error: "Missing payload" }, { status: 400 });
      }

      const payload = JSON.parse(payloadStr);
      type = payload.type;
      location_lat = typeof payload.location_lat === "number" ? payload.location_lat : null;
      location_lng = typeof payload.location_lng === "number" ? payload.location_lng : null;
      notes = typeof payload.notes === "string" ? payload.notes : null;
      todos = Array.isArray(payload.todos)
        ? payload.todos.filter((t: unknown) => typeof t === "string" && t.trim().length > 0)
        : undefined;

      photoFile = formData.get("photo") as File | null;
    } else {
      // JSON path (pulang)
      const body = await request.json();
      type = body.type;
      location_lat = typeof body.location_lat === "number" ? body.location_lat : null;
      location_lng = typeof body.location_lng === "number" ? body.location_lng : null;
      notes = typeof body.notes === "string" ? body.notes : null;
      todos = Array.isArray(body.todos)
        ? body.todos.filter((t: unknown) => typeof t === "string" && t.trim().length > 0)
        : undefined;
    }

    if (!isAttendanceType(type)) {
      return NextResponse.json(
        { error: "type must be 'berangkat' or 'pulang'" },
        { status: 400 }
      );
    }

    // Photo is mandatory for berangkat
    if (type === "berangkat" && !photoFile) {
      return NextResponse.json(
        { error: "Foto wajib diunggah saat absen berangkat" },
        { status: 400 }
      );
    }

    let photoFileId: string | null = null;

    // Process and upload photo if provided
    if (photoFile && type === "berangkat") {
      // Validate file size
      if (photoFile.size > MAX_PHOTO_SIZE) {
        return NextResponse.json(
          { error: "Ukuran foto maksimal 5MB" },
          { status: 400 }
        );
      }

      // Validate file type
      if (!ALLOWED_TYPES.includes(photoFile.type)) {
        return NextResponse.json(
          { error: "Format foto harus JPEG, PNG, atau WebP" },
          { status: 400 }
        );
      }

      try {
        // Convert File to Buffer
        const arrayBuffer = await photoFile.arrayBuffer();
        const inputBuffer = Buffer.from(arrayBuffer);

        // Process image (resize, compress, strip EXIF)
        const processed = await processImage(inputBuffer);

        // Get attendance date for folder structure
        const attendanceDate = new Date().toLocaleDateString("sv-SE", {
          timeZone: "Asia/Jakarta",
        });

        // Generate filename
        const fileName = `${session.userId}-berangkat-${crypto.randomUUID()}.webp`;

        // Upload to Google Drive
        const result = await uploadAttendancePhoto(
          processed.buffer,
          fileName,
          attendanceDate
        );

        photoFileId = result.fileId;
      } catch (photoErr) {
        // Photo upload failed — log but don't block attendance
        console.error("Photo upload failed, recording attendance without photo:", photoErr);
      }
    }

    // Record attendance
    const record = await recordAttendance({
      user_id: session.userId,
      type,
      location_lat,
      location_lng,
      notes,
      todos,
      photo_file_id: photoFileId,
    });

    if (!record) {
      return NextResponse.json(
        { error: "Sudah absen untuk tipe ini hari ini" },
        { status: 409 }
      );
    }

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("POST /api/attendance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/attendance
 * Fetch current user's today + history + stats.
 */
export async function GET(request: NextRequest) {
  try {
    const session = getApiSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [today, history, stats] = await Promise.all([
      getTodayAttendance(session.userId),
      getAttendanceHistoryGrouped(session.userId, 60),
      getAttendanceStats(session.userId),
    ]);

    return NextResponse.json({ today, history, stats });
  } catch (error) {
    console.error("GET /api/attendance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
