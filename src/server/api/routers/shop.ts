import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { createServerSupabase } from "@/lib/supabase/server";

export const shopRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase();
    const { data } = await supabase.from("shops").select("*").eq("user_id", ctx.user.id);
    return data ?? [];
  }),

  create: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["amazon_sa", "amazon_ae", "amazon_eg", "noon"]),
        shopName: z.string().min(1),
        defaultLang: z.enum(["en", "zh", "ar"]),
        defaultTone: z.enum(["empathetic", "professional", "compensation"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const supabase = await createServerSupabase();
      const { data } = await supabase
        .from("shops")
        .insert({
          user_id: ctx.user.id,
          platform: input.platform,
          shop_name: input.shopName,
          default_lang: input.defaultLang,
          default_tone: input.defaultTone,
        })
        .select()
        .single();
      return data;
    }),
});
