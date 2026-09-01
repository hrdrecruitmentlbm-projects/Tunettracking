"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { VersionChecker } from "./version-checker";
import { SessionWarningDialog } from "./session-warning-dialog";
import { CommandPalette } from "./command-palette";
import { User } from "@/types";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessionTimer } from "@/hooks/use-session-timer";
import { COPY } from "@/lib/copy";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const { phase, timeLeft, extendSession, expireSession } = useSessionTimer();

  // Remember where the user was so login can send them back.
  const handleReLogin = () => {
    try {
      sessionStorage.setItem("tutrack-return-url", window.location.pathname);
    } catch {
      // ignore
    }
    router.push("/");
  };

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

  if (phase === "expired") {
    // No blind redirect — the user chooses when to re-login, and their
    // current path is preserved so they land back where they were.
    return (
      <div className="min-h-svh flex items-center justify-center bg-tunet-bg p-4">
        <div className="max-w-sm text-center space-y-4">
          <p className="text-tunet-text text-lg font-medium">{COPY.session.expiredTitle}</p>
          <p className="text-sm text-tunet-text-muted">{COPY.session.expiredDesc}</p>
          <Button
            onClick={handleReLogin}
            className="min-h-11 w-full bg-tunet-green hover:bg-tunet-green-dark text-white"
          >
            {COPY.session.loginAgain}
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-shell min-h-svh flex bg-tunet-bg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:min-h-11 focus:px-4 focus:py-2.5 focus:bg-tunet-signal focus:text-slate-950 focus:rounded-xl focus:text-sm focus:font-semibold focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2 focus:ring-offset-tunet-bg"
      >
        Lewati ke konten utama
      </a>
      {phase === "warning" && timeLeft !== null && (
        <SessionWarningDialog
          timeLeftMs={timeLeft}
          onExtend={extendSession}
          onLogout={expireSession}
        />
      )}
      <Sidebar user={user} />
      <CommandPalette role={user.role} />
      <main
        id="main-content"
        className="relative min-w-0 flex-1 overflow-auto w-full pb-[calc(5rem+env(safe-area-inset-bottom))] md:w-auto md:pb-0"
      >
        <div aria-live="polite" aria-atomic="true" className="sr-only" id="tutrack-live-region" />
        {children}
        <VersionChecker />
      </main>
      <BottomNav role={user.role} />
    </div>
  );
}
