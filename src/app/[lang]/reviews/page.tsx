"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/auth-provider";
import { trpc } from "@/lib/trpc/client";
import { ReviewInput } from "@/components/reviews/review-input";
import { EmotionBadge } from "@/components/reviews/emotion-badge";
import { ReplyCard } from "@/components/reviews/reply-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { RotateCw, RefreshCw } from "lucide-react";

type Emotion = "angry" | "disappointed" | "confused" | "neutral";

export default function ReviewsPage() {
  const t = useTranslations();
  const { user } = useAuth();
  const [shopId, setShopId] = useState<string>("");
  const [lastInput, setLastInput] = useState<{ text: string; lang: string; platform: string } | null>(null);
  const [result, setResult] = useState<{
    reviewId: string;
    emotion: Emotion;
    confidence: number;
    versions: Array<{
      content: string;
      tone: string;
      isRecommended: boolean;
      hasWarning: boolean;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEmotionDialog, setShowEmotionDialog] = useState(false);
  const [correctedEmotion, setCorrectedEmotion] = useState<Emotion>("neutral");

  // Fetch shops
  const { data: shops } = trpc.shop.list.useQuery(undefined, { enabled: !!user });
  useEffect(() => {
    if (shops && shops.length > 0 && !shopId) {
      setShopId(shops[0].id);
    }
  }, [shops, shopId]);

  // Mutations
  const generateMutation = trpc.review.generate.useMutation();
  const correctEmotionMutation = trpc.review.correctEmotion.useMutation();
  const completeMutation = trpc.review.completeReview.useMutation();
  const trackMutation = trpc.analytics.track.useMutation();

  const handleSubmit = useCallback(
    async (text: string, lang: string, platform: string) => {
      if (!shopId) {
        toast.error("Please add a shop in Settings first");
        return;
      }

      setLoading(true);
      setResult(null);
      setLastInput({ text, lang, platform });

      try {
        trackMutation.mutate({ eventType: "review_pasted", payload: { textLength: text.length } });

        const langMap: Record<string, "en" | "zh" | "ar"> = { en: "en", zh: "zh", ar: "ar" };
        const platformMap: Record<string, "amazon_sa" | "amazon_ae" | "amazon_eg" | "noon"> = {
          amazon_sa: "amazon_sa",
          amazon_ae: "amazon_ae",
          amazon_eg: "amazon_eg",
          noon: "noon",
        };

        const data = await generateMutation.mutateAsync({
          inputText: text,
          targetLanguage: langMap[lang] ?? "en",
          targetPlatform: platformMap[platform] ?? "amazon_sa",
          shopId,
        });

        setResult({
          reviewId: data.reviewId!,
          emotion: data.emotion as Emotion,
          confidence: data.confidence,
          versions: data.versions.map((v) => ({
            content: v.content,
            tone: v.tone,
            isRecommended: v.isRecommended,
            hasWarning: v.hasWarning ?? false,
          })),
        });

        trackMutation.mutate({
          eventType: "review_generated",
          payload: { reviewId: data.reviewId, emotion: data.emotion, confidence: data.confidence },
        });
      } catch (err) {
        toast.error("Failed to generate replies. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [shopId, generateMutation, trackMutation],
  );

  const handleCorrectEmotion = async () => {
    if (!result) return;
    await correctEmotionMutation.mutateAsync({
      reviewId: result.reviewId,
      correctedEmotion,
    });
    setResult({ ...result, emotion: correctedEmotion });
    setShowEmotionDialog(false);
    trackMutation.mutate({ eventType: "emotion_corrected", payload: { reviewId: result.reviewId, correctedEmotion } });
    toast.success("Sentiment updated");
  };

  const handleRegenerate = () => {
    if (!lastInput) return;
    setLoading(true);
    setResult(null);
    const langMap: Record<string, "en" | "zh" | "ar"> = { en: "en", zh: "zh", ar: "ar" };
    const platformMap: Record<string, "amazon_sa" | "amazon_ae" | "amazon_eg" | "noon"> = {
      amazon_sa: "amazon_sa", amazon_ae: "amazon_ae", amazon_eg: "amazon_eg", noon: "noon",
    };
    generateMutation.mutate(
      {
        inputText: lastInput.text,
        targetLanguage: langMap[lastInput.lang] ?? "en",
        targetPlatform: platformMap[lastInput.platform] ?? "amazon_sa",
        shopId,
      },
      {
        onSuccess: (data) => {
          setResult({
            reviewId: data.reviewId!,
            emotion: data.emotion as Emotion,
            confidence: data.confidence,
            versions: data.versions.map((v) => ({
              content: v.content,
              tone: v.tone,
              isRecommended: v.isRecommended,
              hasWarning: v.hasWarning ?? false,
            })),
          });
        },
        onError: () => toast.error("Failed to generate replies. Please try again."),
      },
    );
    trackMutation.mutate({ eventType: "regenerate_clicked" });
  };

  const handleCopy = (reviewId: string) => {
    trackMutation.mutate({ eventType: "review_copied", payload: { reviewId } });
  };

  const handleMarkDone = async () => {
    if (!result) return;
    await completeMutation.mutateAsync({ reviewId: result.reviewId, hasEdit: false });
    trackMutation.mutate({ eventType: "review_completed", payload: { reviewId: result.reviewId } });
    toast.success("Marked as replied");
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!result) return;
      const cards = document.querySelectorAll<HTMLElement>("[data-reply-card]");
      if (e.altKey && e.key === "1") cards[0]?.querySelector<HTMLElement>("button")?.click();
      if (e.altKey && e.key === "2") cards[1]?.querySelector<HTMLElement>("button")?.click();
      if (e.altKey && e.key === "3") cards[2]?.querySelector<HTMLElement>("button")?.click();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [result]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t("reviews.title")}</h1>

      {/* Input */}
      <ReviewInput onSubmit={handleSubmit} loading={loading} />

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-12" />
          </div>
          <Skeleton className="h-4 w-64" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4">
          {/* Emotion row */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium">{t("reviews.emotion")}:</span>
            <EmotionBadge
              emotion={result.emotion}
              confidence={result.confidence}
              onClick={() => {
                setCorrectedEmotion(result.emotion);
                setShowEmotionDialog(true);
              }}
            />
            {result.confidence < 0.6 && (
              <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">
                {t("reviews.warnings.lowConfidence")}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleRegenerate}>
              <RefreshCw className="h-3.5 w-3.5 rtl:ml-1.5 ltr:mr-1.5" />
              {t("reviews.actions.regenerate")}
            </Button>
            <Button variant="outline" size="sm" onClick={handleMarkDone}>
              {t("reviews.actions.markDone")}
            </Button>
          </div>

          {/* Reply cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {result.versions.map((v, i) => (
              <div key={i} data-reply-card>
                <ReplyCard
                  content={v.content}
                  tone={v.tone}
                  isRecommended={v.isRecommended}
                  hasWarning={v.hasWarning}
                  onCopy={() => handleCopy(result.reviewId)}
                />
              </div>
            ))}
          </div>

          {/* Keyboard shortcuts hint */}
          <p className="text-xs text-muted-foreground text-center">
            Alt+1/2/3 to copy each version
          </p>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <RotateCw className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p>{t("reviews.noReviews")}</p>
        </div>
      )}

      {/* Emotion correction dialog */}
      <Dialog open={showEmotionDialog} onOpenChange={setShowEmotionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("reviews.actions.correctEmotion")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Label>Select correct sentiment</Label>
            <Select value={correctedEmotion} onValueChange={(v) => v && setCorrectedEmotion(v as Emotion)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="angry">{t("reviews.emotions.angry")}</SelectItem>
                <SelectItem value="disappointed">{t("reviews.emotions.disappointed")}</SelectItem>
                <SelectItem value="confused">{t("reviews.emotions.confused")}</SelectItem>
                <SelectItem value="neutral">{t("reviews.emotions.neutral")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCorrectEmotion}>{t("common.save")}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
