import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../server/db", () => ({
  db: {
    location: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { db } from "../server/db";
import { createCaller } from "../server/routers/_app";

const mockedFindMany = vi.mocked(db.location.findMany);
const mockedCreate = vi.mocked(db.location.create);

describe("location router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("search with an empty query returns the most recent locations, capped at 10", async () => {
    mockedFindMany.mockResolvedValue([]);
    const caller = createCaller({});

    await caller.location.search({ query: "" });

    expect(mockedFindMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  });

  it("search with a query matches label, city, and postal code, capped at 10", async () => {
    mockedFindMany.mockResolvedValue([]);
    const caller = createCaller({});

    await caller.location.search({ query: "Columbus" });

    expect(mockedFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { label: { contains: "Columbus", mode: "insensitive" } },
            { city: { contains: "Columbus", mode: "insensitive" } },
            { postalCode: { contains: "Columbus", mode: "insensitive" } },
          ],
        },
        take: 10,
      }),
    );
  });

  it("create calls db.location.create with the validated input", async () => {
    const input = {
      label: "HQ",
      addressLine1: "1 Main St",
      city: "Columbus",
      region: "OH",
      postalCode: "43215",
      country: "US",
    };
    mockedCreate.mockResolvedValue({ id: "loc-2", ...input, addressLine2: null, createdAt: new Date() });
    const caller = createCaller({});

    const result = await caller.location.create(input);

    expect(mockedCreate).toHaveBeenCalledWith({ data: input });
    expect(result.id).toBe("loc-2");
  });
});
