"use client";

import { Delete, CornerDownLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { COPY } from "@/lib/copy";

interface PinKeypadProps {
  onDigit: (digit: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
  disabled?: boolean;
  loading?: boolean;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

const KEY_CLASS =
  "touch-target touch-manipulation select-none flex min-h-14 items-center justify-center rounded-xl border border-tunet-border bg-tunet-surface text-lg font-semibold text-tunet-text transition-colors hover:bg-tunet-surface-hover active:bg-tunet-green/20 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tunet-green/70 motion-reduce:transition-none";

/**
 * Large on-screen numeric keypad for PIN entry — for field tablets and
 * gloved hands. Rendered only on touch devices; desktop users type on the
 * physical keyboard.
 */
export function PinKeypad({
  onDigit,
  onDelete,
  onSubmit,
  canSubmit,
  disabled,
  loading = false,
}: PinKeypadProps) {
  return (
    <div
      className="mx-auto grid w-full max-w-64 grid-cols-3 gap-2.5 touch-manipulation"
      role="group"
      aria-label={COPY.auth.keypadLabel}
    >
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          disabled={disabled}
          className={KEY_CLASS}
          onClick={() => onDigit(key)}
        >
          {key}
        </button>
      ))}

      <button
        type="button"
        disabled={disabled || !canSubmit}
        className={cn(KEY_CLASS, "text-tunet-green")}
        onClick={onSubmit}
        aria-label={COPY.auth.signIn}
      >
        {loading ? (
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        ) : (
          <CornerDownLeft className="size-5" aria-hidden="true" />
        )}
      </button>

      <button
        type="button"
        disabled={disabled}
        className={KEY_CLASS}
        onClick={() => onDigit("0")}
      >
        0
      </button>

      <button
        type="button"
        disabled={disabled}
        className={cn(KEY_CLASS, "text-tunet-text-muted")}
        onClick={onDelete}
        aria-label={COPY.auth.keypadDelete}
      >
        <Delete className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
}
