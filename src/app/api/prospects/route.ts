import { NextRequest, NextResponse } from "next/server";
import { fetchProspects, createProspect } from "@/lib/db";
import { getApiSession, requireRole } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const session = getApiSession(request);
    if (!requireRole(session, ["admin", "marketing"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const url = new URL(request.url);
    const includeDeleted = url.searchParams.get("includeDeleted") === "true";

    const prospects = await fetchProspects(includeDeleted);
    return NextResponse.json(prospects);
  } catch (error) {
    console.error("GET /api/prospects error:", error);
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
    const { name, phone, address, location_lat, location_lng, status, notes, assigned_to, area } = body;

    if (!name || !assigned_to) {
      return NextResponse.json(
        { error: "Missing required fields: name, assigned_to" },
        { status: 400 }
      );
    }

    const prospect = await createProspect({
      name,
      phone: phone || "",
      address: address || "",
      location_lat: location_lat || 0,
      location_lng: location_lng || 0,
      status: status || "belum_diproses",
      notes: notes || "",
      assigned_to,
      area: area || "",
    });

    if (!prospect) {
      return NextResponse.json({ error: "Failed to create prospect" }, { status: 500 });
    }

    return NextResponse.json(prospect, { status: 201 });
  } catch (error) {
    console.error("POST /api/prospects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
