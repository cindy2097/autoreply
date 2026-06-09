import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const emotionSchema = z.object({
  emotion: z.enum(["angry", "disappointed", "confused", "neutral"]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

export async function classifyEmotion(
  text: string,
): Promise<{ emotion: "angry" | "disappointed" | "confused" | "neutral"; confidence: number }> {
  try {
    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: emotionSchema,
      system: `You are an emotion classifier for e-commerce reviews from Middle Eastern marketplaces (Amazon.sa, Amazon.ae, Amazon.eg, Noon.com).

Classify the buyer's review text into exactly one of these emotions:

- angry: The buyer is furious, using strong negative language, threats, or expressing extreme dissatisfaction. May include complaints about being scammed, demands for immediate action, or accusations.
- disappointed: The buyer is sad/let down, expressing unmet expectations. The tone is less aggressive than angry — more about sadness, frustration, or resignation.
- confused: The buyer is uncertain, asking questions, or expressing confusion about the product, shipping, or platform process. May be mixed with mild frustration.
- neutral: The review states facts without strong emotion. Could be a simple complaint, informational, or mildly negative without strong sentiment.

Always respond with confidence between 0 and 1. If the text is ambiguous or too short, assign lower confidence.`,
      prompt: text,
    });

    return {
      emotion: result.object.emotion,
      confidence: result.object.confidence,
    };
  } catch {
    return { emotion: "neutral", confidence: 0.3 };
  }
}
