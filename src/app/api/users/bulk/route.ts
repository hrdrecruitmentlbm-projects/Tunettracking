import { NextRequest, NextResponse } from "next/server";
import { bulkCreateUsers, CreateUserInput } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const users = body?.users;
    const autoGeneratePins = body?.auto_generate_pins !== false;

    if (!Array.isArray(users)) {
      return NextResponse.json(
        { error: "users must be an array" },
        { status: 400 }
      );
    }

    if (users.length === 0) {
      return NextResponse.json(
        { error: "users array is empty" },
        { status: 400 }
      );
    }

    if (users.length > 100) {
      return NextResponse.json(
        { error: "Cannot create more than 100 users in a single request" },
        { status: 400 }
      );
    }

    for (const u of users) {
      if (!u.name || !u.phone) {
        return NextResponse.json(
          { error: "Each user must have name and phone" },
          { status: 400 }
        );
      }
      const role = u.role || "foc";
      if (!["admin", "noc", "foc"].includes(role)) {
        return NextResponse.json(
          { error: "Role must be admin, noc, or foc" },
          { status: 400 }
        );
      }
      if (u.pin && (u.pin.length !== 4 || !/^\d{4}$/.test(u.pin))) {
        return NextResponse.json(
          { error: "PIN must be exactly 4 digits" },
          { status: 400 }
        );
      }
    }

    const inputs: CreateUserInput[] = users.map((u: CreateUserInput) => ({
      name: u.name,
      role: (u.role || "foc") as CreateUserInput["role"],
      phone: u.phone,
      pin: u.pin || "",
      telegram_id: u.telegram_id || undefined,
    }));

    const result = await bulkCreateUsers(inputs, autoGeneratePins);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/users/bulk error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
