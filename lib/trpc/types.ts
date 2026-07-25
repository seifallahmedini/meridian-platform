import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../server/routers/_app";

export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type LocationSummary = RouterOutputs["location"]["search"][number];
export type ShipmentDetail = RouterOutputs["shipment"]["get"];
