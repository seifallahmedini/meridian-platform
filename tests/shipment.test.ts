import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../server/db", () => ({
  db: {
    shipment: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { db } from "../server/db";
import { createCaller } from "../server/routers/_app";

const mockedCreate = vi.mocked(db.shipment.create);
const mockedUpdate = vi.mocked(db.shipment.update);
const mockedFindMany = vi.mocked(db.shipment.findMany);
const mockedFindUnique = vi.mocked(db.shipment.findUnique);

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

describe("shipment.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates with status SUBMITTED", async () => {
    mockedCreate.mockResolvedValue({ id: "s-1" } as never);
    const caller = createCaller({});

    await caller.shipment.create(validNonHazmatShipment);

    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "SUBMITTED" }),
      }),
    );
  });

  it("rejects an incomplete hazmat payload before touching the database", async () => {
    const caller = createCaller({});

    await expect(
      caller.shipment.create({ ...validNonHazmatShipment, isHazmat: true }),
    ).rejects.toThrow();
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("clears hazmat detail fields server-side when isHazmat is false", async () => {
    mockedCreate.mockResolvedValue({ id: "s-1" } as never);
    const caller = createCaller({});

    await caller.shipment.create({
      ...validNonHazmatShipment,
      // A client bug/stale state sending hazmat fields even though the
      // toggle is off — the server must not trust them.
      hazmatUnNumber: "UN1234",
    });

    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          hazmatUnNumber: null,
          hazmatPackingGroup: null,
          hazmatEmergencyContact: null,
        }),
      }),
    );
  });
});

describe("shipment.saveDraft", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new draft from partial data", async () => {
    mockedCreate.mockResolvedValue({ id: "s-2" } as never);
    const caller = createCaller({});

    await caller.shipment.saveDraft({ weightLbs: 200 });

    expect(mockedCreate).toHaveBeenCalledWith({
      data: { weightLbs: 200, status: "DRAFT" },
    });
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("updates an existing draft when id is provided", async () => {
    mockedUpdate.mockResolvedValue({ id: "s-3" } as never);
    const caller = createCaller({});

    await caller.shipment.saveDraft({ id: "s-3", weightLbs: 300 });

    expect(mockedUpdate).toHaveBeenCalledWith({
      where: { id: "s-3" },
      data: { weightLbs: 300 },
    });
    expect(mockedCreate).not.toHaveBeenCalled();
  });
});

describe("shipment.listDrafts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries only DRAFT status, ordered by updatedAt desc", async () => {
    mockedFindMany.mockResolvedValue([]);
    const caller = createCaller({});

    await caller.shipment.listDrafts();

    expect(mockedFindMany).toHaveBeenCalledWith({
      where: { status: "DRAFT" },
      orderBy: { updatedAt: "desc" },
      include: { origin: true, destination: true },
    });
  });
});

describe("shipment.get", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the shipment when found", async () => {
    mockedFindUnique.mockResolvedValue({ id: "s-4" } as never);
    const caller = createCaller({});

    const result = await caller.shipment.get({ id: "s-4" });

    expect(result).toEqual({ id: "s-4" });
  });

  it("throws NOT_FOUND when the shipment doesn't exist", async () => {
    mockedFindUnique.mockResolvedValue(null);
    const caller = createCaller({});

    await expect(caller.shipment.get({ id: "missing" })).rejects.toThrow("Shipment not found");
  });
});
