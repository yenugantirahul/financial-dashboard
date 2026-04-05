import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaWarmedUp?: boolean;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing in backend/.env");
}

// Use the Neon serverless adapter — optimized for Neon's architecture
const adapter = new PrismaNeon({
  connectionString,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV !== "production"
        ? ["query", "warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Warm up the database connection at server startup.
 * This eliminates cold-start latency on the first real request.
 */
export async function warmUpDatabase(): Promise<void> {
  if (globalForPrisma.prismaWarmedUp) return;
  try {
    await prisma.$executeRawUnsafe("SELECT 1");
    globalForPrisma.prismaWarmedUp = true;
    console.log("Database connection warmed up successfully");
  } catch (error) {
    console.warn("Database warm-up failed (non-fatal):", error);
  }
}