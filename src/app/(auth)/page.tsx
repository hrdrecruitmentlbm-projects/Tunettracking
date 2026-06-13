"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { loginByPin } from "@/lib/db";
import { Wifi } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const user = await loginByPin(pin);

    if (user) {
      localStorage.setItem("tunetops-user", JSON.stringify(user));
      toast.success(`Welcome, ${user.name}!`);

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
    } else {
      toast.error("Invalid PIN. Please try again.");
      setPin("");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-tunet-bg p-4">
      <Card className="w-full max-w-md bg-tunet-surface border-tunet-border">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-tunet-green/20 flex items-center justify-center">
              <Wifi className="w-8 h-8 text-tunet-green" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-tunet-text">TunetOps</CardTitle>
          <CardDescription className="text-tunet-text-muted">
            Network Operations Management System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-tunet-text">Enter PIN</label>
              <Input
                type="password"
                placeholder="Enter your 4-digit PIN"
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
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-6 text-center text-xs text-tunet-text-muted">
            <p>Demo PINs: 1234 (Admin, NOC, FOC)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
