"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { User } from "@/types";
import { Loader2 } from "lucide-react";
import { useSessionTimer } from "@/hooks/use-session-timer";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const { isExpired } = useSessionTimer();

  useEffect(() => {
    if (isExpired) {
      const redirectTimer = setTimeout(() => {
        router.push("/");
      }, 2000);
      return () => clearTimeout(redirectTimer);
    }
  }, [isExpired, router]);

  useEffect(() => {
    const stored = localStorage.getItem("tutrack-user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);

        if (!parsed.id || !parsed.role || !parsed.name) {
          router.push("/");
          return;
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(parsed as User);
      } catch {
        router.push("/");
      }
    } else {
      router.push("/");
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tunet-bg">
        <Loader2 className="w-8 h-8 text-tunet-green animate-spin" />
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tunet-bg">
        <div className="text-center space-y-4">
          <p className="text-tunet-text text-lg">Sesi anda telah berakhir, harap login kembali.</p>
          <Loader2 className="w-6 h-6 text-tunet-green animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-tunet-bg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-tunet-green focus:text-white focus:rounded-lg focus:text-sm focus:font-medium focus:outline-none focus:ring-2 focus:ring-tunet-green focus:ring-offset-2 focus:ring-offset-tunet-bg"
      >
        Lewati ke konten utama
      </a>
      <Sidebar user={user} />
      <main id="main-content" className="flex-1 overflow-auto w-full md:w-auto">
        <div aria-live="polite" aria-atomic="true" className="sr-only" id="tutrack-live-region" />
        {children}
      </main>
    </div>
  );
}
