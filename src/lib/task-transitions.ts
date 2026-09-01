import { toast } from "sonner";
import { STATUS_CONFIG, TaskStatus } from "@/types";
import { COPY } from "./copy";

interface NotifyStatusTransitionOptions {
  taskId: string;
  taskTitle: string;
  from: TaskStatus;
  to: TaskStatus;
  /** Re-applies `from` when the user taps undo (must pass silent: true). */
  onUndo: (taskId: string, previousStatus: TaskStatus) => void;
}

/**
 * Success toast for a task status transition with a 6-second undo action.
 *
 * Status advances are low-risk and reversible, so no confirm dialogs —
 * "Batalkan" reverts the change through the same update path. Destructive
 * actions (delete) keep their confirmation dialogs.
 */
export function notifyStatusTransition({
  taskId,
  taskTitle,
  from,
  to,
  onUndo,
}: NotifyStatusTransitionOptions) {
  toast.success(`"${taskTitle}" → ${STATUS_CONFIG[to].label}`, {
    action: {
      label: COPY.actions.undo,
      onClick: () => onUndo(taskId, from),
    },
    duration: 6000,
  });
}
