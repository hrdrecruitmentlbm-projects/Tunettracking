import { NextRequest, NextResponse } from "next/server";
import { restoreTowerSite } from "@/lib/db";
import { getApiSession, requireRole } from "@/lib/api-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getApiSession(request);
    if (!requireRole(session, ["admin"])) {
      return NextResponse.json({ error: "Only admins can restore" }, { status: 403 });
    }

    const { id } = await params;
    const ok = await restoreTowerSite(id);

    if (!ok) {
      return NextResponse.json({ error: "Failed to restore tower site" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/tower-sites/[id]/restore error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
