import { NextResponse } from "next/server";
import { z } from "zod";

const healthResponse = z.object({
  status: z.literal("ok"),
});

export function GET() {
  const body = healthResponse.parse({ status: "ok" });
  return NextResponse.json(body);
}
