import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/lib/db";
import { getApiSession, requireRole } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const session = getApiSession(request);
    if (!requireRole(session, ["admin"])) {
      return NextResponse.json(
        { error: "Only admins can create users" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, role, phone, pin, telegram_id } = body;

    if (!name || !role || !phone || !pin) {
      return NextResponse.json(
        { error: "Missing required fields: name, role, phone, pin" },
        { status: 400 }
      );
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must be exactly 4 digits" },
        { status: 400 }
      );
    }

    if (!["admin", "noc", "foc", "marketing"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be admin, noc, foc, or marketing" },
        { status: 400 }
      );
    }

    const user = await createUser({ name, role, phone, pin, telegram_id });

    if (!user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
