import { NextRequest, NextResponse } from "next/server";
import { fetchTowerSites, createTowerSite } from "@/lib/db";
import { getApiSession, requireRole } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const session = getApiSession(request);
    if (!requireRole(session, ["admin", "marketing"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const url = new URL(request.url);
    const includeDeleted = url.searchParams.get("includeDeleted") === "true";

    const towerSites = await fetchTowerSites(includeDeleted);
    return NextResponse.json(towerSites);
  } catch (error) {
    console.error("GET /api/tower-sites error:", error);
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
    const { name, site_type, contact_person, contact_phone, location_lat, location_lng, status, notes, assigned_to } = body;

    if (!name || !assigned_to) {
      return NextResponse.json(
        { error: "Missing required fields: name, assigned_to" },
        { status: 400 }
      );
    }

    const towerSite = await createTowerSite({
      name,
      site_type: site_type || "other",
      contact_person: contact_person || "",
      contact_phone: contact_phone || "",
      location_lat: location_lat || 0,
      location_lng: location_lng || 0,
      status: status || "baru_ditugaskan",
      notes: notes || "",
      assigned_to,
    });

    if (!towerSite) {
      return NextResponse.json({ error: "Failed to create tower site" }, { status: 500 });
    }

    return NextResponse.json(towerSite, { status: 201 });
  } catch (error) {
    console.error("POST /api/tower-sites error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
