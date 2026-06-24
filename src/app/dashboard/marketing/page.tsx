"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { fetchProspects, fetchTowerSites, fetchVisitLogs } from "@/lib/db";
import { Prospect, TowerSite, VisitLog, PROSPECT_STATUS_CONFIG, TOWER_SITE_STATUS_CONFIG } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Users,
  ClipboardCheck,
  Building,
  Target,
} from "lucide-react";
import { COPY } from "@/lib/copy";
import { useHeartbeat } from "@/hooks/use-heartbeat";

export default function MarketingDashboardPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [towerSites, setTowerSites] = useState<TowerSite[]>([]);
  const [visits, setVisits] = useState<VisitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  useHeartbeat({ userId: currentUserId });

  useEffect(() => {
    const stored = localStorage.getItem("tutrack-user");
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentUserId(JSON.parse(stored).id);
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    async function load() {
      const [p, t, v] = await Promise.all([
        fetchProspects(),
        fetchTowerSites(),
        fetchVisitLogs({ limit: 10 }),
      ]);
      setProspects(p);
      setTowerSites(t);
      setVisits(v);
      setLoading(false);
    }
    load();
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const activeProspects = prospects.filter(
    (p) => p.status !== "acc" && p.status !== "tidak"
  );
  const accProspects = prospects.filter((p) => p.status === "acc");
  const accTowerSites = towerSites.filter((t) => t.status === "acc");
  const pendingTowerSites = towerSites.filter((t) => t.status === "pending");
  const visitsToday = visits.filter((v) => v.created_at.startsWith(today));

  // Pipeline data
  const prospectPipeline = Object.entries(PROSPECT_STATUS_CONFIG).map(([key, config]) => ({
    status: key,
    label: config.label,
    color: config.color,
    count: prospects.filter((p) => p.status === key).length,
  }));

  const towerPipeline = Object.entries(TOWER_SITE_STATUS_CONFIG).map(([key, config]) => ({
    status: key,
    label: config.label,
    color: config.color,
    count: towerSites.filter((t) => t.status === key).length,
  }));

  if (loading) {
    return (
      <DashboardLayout>
        <MarketingDashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-tunet-bg">
        <div className="h-16 border-b border-tunet-border flex items-center px-6">
          <div>
            <h1 className="text-lg font-semibold text-tunet-text">{COPY.pages.marketing.title}</h1>
            <p className="text-xs text-tunet-text-muted">{COPY.pages.marketing.subtitle}</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-tunet-surface border-tunet-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-tunet-text-muted">{COPY.pages.marketing.activeProspects}</p>
                    <p className="text-2xl font-semibold text-tunet-text">{activeProspects.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-tunet-surface border-tunet-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-tunet-text-muted">{COPY.pages.marketing.visitsToday}</p>
                    <p className="text-2xl font-semibold text-tunet-text">{visitsToday.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-tunet-green/20 flex items-center justify-center">
                    <ClipboardCheck className="w-5 h-5 text-tunet-green" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-tunet-surface border-tunet-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-tunet-text-muted">{COPY.pages.marketing.towerApproved}</p>
                    <p className="text-2xl font-semibold text-tunet-text">{accTowerSites.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Building className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-tunet-surface border-tunet-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-tunet-text-muted">{COPY.pages.marketing.totalVisits}</p>
                    <p className="text-2xl font-semibold text-tunet-text">{visits.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pipeline Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-tunet-surface border-tunet-border">
              <CardHeader>
                <CardTitle className="text-sm text-tunet-text">{COPY.pages.marketing.prospectPipeline}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {prospectPipeline.map((item) => (
                  <div key={item.status} className="flex items-center gap-3">
                    <div className="w-24 text-xs text-tunet-text-muted truncate">{item.label}</div>
                    <div className="flex-1 h-6 bg-tunet-bg rounded overflow-hidden">
                      <div
                        className="h-full rounded transition-all"
                        style={{
                          width: `${prospects.length > 0 ? (item.count / prospects.length) * 100 : 0}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-tunet-text w-8 text-right">{item.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-tunet-surface border-tunet-border">
              <CardHeader>
                <CardTitle className="text-sm text-tunet-text">{COPY.pages.marketing.towerPipeline}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {towerPipeline.map((item) => (
                  <div key={item.status} className="flex items-center gap-3">
                    <div className="w-24 text-xs text-tunet-text-muted truncate">{item.label}</div>
                    <div className="flex-1 h-6 bg-tunet-bg rounded overflow-hidden">
                      <div
                        className="h-full rounded transition-all"
                        style={{
                          width: `${towerSites.length > 0 ? (item.count / towerSites.length) * 100 : 0}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-tunet-text w-8 text-right">{item.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recent Visits */}
          <Card className="bg-tunet-surface border-tunet-border">
            <CardHeader>
              <CardTitle className="text-sm text-tunet-text">{COPY.pages.marketing.recentVisits}</CardTitle>
            </CardHeader>
            <CardContent>
              {visits.length === 0 ? (
                <EmptyState
                  icon={ClipboardCheck}
                  title={COPY.pages.kunjungan.empty.title}
                  description={COPY.pages.kunjungan.empty.description}
                  variant="inline"
                />
              ) : (
                <div className="space-y-3">
                  {visits.slice(0, 5).map((visit) => (
                    <div
                      key={visit.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-tunet-bg border border-tunet-border"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        visit.type === "prospek" ? "bg-blue-500/20" : "bg-amber-500/20"
                      }`}>
                        {visit.type === "prospek" ? (
                          <Users className="w-4 h-4 text-blue-400" />
                        ) : (
                          <Building className="w-4 h-4 text-amber-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-tunet-text truncate">
                          {visit.type === "prospek"
                            ? visit.prospect?.name || "Prospek"
                            : visit.tower?.name || "Tower Site"}
                        </p>
                        <p className="text-xs text-tunet-text-muted">{visit.notes}</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{
                            backgroundColor: (visit.type === "prospek"
                              ? PROSPECT_STATUS_CONFIG[visit.status_snapshot as keyof typeof PROSPECT_STATUS_CONFIG]
                              : TOWER_SITE_STATUS_CONFIG[visit.status_snapshot as keyof typeof TOWER_SITE_STATUS_CONFIG]
                            )?.color + "20",
                            color: (visit.type === "prospek"
                              ? PROSPECT_STATUS_CONFIG[visit.status_snapshot as keyof typeof PROSPECT_STATUS_CONFIG]
                              : TOWER_SITE_STATUS_CONFIG[visit.status_snapshot as keyof typeof TOWER_SITE_STATUS_CONFIG]
                            )?.color,
                          }}
                        >
                          {(visit.type === "prospek"
                            ? PROSPECT_STATUS_CONFIG[visit.status_snapshot as keyof typeof PROSPECT_STATUS_CONFIG]
                            : TOWER_SITE_STATUS_CONFIG[visit.status_snapshot as keyof typeof TOWER_SITE_STATUS_CONFIG]
                          )?.label || visit.status_snapshot}
                        </Badge>
                        <p className="text-[10px] text-tunet-text-muted mt-1">
                          {new Date(visit.created_at).toLocaleDateString("id-ID")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function MarketingDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-tunet-bg">
      <div className="h-16 border-b border-tunet-border flex items-center px-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-44" />
        </div>
      </div>
      <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-tunet-surface border-tunet-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-12" />
                </div>
                <Skeleton className="w-10 h-10 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="bg-tunet-surface border-tunet-border">
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 flex-1" />
                  <Skeleton className="h-3 w-8" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
