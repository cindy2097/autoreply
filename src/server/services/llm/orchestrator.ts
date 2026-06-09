import { type Emotion, type Tone, type Language, type Platform } from "@/server/db/schema";
import { generateWithOpenAI, type GeneratedVersion } from "./providers/openai";
import { generateWithAnthropic } from "./providers/anthropic";
import { getAllFallbackVersions } from "./fallback";

interface GenerateParams {
  reviewText: string;
  emotion: Emotion;
  targetLanguage: Language;
  targetPlatform: Platform;
}

export async function generateReply(params: GenerateParams): Promise<GeneratedVersion[]> {
  // L1: OpenAI GPT-4o-mini (fast + cheap)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const result = await generateWithOpenAI(params);
    clearTimeout(timeout);
    return result;
  } catch (error) {
    console.warn("[LLM] L1 OpenAI failed, falling back to L2 Anthropic:", (error as Error).message);
  }

  // L2: Anthropic Claude Haiku (backup provider)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const result = await generateWithAnthropic(params);
    clearTimeout(timeout);
    return result;
  } catch (error) {
    console.error("[LLM] L2 Anthropic failed, falling back to L3 static templates:", (error as Error).message);
  }

  // L3: Static template fallback
  const fallbackVersions = getAllFallbackVersions(params.emotion, params.targetLanguage);
  return fallbackVersions.map((v) => ({
    content: v.content,
    tone: v.tone as Tone,
    isRecommended: v.isRecommended,
  }));
}
