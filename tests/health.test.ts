import { describe, expect, it } from "vitest";
import { createCaller } from "../server/routers/_app";
import { GET as getRestHealth } from "../app/api/v1/health/route";

describe("health.ping (tRPC)", () => {
  it("returns ok status with an ISO timestamp", async () => {
    const caller = createCaller({});
    const result = await caller.health.ping();

    expect(result.status).toBe("ok");
    expect(new Date(result.time).toISOString()).toBe(result.time);
  });
});

describe("GET /api/v1/health (REST)", () => {
  it("returns 200 with ok status", async () => {
    const response = getRestHealth();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: "ok" });
  });
});
