"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/auth-provider";
import { trpc } from "@/lib/trpc/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Emotion, Review, ReviewVersion } from "@/server/db/schema";

type HistoryItem = Review & { review_versions: ReviewVersion[] };

export default function HistoryPage() {
  const t = useTranslations();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const trackMutation = trpc.analytics.track.useMutation();

  useEffect(() => {
    trackMutation.mutate({ eventType: "page_view", payload: { page: "history" } });
  }, []);

  const { data: reviews, isLoading } = trpc.review.getHistory.useQuery(
    { limit: 50, offset: 0, search: search || undefined },
    { enabled: !!user },
  );

  const emotionLabel = (e: Emotion) => {
    const map: Record<Emotion, string> = { angry: "Angry 😡", disappointed: "Disappointed 😞", confused: "Confused 😕", neutral: "Neutral 😐" };
    return map[e] ?? e;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("history.title")}</h1>
        <span className="text-xs text-muted-foreground">{t("history.last30Days")}</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("history.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rtl:pr-10 ltr:pl-10"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (reviews?.length ?? 0) === 0 ? (
        <p className="text-center text-muted-foreground py-12">{t("history.noResults")}</p>
      ) : (
        <div className="space-y-3">
          {(reviews as HistoryItem[])?.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground line-clamp-2">{review.input_text}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">{emotionLabel(review.emotion as Emotion)}</Badge>
                      <Badge variant="outline" className="text-xs">{review.target_language}</Badge>
                      <Badge variant="outline" className="text-xs">{review.target_platform}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.generated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => setExpandedId(expandedId === review.id ? null : review.id)}
                  >
                    {expandedId === review.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Expanded: show generated replies */}
                {expandedId === review.id && (
                  <div className="mt-3 space-y-2 border-t pt-3">
                    {review.review_versions?.map((v, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs shrink-0 capitalize">{v.tone}</Badge>
                        <p className="text-sm">{v.edited_content ?? v.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
