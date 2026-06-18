import { supabase } from "./supabase";
import { Attachment, TaskStatus } from "@/types";

export async function uploadTaskAttachment(
  taskId: string,
  userId: string,
  fileBuffer: Buffer,
  fileName: string,
  phase?: "in_progress" | "completed"
): Promise<Attachment | null> {
  if (!phase) {
    const { data: task } = await supabase
      .from("tasks")
      .select("status")
      .eq("id", taskId)
      .maybeSingle();
    if (task) {
      const status = task.status as TaskStatus;
      phase = status === "done" || status === "review" ? "completed" : "in_progress";
    } else {
      phase = "in_progress";
    }
  }

  const { uploadToStorage } = await import("./storage");
  const { filePath, fileSize } = await uploadToStorage(taskId, fileBuffer);

  const { data, error } = await supabase
    .from("task_attachments")
    .insert({
      task_id: taskId,
      uploaded_by: userId,
      file_path: filePath,
      file_name: fileName,
      file_size: fileSize,
      mime_type: "image/webp",
      upload_phase: phase,
    })
    .select()
    .single();

  if (error) {
    console.error("[uploadTaskAttachment] insert failed:", error);
    return null;
  }

  const { getSignedUrl } = await import("./storage");
  const signed_url = await getSignedUrl(filePath);

  return { ...data, signed_url } as Attachment;
}

export async function deleteTaskAttachment(
  attachmentId: string,
  userId: string,
  isAdminOrNoc: boolean
): Promise<boolean> {
  const { data: attachment } = await supabase
    .from("task_attachments")
    .select("id, task_id, file_path, uploaded_by")
    .eq("id", attachmentId)
    .maybeSingle();

  if (!attachment) return false;

  const { data: task } = await supabase
    .from("tasks")
    .select("status")
    .eq("id", attachment.task_id)
    .maybeSingle();

  if (task?.status === "done") return false;

  if (!isAdminOrNoc && attachment.uploaded_by !== userId) return false;

  const { deleteFromStorage } = await import("./storage");
  const thumbPath = attachment.file_path.replace(".webp", "-thumb.webp");
  await deleteFromStorage([attachment.file_path, thumbPath]);

  const { error } = await supabase
    .from("task_attachments")
    .delete()
    .eq("id", attachmentId);

  if (error) {
    console.error("[deleteTaskAttachment] delete failed:", error);
    return false;
  }

  return true;
}

export async function fetchTaskAttachments(taskId: string): Promise<Attachment[]> {
  const { data, error } = await supabase
    .from("task_attachments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[fetchTaskAttachments] error:", error);
    return [];
  }

  if (!data || data.length === 0) return [];

  const { getSignedUrl } = await import("./storage");
  const attachments = await Promise.all(
    (data as Attachment[]).map(async (att) => {
      try {
        const signed_url = await getSignedUrl(att.file_path);
        return { ...att, signed_url };
      } catch {
        return att;
      }
    })
  );

  return attachments;
}
