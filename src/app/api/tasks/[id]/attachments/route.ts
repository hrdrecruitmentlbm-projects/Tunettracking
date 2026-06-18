import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { uploadTaskAttachment, deleteTaskAttachment } from "@/lib/db-attachments";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getApiSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: taskId } = await params;

  try {
    const formData = await request.formData();
    const files = formData.getAll("photos") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (files.length > 10) {
      return NextResponse.json({ error: "Maximum 10 photos per upload" }, { status: 400 });
    }

    const results = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds 5MB limit` },
          { status: 400 }
        );
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File ${file.name} has unsupported format` },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const attachment = await uploadTaskAttachment(
        taskId,
        session.userId,
        buffer,
        file.name
      );

      if (attachment) {
        results.push(attachment);
      }
    }

    return NextResponse.json({ ok: true, attachments: results });
  } catch (error) {
    console.error("[POST /api/tasks/.../attachments]", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getApiSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: _taskId } = await params;
  const isAdminOrNoc = session.role === "admin" || session.role === "noc";

  try {
    const body = await request.json();
    const { attachmentId } = body;

    if (!attachmentId) {
      return NextResponse.json({ error: "attachmentId required" }, { status: 400 });
    }

    const success = await deleteTaskAttachment(attachmentId, session.userId, isAdminOrNoc);

    if (!success) {
      return NextResponse.json(
        { error: "Cannot delete: not found, task is done, or insufficient permissions" },
        { status: 403 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/tasks/.../attachments]", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
