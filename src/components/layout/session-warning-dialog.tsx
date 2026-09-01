"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";

interface SessionWarningDialogProps {
  timeLeftMs: number;
  onExtend: () => void;
  onLogout: () => void;
}

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Non-blocking "session about to expire" modal, shown 2 minutes before the
 * session ends. "Perpanjang" resets the timer without a page reload;
 * "Logout" ends the session immediately.
 */
export function SessionWarningDialog({
  timeLeftMs,
  onExtend,
  onLogout,
}: SessionWarningDialogProps) {
  return (
    <Dialog open>
      <DialogContent className="bg-tunet-surface sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-tunet-text">
            {COPY.session.warningTitle}
          </DialogTitle>
          <DialogDescription className="font-mono tabular-nums">
            {COPY.session.expiresIn(formatCountdown(timeLeftMs))}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onLogout}>
            {COPY.session.logout}
          </Button>
          <Button
            onClick={onExtend}
            className="bg-tunet-green hover:bg-tunet-green-dark text-white"
          >
            {COPY.session.extend}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
