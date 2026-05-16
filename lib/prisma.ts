import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!globalForPrisma.pool) {
    globalForPrisma.pool = new Pool({ connectionString });
  }

  const adapter = new PrismaPg(globalForPrisma.pool);
  return new PrismaClient({ adapter });
}

/** Lazy Prisma client (avoids connecting during Next.js build). */
export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/** Map REST table names to Prisma model delegate keys (camelCase). */
export function tableToModelName(table: string): string {
  return table.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

export function getPrismaDelegate(table: string): {
  findMany: (args: Record<string, unknown>) => Promise<unknown[]>;
  create: (args: Record<string, unknown>) => Promise<unknown>;
  updateMany: (args: Record<string, unknown>) => Promise<{ count: number }>;
  deleteMany: (args: Record<string, unknown>) => Promise<{ count: number }>;
} | null {
  const modelName = tableToModelName(table);
  const delegate = (getPrisma() as Record<string, unknown>)[modelName];
  if (!delegate || typeof delegate !== "object") return null;
  const d = delegate as Record<string, unknown>;
  if (typeof d.findMany !== "function") return null;
  return d as ReturnType<typeof getPrismaDelegate>;
}
