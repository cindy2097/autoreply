import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { type Emotion, type Tone, type Language, type Platform } from "@/server/db/schema";
import { buildSystemPrompt, buildUserPrompt } from "../prompt-builder";
import type { GeneratedVersion } from "./openai";

export async function generateWithAnthropic(params: {
  reviewText: string;
  emotion: Emotion;
  targetLanguage: Language;
  targetPlatform: Platform;
}): Promise<GeneratedVersion[]> {
  const tones: Tone[] = ["empathetic", "professional", "compensation"];
  const recommendedTone: Record<Emotion, Tone> = {
    angry: "empathetic",
    disappointed: "compensation",
    confused: "professional",
    neutral: "professional",
  };

  const results = await Promise.all(
    tones.map(async (tone) => {
      const result = await generateText({
        model: anthropic("claude-haiku-4-5-20251001"),
        system: buildSystemPrompt({
          reviewText: params.reviewText,
          emotion: params.emotion,
          tone,
          targetLanguage: params.targetLanguage,
          targetPlatform: params.targetPlatform,
        }),
        prompt: buildUserPrompt({
          reviewText: params.reviewText,
          emotion: params.emotion,
          tone,
          targetLanguage: params.targetLanguage,
          targetPlatform: params.targetPlatform,
        }),
      });

      return {
        content: result.text.trim(),
        tone,
        isRecommended: tone === recommendedTone[params.emotion],
      };
    }),
  );

  return results;
}
