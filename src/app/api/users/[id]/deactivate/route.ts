import { NextRequest, NextResponse } from "next/server";
import { deactivateUser } from "@/lib/db";
import { getApiSession, requireRole } from "@/lib/api-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getApiSession(request);
    if (!requireRole(session, ["admin"])) {
      return NextResponse.json(
        { error: "Only admins can deactivate users" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const success = await deactivateUser(id);

    if (!success) {
      return NextResponse.json({ error: "Failed to deactivate user" }, { status: 500 });
    }

    return NextResponse.json({ message: "User deactivated" });
  } catch (error) {
    console.error("PATCH /api/users/[id]/deactivate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
