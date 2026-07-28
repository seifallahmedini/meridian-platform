import { z } from 'zod'
import { FREIGHT_CLASSES } from '@/lib/constants/freight-classes'

export const SERVICE_LEVELS = ['Standard', 'Expedited', 'Guaranteed'] as const

const unNumberPattern = /^UN\d{4}$/

// Loose shape used as the React Hook Form resolver — nothing required, so typing/saving as a
// draft is never blocked by validation. Mirrors the backend's SaveDraftShipmentRequestValidator.
export const shipmentFormSchema = z.object({
  originLocationId: z.string().uuid().nullable(),
  destinationLocationId: z.string().uuid().nullable(),
  weightKg: z.number().positive().nullable(),
  lengthCm: z.number().positive().nullable(),
  widthCm: z.number().positive().nullable(),
  heightCm: z.number().positive().nullable(),
  freightClass: z.enum(FREIGHT_CLASSES).nullable(),
  isHazmat: z.boolean(),
  hazmatUnNumber: z.string().nullable(),
  hazmatPackingGroup: z.enum(['I', 'II', 'III']).nullable(),
  hazmatEmergencyContact: z.string().nullable(),
  serviceLevel: z.enum(SERVICE_LEVELS).nullable(),
})

export type ShipmentFormValues = z.infer<typeof shipmentFormSchema>

// Strict shape run manually (not via the RHF resolver) when the user clicks "Create Shipment"
// rather than "Save as Draft" — mirrors the backend's SubmitShipmentRequestValidator, including
// the hazmat conditional fields and the origin != destination cross-field check.
export const shipmentSubmitSchema = shipmentFormSchema.superRefine((data, ctx) => {
  if (!data.originLocationId) {
    ctx.addIssue({ code: 'custom', path: ['originLocationId'], message: 'Origin is required.' })
  }
  if (!data.destinationLocationId) {
    ctx.addIssue({ code: 'custom', path: ['destinationLocationId'], message: 'Destination is required.' })
  }
  if (
    data.originLocationId &&
    data.destinationLocationId &&
    data.originLocationId === data.destinationLocationId
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['destinationLocationId'],
      message: 'Origin and destination must be different locations.',
    })
  }
  if (!data.weightKg) {
    ctx.addIssue({ code: 'custom', path: ['weightKg'], message: 'Weight is required.' })
  }
  if (!data.lengthCm) {
    ctx.addIssue({ code: 'custom', path: ['lengthCm'], message: 'Length is required.' })
  }
  if (!data.widthCm) {
    ctx.addIssue({ code: 'custom', path: ['widthCm'], message: 'Width is required.' })
  }
  if (!data.heightCm) {
    ctx.addIssue({ code: 'custom', path: ['heightCm'], message: 'Height is required.' })
  }
  if (!data.freightClass) {
    ctx.addIssue({ code: 'custom', path: ['freightClass'], message: 'Freight class is required.' })
  }
  if (!data.serviceLevel) {
    ctx.addIssue({ code: 'custom', path: ['serviceLevel'], message: 'Service level is required.' })
  }

  if (data.isHazmat) {
    if (!data.hazmatUnNumber || !unNumberPattern.test(data.hazmatUnNumber)) {
      ctx.addIssue({
        code: 'custom',
        path: ['hazmatUnNumber'],
        message: 'UN number must match the format UN####.',
      })
    }
    if (!data.hazmatPackingGroup) {
      ctx.addIssue({
        code: 'custom',
        path: ['hazmatPackingGroup'],
        message: 'Packing group is required.',
      })
    }
    if (!data.hazmatEmergencyContact) {
      ctx.addIssue({
        code: 'custom',
        path: ['hazmatEmergencyContact'],
        message: 'Emergency contact is required.',
      })
    }
  }
})
