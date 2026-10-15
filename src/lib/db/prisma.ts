import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client Singleton for Next.js 15
 * In development, hot-reloading can cause multiple instances of PrismaClient
 * to be created, quickly exhausting database connection limits.
 * We store the client on `globalThis` in development.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
