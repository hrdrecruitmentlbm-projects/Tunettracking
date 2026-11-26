"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { TuTrackMark } from "@/components/icons/brand-icons";
import { PinInput } from "@/components/auth/pin-input";
import { PinKeypad } from "@/components/auth/pin-keypad";
import { useMediaQuery } from "@/hooks/use-media-query";
import { COPY } from "@/lib/copy";

const LOGIN_TIMEOUT_MS = 15_000;

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [errorCount, setErrorCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const redirectFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Touch devices get the on-screen keypad; desktop uses the keyboard.
  const isTouch = useMediaQuery("(hover: none)");

  useEffect(() => {
    return () => {
      if (redirectFallbackRef.current) {
        clearTimeout(redirectFallbackRef.current);
      }
    };
  }, []);

  const handleLogin = async (pinToSubmit?: string) => {
    const value = pinToSubmit ?? pin;
    if (value.length < 4 || loading || redirecting) return;

    setLoading(true);
    setErrorMessage(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LOGIN_TIMEOUT_MS);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: value }),
        signal: controller.signal,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          res.status === 429
            ? "Terlalu banyak percobaan login. Tunggu 1 menit lalu coba lagi."
            : res.status === 401
              ? COPY.auth.invalidPin
              : data.error || COPY.auth.loginError;
        setErrorMessage(msg);
        toast.error(msg);
        setPin("");
        setErrorCount((count) => count + 1);
        return;
      }

      const user = data.user;
      localStorage.setItem(
        "tutrack-user",
        JSON.stringify({
          id: user.id,
          name: user.name,
          role: user.role,
        })
      );
      localStorage.setItem("tutrack-login-at", String(Date.now()));

      toast.success(COPY.auth.welcome(user.name));

      // Return the user to where their session expired (if it was a
      // dashboard route their role can access).
      let returnUrl: string | null = null;
      if (typeof window !== "undefined") {
        returnUrl = sessionStorage.getItem("tutrack-return-url");
        sessionStorage.removeItem("tutrack-return-url");
      }

      let destination: string;
      switch (user.role) {
        case "admin":
          destination = "/dashboard/admin";
          break;
        case "noc":
          destination = "/dashboard/noc";
          break;
        case "foc":
          destination = "/dashboard/foc";
          break;
        case "marketing":
          destination = "/dashboard/marketing";
          break;
        case "finance":
          // Presence-only role: Absensi is the home page.
          destination = "/dashboard/attendance";
          break;
        default:
          destination = "/dashboard/noc";
      }

      if (returnUrl && returnUrl.startsWith("/dashboard")) {
        destination = returnUrl;
      }

      setRedirecting(true);
      router.replace(destination);
      // Fallback for slow mobile connections where Next client transition stalls
      redirectFallbackRef.current = setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.assign(destination);
        }
      }, 3000);
    } catch (error) {
      const isTimeout =
        error instanceof DOMException && error.name === "AbortError";
      const msg = isTimeout
        ? "Koneksi lambat atau server belum merespons. Silakan coba masuk lagi."
        : "Gagal terhubung ke server. Periksa internet lalu coba lagi.";
      console.error("Login error:", error);
      setErrorMessage(msg);
      toast.error(msg);
      setErrorCount((count) => count + 1);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleTouchDigit = (digit: string) => {
    if (loading || redirecting || pin.length >= 4) return;
    setErrorMessage(null);
    const nextPin = (pin + digit).slice(0, 4);
    setPin(nextPin);
    if (nextPin.length === 4) {
      void handleLogin(nextPin);
    }
  };

  const handleTouchDelete = () => {
    if (loading || redirecting) return;
    setErrorMessage(null);
    setPin((prev) => prev.slice(0, -1));
  };

  const showInlineError = Boolean(errorMessage) || (errorCount > 0 && pin.length === 0);
  const isBusy = loading || redirecting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-tunet-bg p-4">
      <Card className="w-full max-w-md bg-tunet-surface border-tunet-border">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-tunet-green/20 flex items-center justify-center">
              <TuTrackMark className="w-8 h-8 text-tunet-green" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-tunet-text">{COPY.auth.title}</CardTitle>
          <CardDescription className="text-tunet-text-muted">
            {COPY.auth.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleLogin();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label htmlFor="pin-input" className="text-sm font-medium text-tunet-text">
                {COPY.auth.pinLabel}
              </label>
              <PinInput
                value={pin}
                onChange={(val) => {
                  setErrorMessage(null);
                  setPin(val);
                }}
                onComplete={(value) => handleLogin(value)}
                hasError={showInlineError}
                disabled={isBusy}
                disableVirtualKeyboard={isTouch}
              />
              {isBusy && (
                <div
                  role="status"
                  className="flex items-center justify-center gap-2 pt-1 text-xs font-medium text-tunet-green"
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{redirecting ? "Membuka dasbor..." : COPY.auth.signingIn}</span>
                </div>
              )}
              {!isBusy && showInlineError && (
                <p
                  role="alert"
                  className="text-center text-xs font-medium text-status-overdue"
                >
                  {errorMessage || COPY.auth.invalidPin}
                </p>
              )}
            </div>

            {isTouch ? (
              <PinKeypad
                onDigit={handleTouchDigit}
                onDelete={handleTouchDelete}
                onSubmit={() => handleLogin()}
                canSubmit={pin.length === 4}
                disabled={isBusy}
                loading={isBusy}
              />
            ) : (
              <Button
                type="submit"
                className="w-full bg-tunet-green hover:bg-tunet-green-dark text-white"
                disabled={pin.length < 4 || isBusy}
              >
                {isBusy ? (redirecting ? "Membuka dasbor..." : COPY.auth.signingIn) : COPY.auth.signIn}
              </Button>
            )}
          </form>
          <div className="mt-6 text-center text-xs text-tunet-text-muted">
            <p>{COPY.auth.contactAdmin}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

