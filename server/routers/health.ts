import { z } from "zod";
import { publicProcedure, router } from "../trpc";

const pingOutput = z.object({
  status: z.literal("ok"),
  time: z.string(),
});

export const healthRouter = router({
  ping: publicProcedure.output(pingOutput).query(() => {
    return {
      status: "ok" as const,
      time: new Date().toISOString(),
    };
  }),
});
