import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { createServerSupabase } from "@/lib/supabase/server";

export const analyticsRouter = router({
  track: protectedProcedure
    .input(
      z.object({
        eventType: z.enum([
          "review_pasted",
          "review_generated",
          "review_copied",
          "emotion_corrected",
          "tone_switched",
          "regenerate_clicked",
          "version_selected",
          "review_completed",
          "page_view",
        ]),
        payload: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const supabase = await createServerSupabase();
      await supabase.from("events").insert({
        user_id: ctx.user.id,
        event_type: input.eventType,
        payload: input.payload ?? {},
      });
      return { success: true };
    }),
});
