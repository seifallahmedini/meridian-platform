import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Lazy connection: pg's Pool does not connect until the first query, so this
// is safe to construct even when DATABASE_URL is unset (e.g. `pnpm build`
// without a live database — only queries actually hit the network).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
