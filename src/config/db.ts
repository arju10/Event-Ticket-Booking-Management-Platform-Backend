import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";

// Prisma 7 removed the built-in Rust query engine in favor of "driver
// adapters" -- PrismaClient now REQUIRES one to be passed in; there is no
// default connection behavior anymore. We use @prisma/adapter-pg (backed by
// the standard `pg` driver) pointed at DATABASE_URL, the pooled connection
// string (e.g. Supabase's Supavisor / PgBouncer on port 6543). Migrations and
// other schema-changing CLI commands go through prisma.config.ts instead,
// which points at DIRECT_URL -- see that file for why.
const adapter = new PrismaPg({ connectionString: env.databaseUrl });

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    adapter,
    log: env.nodeEnv === "development" ? ["warn", "error"] : ["error"],
  });

if (env.nodeEnv !== "production") {
  global.__prisma = prisma;
}
