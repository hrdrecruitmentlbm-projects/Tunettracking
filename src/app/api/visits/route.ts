import { NextRequest, NextResponse } from "next/server";
import { fetchVisitLogs, createVisitLog } from "@/lib/db";
import { getApiSession, requireRole } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const session = getApiSession(request);
    if (!requireRole(session, ["admin", "marketing"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get("type") as "prospek" | "tower" | null;
    const visitedBy = url.searchParams.get("visited_by");
    const limit = url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!) : undefined;

    const visits = await fetchVisitLogs({
      type: type || undefined,
      visited_by: visitedBy || undefined,
      limit,
    });

    return NextResponse.json(visits);
  } catch (error) {
    console.error("GET /api/visits error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getApiSession(request);
    if (!requireRole(session, ["admin", "marketing"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { type, prospect_id, tower_id, visited_by, status_snapshot, notes, location_lat, location_lng } = body;

    if (!type || !visited_by || !status_snapshot || location_lat === undefined || location_lng === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: type, visited_by, status_snapshot, location_lat, location_lng" },
        { status: 400 }
      );
    }

    const result = await createVisitLog({
      type,
      prospect_id,
      tower_id,
      visited_by,
      status_snapshot,
      notes: notes || "",
      location_lat,
      location_lng,
    });

    if (!result.data) {
      return NextResponse.json({ error: result.error || "Failed to create visit log" }, { status: 500 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error("POST /api/visits error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
