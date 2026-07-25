import { describe, expect, it } from "vitest";
import { shipmentDraftInput, shipmentInput } from "../server/schemas/shipment";
import { locationInput } from "../server/schemas/location";

const validNonHazmatShipment = {
  originId: "origin-1",
  destinationId: "dest-1",
  weightLbs: 500,
  lengthIn: 48,
  widthIn: 40,
  heightIn: 36,
  freightClass: "70",
  serviceLevel: "STANDARD" as const,
  isHazmat: false,
};

describe("shipmentInput", () => {
  it("accepts a valid non-hazmat shipment", () => {
    const result = shipmentInput.safeParse(validNonHazmatShipment);
    expect(result.success).toBe(true);
  });

  it("accepts a hazmat shipment when all hazmat detail fields are present", () => {
    const result = shipmentInput.safeParse({
      ...validNonHazmatShipment,
      isHazmat: true,
      hazmatUnNumber: "UN1234",
      hazmatPackingGroup: "II",
      hazmatEmergencyContact: "+1 555-0100",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a hazmat shipment missing hazmat detail fields, with errors on the right paths", () => {
    const result = shipmentInput.safeParse({
      ...validNonHazmatShipment,
      isHazmat: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join("."));
      expect(paths).toEqual(
        expect.arrayContaining(["hazmatUnNumber", "hazmatPackingGroup", "hazmatEmergencyContact"]),
      );
    }
  });

  it("rejects an invalid serviceLevel value", () => {
    const result = shipmentInput.safeParse({
      ...validNonHazmatShipment,
      serviceLevel: "OVERNIGHT",
    });
    expect(result.success).toBe(false);
  });
});

describe("shipmentDraftInput", () => {
  it("accepts an empty object", () => {
    const result = shipmentDraftInput.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts partial data with isHazmat true and no hazmat detail fields", () => {
    const result = shipmentDraftInput.safeParse({ isHazmat: true });
    expect(result.success).toBe(true);
  });

  it("accepts an id for updating an existing draft", () => {
    const result = shipmentDraftInput.safeParse({ id: "draft-1", weightLbs: 200 });
    expect(result.success).toBe(true);
  });
});

describe("locationInput", () => {
  it("accepts a valid location", () => {
    const result = locationInput.safeParse({
      label: "Main Warehouse",
      addressLine1: "123 Main St",
      city: "Columbus",
      region: "OH",
      postalCode: "43215",
      country: "US",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a location missing a required field", () => {
    const result = locationInput.safeParse({
      label: "Main Warehouse",
      addressLine1: "123 Main St",
      city: "Columbus",
      region: "OH",
      country: "US",
    });
    expect(result.success).toBe(false);
  });
});
