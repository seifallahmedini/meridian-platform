import { createCallerFactory, router } from "../trpc";
import { healthRouter } from "./health";
import { locationRouter } from "./location";

export const appRouter = router({
  health: healthRouter,
  location: locationRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
