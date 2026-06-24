import { NextRequest, NextResponse } from "next/server";
import { updateTowerSite, softDeleteTowerSite } from "@/lib/db";
import { getApiSession, requireRole } from "@/lib/api-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getApiSession(request);
    if (!requireRole(session, ["admin", "marketing"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, site_type, contact_person, contact_phone, location_lat, location_lng, status, notes, assigned_to } = body;

    const towerSite = await updateTowerSite(id, {
      name,
      site_type,
      contact_person,
      contact_phone,
      location_lat,
      location_lng,
      status,
      notes,
      assigned_to,
    });

    if (!towerSite) {
      return NextResponse.json({ error: "Failed to update tower site" }, { status: 500 });
    }

    return NextResponse.json(towerSite);
  } catch (error) {
    console.error("PUT /api/tower-sites/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getApiSession(request);
    if (!requireRole(session, ["admin", "marketing"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const ok = await softDeleteTowerSite(id, session!.userId);

    if (!ok) {
      return NextResponse.json({ error: "Failed to delete tower site" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tower-sites/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
