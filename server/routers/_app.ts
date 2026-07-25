import { createCallerFactory, router } from "../trpc";
import { healthRouter } from "./health";
import { locationRouter } from "./location";
import { shipmentRouter } from "./shipment";

export const appRouter = router({
  health: healthRouter,
  location: locationRouter,
  shipment: shipmentRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
