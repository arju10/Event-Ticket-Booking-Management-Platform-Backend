# Integration Tests

## What's here (`http-layer.test.ts`)

Runs the real Express app (`src/app.ts`) through `supertest`, covering everything that doesn't require a database: health check, 404 handling, Zod validation errors, and auth middleware rejecting missing/malformed tokens. These run in CI with zero setup — no `DATABASE_URL`, no Postgres, nothing.

Run with:

```bash
npm run test:integration
```

## What's not here yet: full DB-backed user journeys

Tests that exercise a real register → login → book → pay → check-in flow against an actual Postgres database are a separate, larger effort — they need:

1. A real (throwaway/test) database, with `DATABASE_URL`/`DIRECT_URL` pointed at it
2. `npx prisma migrate deploy` run against it before the suite starts
3. Either a fresh database per test run, or careful cleanup between tests (soft-deletes make this slightly more involved than a typical `TRUNCATE`)

If you want to add these, the natural next step is a `beforeAll` that runs migrations against a `DATABASE_URL` pointed at a local Postgres container (e.g. via `docker run postgres` in CI), then writes tests following the same `supertest` pattern as `http-layer.test.ts` — e.g. `POST /auth/register` → `POST /auth/login` → use the returned token to `POST /events` → etc. The concurrency guarantee itself already has dedicated coverage outside this test suite: see `scripts/concurrency-test.ts`, which fires real concurrent requests at a running server and asserts the ticket tier never oversells.
