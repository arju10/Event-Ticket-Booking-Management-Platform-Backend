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
