import { NextRequest, NextResponse } from "next/server";
import { updateUser, deleteUser } from "@/lib/db";
import { getApiSession, requireRole } from "@/lib/api-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getApiSession(request);
    if (!requireRole(session, ["admin"])) {
      return NextResponse.json(
        { error: "Only admins can update users" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, role, phone, pin, telegram_id } = body;

    if (pin && (pin.length !== 4 || !/^\d{4}$/.test(pin))) {
      return NextResponse.json(
        { error: "PIN must be exactly 4 digits" },
        { status: 400 }
      );
    }

    if (role && !["admin", "noc", "foc", "marketing"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be admin, noc, foc, or marketing" },
        { status: 400 }
      );
    }

    const user = await updateUser(id, { name, role, phone, pin, telegram_id });

    if (!user) {
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("PUT /api/users/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getApiSession(request);
    if (!requireRole(session, ["admin"])) {
      return NextResponse.json(
        { error: "Only admins can delete users" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const success = await deleteUser(id);

    if (!success) {
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }

    return NextResponse.json({ message: "User deactivated" });
  } catch (error) {
    console.error("DELETE /api/users/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
