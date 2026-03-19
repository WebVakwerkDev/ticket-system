import { PrismaClient } from "@prisma/client";
import { appEnv } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: appEnv.nodeEnv === "development" ? ["warn", "error"] : ["error"],
  });

if (appEnv.nodeEnv !== "production") globalForPrisma.prisma = prisma;
