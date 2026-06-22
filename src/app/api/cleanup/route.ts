import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const CLEANUP_SECRET = process.env.CLEANUP_SECRET || "";

export async function POST(request: Request) {
  // Verify the secret header
  const secretHeader = request.headers.get("x-cleanup-secret");
  if (CLEANUP_SECRET && secretHeader !== CLEANUP_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  try {
    // 1) Cleanup old location pings, visits, read notifications, expired uploads
    const { data, error } = await supabase.rpc("cleanup_old_location_data");

    if (error) {
      console.error("Cleanup error:", error);
      return NextResponse.json(
        { error: "Cleanup failed", detail: error.message },
        { status: 500 }
      );
    }

    // 2) Cleanup attendance records older than 60 days
    const { data: attendanceDeleted, error: attendanceError } = await supabase.rpc(
      "cleanup_old_attendance"
    );

    if (attendanceError) {
      console.error("Attendance cleanup error:", attendanceError);
    }

    // Get storage stats after cleanup
    const { data: stats } = await supabase.rpc("get_storage_stats");

    return NextResponse.json({
      ok: true,
      message: "Data retention cleanup completed",
      storageStats: stats,
      attendanceDeleted: attendanceDeleted ?? 0,
    });
  } catch (error) {
    console.error("Cleanup endpoint error:", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // GET endpoint to check current storage status
  try {
    const { data: stats, error } = await supabase.rpc("get_storage_stats");

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch stats", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      storageStats: stats,
      retentionPolicy: "30 days",
    });
  } catch (error) {
    console.error("Stats endpoint error:", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
