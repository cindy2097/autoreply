import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import { createServerSupabase, createServerSupabaseAdmin } from "@/lib/supabase/server";
import { TRPCError } from "@trpc/server";

export const authRouter = router({
  getSession: publicProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { user };
  }),

  signUp: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(8) }))
    .mutation(async ({ input }) => {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
      });

      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });

      return { user: data.user, session: data.session };
    }),

  signIn: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ input }) => {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error) throw new TRPCError({ code: "UNAUTHORIZED", message: error.message });

      return { user: data.user, session: data.session };
    }),

  signOut: protectedProcedure.mutation(async () => {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    return { success: true };
  }),

  checkQuota: protectedProcedure.query(async ({ ctx }) => {
    const supabase = await createServerSupabaseAdmin();
    const today = new Date().toISOString().split("T")[0];

    const { data } = await supabase.from("usage_quota").select("*").eq("user_id", ctx.user.id).eq("date", today).single();

    const limit = data?.daily_limit ?? 20;
    const used = data?.count ?? 0;

    return { used, limit, remaining: limit - used };
  }),
});
