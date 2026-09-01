"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { TuTrackMark } from "@/components/icons/brand-icons";
import { PinInput } from "@/components/auth/pin-input";
import { PinKeypad } from "@/components/auth/pin-keypad";
import { useMediaQuery } from "@/hooks/use-media-query";
import { COPY } from "@/lib/copy";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [errorCount, setErrorCount] = useState(0);
  const [loading, setLoading] = useState(false);
  // Touch devices get the on-screen keypad; desktop uses the keyboard.
  const isTouch = useMediaQuery("(hover: none)");

  const handleLogin = async (pinToSubmit?: string) => {
    const value = pinToSubmit ?? pin;
    if (value.length < 4 || loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: value }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || COPY.auth.invalidPin);
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
        default:
          destination = "/dashboard/noc";
      }

      if (returnUrl && returnUrl.startsWith("/dashboard")) {
        destination = returnUrl;
      }

      router.push(destination);
    } catch (error) {
      console.error("Login error:", error);
      toast.error(COPY.auth.loginError);
      setPin("");
      setErrorCount((count) => count + 1);
    } finally {
      setLoading(false);
    }
  };

  const showInlineError = errorCount > 0 && pin.length === 0;

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
                onChange={setPin}
                onComplete={(value) => handleLogin(value)}
                hasError={showInlineError}
                disabled={loading}
              />
              {showInlineError && (
                <p
                  role="alert"
                  className="text-center text-xs font-medium text-status-overdue"
                >
                  {COPY.auth.invalidPin}
                </p>
              )}
            </div>

            {isTouch ? (
              <PinKeypad
                onDigit={(digit) => setPin((prev) => (prev + digit).slice(0, 4))}
                onDelete={() => setPin((prev) => prev.slice(0, -1))}
                onSubmit={() => handleLogin()}
                canSubmit={pin.length === 4}
                disabled={loading}
              />
            ) : (
              <Button
                type="submit"
                className="w-full bg-tunet-green hover:bg-tunet-green-dark text-white"
                disabled={pin.length < 4 || loading}
              >
                {loading ? COPY.auth.signingIn : COPY.auth.signIn}
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

