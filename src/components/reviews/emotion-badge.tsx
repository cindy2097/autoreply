"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Flame, Frown, HelpCircle, Minus } from "lucide-react";

type Emotion = "angry" | "disappointed" | "confused" | "neutral";

const config: Record<Emotion, { icon: typeof Flame; color: string; labelKey: string }> = {
  angry: { icon: Flame, color: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300", labelKey: "reviews.emotions.angry" },
  disappointed: { icon: Frown, color: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300", labelKey: "reviews.emotions.disappointed" },
  confused: { icon: HelpCircle, color: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300", labelKey: "reviews.emotions.confused" },
  neutral: { icon: Minus, color: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300", labelKey: "reviews.emotions.neutral" },
};

interface EmotionBadgeProps {
  emotion: Emotion;
  confidence: number;
  onClick?: () => void;
  className?: string;
}

export function EmotionBadge({ emotion, confidence, onClick, className }: EmotionBadgeProps) {
  const { icon: Icon, color } = config[emotion];
  const lowConf = confidence < 0.6;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 px-2.5 py-1 cursor-pointer transition hover:scale-105",
        color,
        lowConf && "border-yellow-400 ring-1 ring-yellow-400",
        className,
      )}
      onClick={onClick}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{emotion}</span>
      <span className="text-xs opacity-70">{Math.round(confidence * 100)}%</span>
    </Badge>
  );
}
