"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/auth-provider";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Frown, HelpCircle, Minus, MessageSquareText, Clock } from "lucide-react";
import { useEffect } from "react";

export default function DashboardPage() {
  const t = useTranslations();
  const { user } = useAuth();
  const { data: stats, isLoading } = trpc.review.getStats.useQuery(undefined, { enabled: !!user });
  const trackMutation = trpc.analytics.track.useMutation();

  useEffect(() => {
    trackMutation.mutate({ eventType: "page_view", payload: { page: "dashboard" } });
  }, []);

  const emotionCards = [
    { key: "angry" as const, icon: Flame, color: "text-red-500", bgColor: "bg-red-50 dark:bg-red-950" },
    { key: "disappointed" as const, icon: Frown, color: "text-orange-500", bgColor: "bg-orange-50 dark:bg-orange-950" },
    { key: "confused" as const, icon: HelpCircle, color: "text-yellow-500", bgColor: "bg-yellow-50 dark:bg-yellow-950" },
    { key: "neutral" as const, icon: Minus, color: "text-slate-500", bgColor: "bg-slate-50 dark:bg-slate-800" },
  ];

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Today's total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.totalReviews")}</CardTitle>
            <MessageSquareText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.todayTotal ?? 0}</p>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.pendingReviews")}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.todayTotal ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Emotion distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("dashboard.emotionDistribution")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            {emotionCards.map(({ key, icon: Icon, color, bgColor }) => {
              const count = stats?.emotionCounts?.[key] ?? 0;
              const total = stats?.todayTotal ?? 1;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={key} className={`flex items-center gap-3 rounded-lg p-3 ${bgColor}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                  <div>
                    <p className="text-xs text-muted-foreground capitalize">{key}</p>
                    <p className="text-xl font-bold">{count}</p>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-secondary">
                      <div className={`h-full rounded-full ${color.replace("text-", "bg-")}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
