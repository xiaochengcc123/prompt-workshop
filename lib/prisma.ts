import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";

// Prisma CLI/seed scripts do not automatically read Next.js .env.local,
// so load it here before the client is constructed.
loadEnv({ path: ".env.local" });
loadEnv();

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}
