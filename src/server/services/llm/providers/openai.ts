import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { type Emotion, type Tone, type Language, type Platform } from "@/server/db/schema";
import { buildSystemPrompt, buildUserPrompt } from "../prompt-builder";

export interface GeneratedVersion {
  content: string;
  tone: Tone;
  isRecommended: boolean;
}

export async function generateWithOpenAI(params: {
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
        model: openai("gpt-4o-mini"),
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
