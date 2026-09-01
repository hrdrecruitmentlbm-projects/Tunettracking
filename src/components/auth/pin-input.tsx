"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { COPY } from "@/lib/copy";

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Fired when the 4th digit lands or Enter is pressed. */
  onComplete?: (value: string) => void;
  hasError?: boolean;
  disabled?: boolean;
}

const PIN_LENGTH = 4;
const REVEAL_MS = 400;

/**
 * Segmented 4-digit PIN input.
 *
 * A visually-hidden real <input> keeps native keyboard, paste, autofill
 * ("one-time-code") and screen-reader behavior; the boxes are pure
 * presentation. Each digit is briefly revealed, then masked.
 */
export function PinInput({
  value,
  onChange,
  onComplete,
  hasError,
  disabled,
}: PinInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [revealedIndex, setRevealedIndex] = useState<number | null>(null);
  const prevLength = useRef(value.length);

  // Briefly reveal the digit just typed, then mask it.
  useEffect(() => {
    const grew = value.length > prevLength.current;
    prevLength.current = value.length;
    if (!grew) return;
    setRevealedIndex(value.length - 1);
    const timer = setTimeout(() => setRevealedIndex(null), REVEAL_MS);
    return () => clearTimeout(timer);
  }, [value]);

  const handleChange = (raw: string) => {
    if (disabled) return;
    const digits = raw.replace(/\D/g, "").slice(0, PIN_LENGTH);
    onChange(digits);
    if (digits.length === PIN_LENGTH && raw.replace(/\D/g, "").length >= PIN_LENGTH) {
      onComplete?.(digits);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && value.length === PIN_LENGTH && !disabled) {
      onComplete?.(value);
    }
  };

  return (
    <div
      className="relative flex justify-center"
      onClick={() => inputRef.current?.focus()}
    >
      <div
        aria-hidden="true"
        className={cn(
          "flex gap-3",
          hasError && "animate-pin-shake"
        )}
      >
        {Array.from({ length: PIN_LENGTH }).map((_, index) => {
          const char = value[index];
          const isActive = focused && index === value.length;
          return (
            <div
              key={index}
              className={cn(
                "flex h-14 w-12 items-center justify-center rounded-xl border text-2xl font-semibold transition-colors motion-reduce:transition-none",
                hasError
                  ? "border-status-overdue/60 bg-status-overdue/5 text-status-overdue"
                  : isActive
                    ? "border-tunet-green bg-tunet-bg text-tunet-text ring-2 ring-tunet-green/40"
                    : "border-tunet-border bg-tunet-bg text-tunet-text"
              )}
            >
              {char ? (revealedIndex === index ? char : "•") : ""}
            </div>
          );
        })}
      </div>

      <input
        ref={inputRef}
        id="pin-input"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label={COPY.auth.pinAriaLabel}
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        autoFocus
        className="sr-only"
      />

      {/* Live digit-count announcement for screen readers. */}
      <p aria-live="polite" className="sr-only">
        {value.length} dari {PIN_LENGTH} digit
      </p>
    </div>
  );
}
