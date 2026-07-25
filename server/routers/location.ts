import { z } from "zod";
import { db } from "../db";
import { locationInput } from "../schemas/location";
import { publicProcedure, router } from "../trpc";

const SEARCH_LIMIT = 10;

export const locationRouter = router({
  search: publicProcedure
    .input(z.object({ query: z.string().default("") }))
    .query(({ input }) => {
      const query = input.query.trim();

      if (!query) {
        return db.location.findMany({
          orderBy: { createdAt: "desc" },
          take: SEARCH_LIMIT,
        });
      }

      return db.location.findMany({
        where: {
          OR: [
            { label: { contains: query, mode: "insensitive" } },
            { city: { contains: query, mode: "insensitive" } },
            { postalCode: { contains: query, mode: "insensitive" } },
          ],
        },
        take: SEARCH_LIMIT,
      });
    }),

  create: publicProcedure.input(locationInput).mutation(({ input }) => {
    return db.location.create({ data: input });
  }),
});
