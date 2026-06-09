import { router } from "./trpc";
import { reviewRouter } from "./routers/review";
import { authRouter } from "./routers/auth";
import { analyticsRouter } from "./routers/analytics";
import { shopRouter } from "./routers/shop";

export const appRouter = router({
  review: reviewRouter,
  auth: authRouter,
  analytics: analyticsRouter,
  shop: shopRouter,
});

export type AppRouter = typeof appRouter;
