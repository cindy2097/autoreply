import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import { createServerSupabase } from "@/lib/supabase/server";
import { generateReply } from "@/server/services/llm/orchestrator";
import { classifyEmotion } from "@/server/services/emotion";
import { filterContent } from "@/server/services/content-filter";

export const reviewRouter = router({
  generate: protectedProcedure
    .input(
      z.object({
        inputText: z.string().min(1).max(3000),
        targetLanguage: z.enum(["en", "zh", "ar"]),
        targetPlatform: z.enum(["amazon_sa", "amazon_ae", "amazon_eg", "noon"]),
        shopId: z.string().uuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const supabase = await createServerSupabase();

      // 1. Classify emotion
      const { emotion, confidence } = await classifyEmotion(input.inputText);

      // 2. Generate replies (3 tones)
      const versions = await generateReply({
        reviewText: input.inputText,
        emotion,
        targetLanguage: input.targetLanguage,
        targetPlatform: input.targetPlatform,
      });

      // 3. Content filter check
      const filteredVersions = versions.map((v) => {
        const filterResult = filterContent(v.content);
        return {
          ...v,
          content: filterResult.content,
          hasWarning: filterResult.hasWarning,
        };
      });

      // 4. Store in DB
      const { data: review } = await supabase
        .from("reviews")
        .insert({
          user_id: ctx.user.id,
          shop_id: input.shopId,
          input_text: input.inputText,
          input_lang: input.targetLanguage,
          emotion,
          confidence,
          target_platform: input.targetPlatform,
          target_language: input.targetLanguage,
          generated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (review) {
        await supabase.from("review_versions").insert(
          filteredVersions.map((v) => ({
            review_id: review.id,
            tone: v.tone,
            content: v.content,
            is_recommended: v.isRecommended,
          })),
        );
      }

      return {
        reviewId: review?.id,
        emotion,
        confidence,
        versions: filteredVersions.map((v) => ({
          content: v.content,
          tone: v.tone,
          isRecommended: v.isRecommended,
          hasWarning: v.hasWarning ?? false,
        })),
      };
    }),

  correctEmotion: protectedProcedure
    .input(
      z.object({
        reviewId: z.string().uuid(),
        correctedEmotion: z.enum(["angry", "disappointed", "confused", "neutral"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const supabase = await createServerSupabase();

      const { data: review } = await supabase
        .from("reviews")
        .select("emotion")
        .eq("id", input.reviewId)
        .single();

      if (!review) throw new Error("Review not found");

      await supabase.from("reviews").update({ emotion_corrected: input.correctedEmotion }).eq("id", input.reviewId);

      await supabase.from("emotion_feedback").insert({
        review_id: input.reviewId,
        user_id: ctx.user.id,
        original_emotion: review.emotion,
        corrected_emotion: input.correctedEmotion,
      });

      return { success: true };
    }),

  completeReview: protectedProcedure
    .input(z.object({ reviewId: z.string().uuid(), hasEdit: z.boolean() }))
    .mutation(async ({ input }) => {
      const supabase = await createServerSupabase();
      await supabase
        .from("reviews")
        .update({ is_completed: true, has_edit: input.hasEdit, copied_at: new Date().toISOString() })
        .eq("id", input.reviewId);

      return { success: true };
    }),

  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
        search: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const supabase = await createServerSupabase();

      let query = supabase
        .from("reviews")
        .select("*, review_versions(*)")
        .eq("user_id", ctx.user.id)
        .order("generated_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.search) {
        query = query.ilike("input_text", `%${input.search}%`);
      }

      const { data } = await query;
      return data ?? [];
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase();
    const today = new Date().toISOString().split("T")[0];

    const { count } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", ctx.user.id)
      .gte("generated_at", today);

    const { data: emotions } = await supabase
      .from("reviews")
      .select("emotion")
      .eq("user_id", ctx.user.id)
      .gte("generated_at", today);

    const emotionCounts: Record<string, number> = { angry: 0, disappointed: 0, confused: 0, neutral: 0 };
    for (const e of emotions ?? []) {
      emotionCounts[e.emotion] = (emotionCounts[e.emotion] ?? 0) + 1;
    }

    return { todayTotal: count ?? 0, emotionCounts };
  }),
});
