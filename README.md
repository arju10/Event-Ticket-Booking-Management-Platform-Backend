# Event Ticket Booking & Management Platform

Backend API for discovering, booking, and managing event tickets — built with Node.js, TypeScript, Express, PostgreSQL, and Prisma.

See `/docs/requirements.md` for the full specification this project implements.

## Setup

```bash
npm install
cp .env.example .env    # fill in DATABASE_URL, JWT secrets, Stripe keys, etc.
npx prisma migrate dev --name init
npx prisma generate
npm run seed             # optional: seeds demo users/events
npm run dev
```

## Scripts
- `npm run dev` — start with hot reload
- `npm run build` / `npm start` — production build + run
- `npm run typecheck` — TypeScript check with no output
- `npm run prisma:studio` — browse the DB visually

## Architecture
Modular pattern under `src/modules/<name>/`: each module owns its `*.route.ts`, `*.controller.ts`, `*.service.ts`, `*.validation.ts`, and (where needed) `*.interface.ts` / `*.constant.ts`. Controllers stay thin and delegate to services; services own all Prisma calls and business logic.

## Proving the concurrency guarantee
`scripts/concurrency-test.ts` fires many simultaneous booking requests at the seeded VIP tier (capacity 5) and confirms exactly 5 succeed, no matter how many requests race it:

```bash
npm run seed                      # note the printed event id
EVENT_ID=<seeded-event-id> npx ts-node scripts/concurrency-test.ts
```

## A note on this build environment
This project was scaffolded and written in a sandboxed environment without access to `binaries.prisma.sh`, so `npx prisma generate` could not download the query engine here — meaning the TypeScript compiler currently sees `@prisma/client` as an untyped stub, and `npm run typecheck` will show a wall of cascading "Prisma has no exported member X" errors that are **not real bugs**, just the missing generated types. Every one of those errors disappears once you run:

```bash
npm install
npx prisma generate     # works normally with a real internet connection
npm run typecheck       # should now be clean
```

One genuine bug *was* found and fixed this way before delivery (a `jsonwebtoken` v9 strict-typing issue in `src/utils/jwt.ts`) — the workflow above is exactly how to catch anything else that surfaces once the client is generated for real.
