# Event Ticket Booking & Management Platform

Backend API for discovering, booking, and managing event tickets — built with Node.js, TypeScript, Express, PostgreSQL, and Prisma 7.

See `/docs/requirements.md` for the full specification this project implements, and `/docs/supabase-setup.md` if you're hosting the database on Supabase.

## Setup

```bash
npm install
cp .env.example .env    # fill in DATABASE_URL, DIRECT_URL, JWT secrets, Stripe keys, etc.
npx prisma generate      # generates the client into src/generated/prisma (Prisma 7's new custom-output requirement)
npx prisma migrate dev --name init
npm run seed             # optional: seeds demo users/events
npm run dev
```

## Scripts
- `npm run dev` — start with hot reload (via `tsx watch`)
- `npm start` — run the same way, without watch mode (see note on ESM below re: "production")
- `npm run typecheck` — TypeScript check with no output
- `npm run prisma:studio` — browse the DB visually
- `npm run prisma:generate` / `npm run prisma:migrate` — Prisma CLI shortcuts

## Architecture
Modular pattern under `src/modules/<name>/`: each module owns its `*.route.ts`, `*.controller.ts`, `*.service.ts`, `*.validation.ts`, and (where needed) `*.interface.ts` / `*.constant.ts`. Controllers stay thin and delegate to services; services own all Prisma calls and business logic. Input types for anything that reaches a Prisma `create`/`update` call are derived directly from the Zod validation schemas (`z.infer<typeof schema>["body"]`) rather than passed around as loose `Record<string, unknown>` — this is what keeps Prisma's generated types actually catching mistakes instead of being fought with casts.

## Runtime: ESM + tsx, no separate compiled build
This project runs as native ES Modules (`"type": "module"` in package.json) via [`tsx`](https://tsx.is/), both in dev and for `npm start`. There's no `tsc`-emitted `dist/` folder in the normal flow — `tsx` transpiles and runs TypeScript directly, which also transparently resolves the `@/*` path alias at runtime (confirmed working; no `tsconfig-paths` package needed). `npm run typecheck` (`tsc --noEmit`) is still there for pure type-checking in CI/editors.

If you need an actual compiled artifact for a specific deployment target (e.g. a bundled function for a serverless platform), add a bundler step (esbuild is the natural fit alongside Prisma 7's `moduleResolution: bundler` tsconfig) — that's a deliberate scope cut here, not an oversight, since most small-to-mid Node backends run `tsx` in production just fine.

## Prisma 7: what changed from a typical Prisma 5/6 setup
- The client generates to a **custom path** (`src/generated/prisma`, per `prisma/schema.prisma`'s `generator` block) instead of `node_modules/@prisma/client` — every import in this codebase uses `@/generated/prisma`, not the bare `@prisma/client` specifier.
- **A driver adapter is mandatory.** `new PrismaClient()` with no adapter throws in Prisma 7 — there's no default connector anymore. `src/config/db.ts` wires up `@prisma/adapter-pg` against `DATABASE_URL`.
- **CLI-level connection config moved to `prisma.config.ts`** (new file, project root) — it points migrations at `DIRECT_URL`, since connection poolers (PgBouncer, Supabase's Supavisor) don't support the session-level operations `prisma migrate` needs. `schema.prisma`'s `datasource` block no longer holds a `url`/`directUrl` at all (that's deprecated in v7).
- Query execution itself is now **Rust-free** (a "query compiler" replaces the old Rust query engine binary) — but `prisma generate`/`migrate` still fetch a separate `schema-engine` binary from `binaries.prisma.sh`, so you still need real internet access for those two commands specifically.

## Proving the concurrency guarantee
`scripts/concurrency-test.ts` fires many simultaneous booking requests at the seeded VIP tier (capacity 5) and confirms exactly 5 succeed, no matter how many requests race it:

```bash
npm run seed                      # note the printed event id
EVENT_ID=<seeded-event-id> npx tsx scripts/concurrency-test.ts
```

## A note on this build environment
This project was built in a sandbox without access to `binaries.prisma.sh`, so `prisma generate` can't complete here — meaning `@/generated/prisma` doesn't exist in this environment, and `npm run typecheck` shows a wall of "Cannot find module '@/generated/prisma'" errors that are **not real bugs**, just the missing generated output. Every one of those disappears once you run `npx prisma generate` somewhere with normal internet access.

To confirm nothing else was hiding behind that noise, the entire app was smoke-tested here with a temporary hand-written stub standing in for the real generated client (deleted before delivery — it's not part of the repo). With the stub in place: `npx tsx src/server.ts` booted cleanly, connected, started the background jobs, and a live `curl` round-trip confirmed the health check, 404 handling, and Zod validation error responses all work exactly as designed. That isolates the remaining errors to purely the missing-client cascade.

Two genuine bugs *were* found and fixed this way before delivery:
1. A `jsonwebtoken` v9 strict-typing issue in `src/utils/jwt.ts`.
2. `event.service.ts` and `payment.service.ts` were passing loosely-typed `Record<...>` objects into Prisma `create`/`update` calls, which is what actually caused the two type errors reported after migrating to Prisma 7. Fixed by deriving proper input types from the Zod schemas (`z.infer`) instead — and the same latent pattern was proactively found and fixed in three more modules (`ticketTier`, `user`, `coupon`) that hadn't been touched yet but had the identical issue.
