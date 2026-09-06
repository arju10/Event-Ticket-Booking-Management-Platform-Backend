import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 reads CLI-level config (used by `prisma migrate`, `prisma db push`,
// `prisma studio`, etc.) from this file rather than only from schema.prisma.
// This intentionally points at DIRECT_URL, not DATABASE_URL: connection
// poolers like Supabase's Supavisor / PgBouncer (in transaction mode) don't
// support the session-level operations Prisma's migration engine needs, so
// CLI commands must always go straight to the database. The Prisma Client
// used by the running app still reads DATABASE_URL (the pooled connection)
// via the `url` field in schema.prisma's datasource block.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DIRECT_URL"),
  },
});
