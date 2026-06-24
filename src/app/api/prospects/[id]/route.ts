import { NextRequest, NextResponse } from "next/server";
import { updateProspect, softDeleteProspect } from "@/lib/db";
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
    const { name, phone, address, location_lat, location_lng, status, notes, assigned_to, area } = body;

    const prospect = await updateProspect(id, {
      name,
      phone,
      address,
      location_lat,
      location_lng,
      status,
      notes,
      assigned_to,
      area,
    });

    if (!prospect) {
      return NextResponse.json({ error: "Failed to update prospect" }, { status: 500 });
    }

    return NextResponse.json(prospect);
  } catch (error) {
    console.error("PUT /api/prospects/[id] error:", error);
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
    const ok = await softDeleteProspect(id, session!.userId);

    if (!ok) {
      return NextResponse.json({ error: "Failed to delete prospect" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/prospects/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
