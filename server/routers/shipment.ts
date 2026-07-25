import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "../db";
import { shipmentDraftInput, shipmentInput } from "../schemas/shipment";
import { publicProcedure, router } from "../trpc";

export const shipmentRouter = router({
  create: publicProcedure.input(shipmentInput).mutation(({ input }) => {
    return db.shipment.create({
      data: {
        ...input,
        status: "SUBMITTED",
        // Don't trust the client to have cleared hazmat detail fields when
        // the toggle is off — the schema only requires them, it doesn't
        // strip them.
        hazmatUnNumber: input.isHazmat ? input.hazmatUnNumber : null,
        hazmatPackingGroup: input.isHazmat ? input.hazmatPackingGroup : null,
        hazmatEmergencyContact: input.isHazmat ? input.hazmatEmergencyContact : null,
      },
    });
  }),

  saveDraft: publicProcedure.input(shipmentDraftInput).mutation(({ input }) => {
    const { id, ...rest } = input;

    if (id) {
      return db.shipment.update({
        where: { id },
        data: rest,
      });
    }

    return db.shipment.create({
      data: { ...rest, status: "DRAFT" },
    });
  }),

  listDrafts: publicProcedure.query(() => {
    return db.shipment.findMany({
      where: { status: "DRAFT" },
      orderBy: { updatedAt: "desc" },
      include: { origin: true, destination: true },
    });
  }),

  get: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const shipment = await db.shipment.findUnique({
      where: { id: input.id },
      include: { origin: true, destination: true },
    });

    if (!shipment) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Shipment not found" });
    }

    return shipment;
  }),
});
