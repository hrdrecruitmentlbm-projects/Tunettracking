"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { TuTrackMark } from "@/components/icons/brand-icons";
import { COPY } from "@/lib/copy";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || COPY.auth.invalidPin);
        setPin("");
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

      toast.success(COPY.auth.welcome(user.name));

      switch (user.role) {
        case "admin":
          router.push("/dashboard/admin");
          break;
        case "noc":
          router.push("/dashboard/noc");
          break;
        case "foc":
          router.push("/dashboard/foc");
          break;
        default:
          router.push("/dashboard/noc");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(COPY.auth.invalidPin);
      setPin("");
    } finally {
      setLoading(false);
    }
  };

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
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-tunet-text">{COPY.auth.pinLabel}</label>
              <Input
                type="password"
                placeholder={COPY.auth.pinPlaceholder}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={4}
                className="text-center text-2xl tracking-[0.5em] bg-tunet-bg border-tunet-border text-tunet-text"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-tunet-green hover:bg-tunet-green-dark text-white"
              disabled={pin.length < 4 || loading}
            >
              {loading ? COPY.auth.signingIn : COPY.auth.signIn}
            </Button>
          </form>
          <div className="mt-6 text-center text-xs text-tunet-text-muted">
            <p>{COPY.auth.contactAdmin}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
