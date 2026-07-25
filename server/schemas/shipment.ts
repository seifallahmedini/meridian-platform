import { z } from "zod";

export const serviceLevel = z.enum(["STANDARD", "EXPEDITED", "GUARANTEED"]);

// Base shape shared by the strict (submit) and relaxed (draft) schemas.
// Kept as a plain object (not yet refined) so `.partial()` is available for
// the draft variant — `.superRefine()` below returns a ZodEffects, which
// doesn't support `.partial()`.
const shipmentBase = z.object({
  originId: z.string().min(1),
  destinationId: z.string().min(1),
  weightLbs: z.number().positive(),
  lengthIn: z.number().positive(),
  widthIn: z.number().positive(),
  heightIn: z.number().positive(),
  freightClass: z.string().min(1),
  serviceLevel,
  isHazmat: z.boolean(),
  hazmatUnNumber: z.string().optional(),
  hazmatPackingGroup: z.string().optional(),
  hazmatEmergencyContact: z.string().optional(),
});

function requireHazmatFieldsWhenToggled(
  data: z.infer<typeof shipmentBase>,
  ctx: z.RefinementCtx,
) {
  if (!data.isHazmat) return;

  if (!data.hazmatUnNumber?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["hazmatUnNumber"],
      message: "UN number is required for hazmat shipments",
    });
  }
  if (!data.hazmatPackingGroup?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["hazmatPackingGroup"],
      message: "Packing group is required for hazmat shipments",
    });
  }
  if (!data.hazmatEmergencyContact?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["hazmatEmergencyContact"],
      message: "Emergency contact is required for hazmat shipments",
    });
  }
}

// Strict: used by shipment.create (final submit, AC #2-4).
export const shipmentInput = shipmentBase.superRefine(requireHazmatFieldsWhenToggled);

// Relaxed: used by shipment.saveDraft (AC #5) — every field optional, no
// hazmat cross-field requirement, since a draft can be saved mid-entry.
export const shipmentDraftInput = shipmentBase.partial().extend({
  id: z.string().optional(),
});

export type ShipmentInput = z.infer<typeof shipmentInput>;
export type ShipmentDraftInput = z.infer<typeof shipmentDraftInput>;
