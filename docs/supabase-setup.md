# Connecting This Project to Supabase

Supabase gives you a hosted PostgreSQL database in front of a connection pooler (Supavisor). This project's Prisma 7 setup expects **two different connection strings** — this guide shows exactly where to find them and where each one goes.

## 1. Why two connection strings?

|                                        | Used for                                  | Who uses it                            |
| -------------------------------------- | ----------------------------------------- | -------------------------------------- |
| **Pooled connection** (`DATABASE_URL`) | Everyday queries while the app is running | `src/config/db.ts`, at runtime         |
| **Direct connection** (`DIRECT_URL`)   | Schema migrations, `prisma studio`        | `prisma.config.ts`, via the Prisma CLI |

Supabase's pooler (Supavisor, in "transaction mode") is great for the high connection churn of a running API, but it **doesn't support the session-level Postgres features Prisma's migration engine needs** (like advisory locks). So migrations have to bypass the pooler and hit the database directly, while your actual app traffic should go through the pooler so you don't exhaust Postgres's connection limit. This split is exactly why the project has two env vars instead of one.

## 2. Get your connection strings from Supabase

1. Open your project on [supabase.com](https://supabase.com) → **Project Settings → Database**.
2. Under **Connection string**, you'll see a few tabs/modes. You need two specific ones:
   - **Transaction pooler** (sometimes labeled "Connection pooling", port **6543**) → this is your `DATABASE_URL`.
   - **Direct connection** (port **5432**) → this is your `DIRECT_URL`.
3. Copy each, substituting in your actual database password (the one you set when creating the project — not your Supabase account password).

## 3. Fill in `.env`

```env
# Pooled -- used by the running app. Note the required ?pgbouncer=true.
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct -- used only by Prisma CLI (migrate, studio) via prisma.config.ts.
DIRECT_URL="postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"
```

Two details that matter and are easy to miss:

- **`?pgbouncer=true` is required** on the pooled URL. It tells Prisma's query layer to skip prepared statements, which Supavisor's transaction mode doesn't support. Without it you'll get cryptic "prepared statement already exists" errors under any real load.
- **The username differs between the two.** The pooled connection uses `postgres.<project-ref>` (with the project ref appended); the direct connection just uses `postgres`. Copy each string as Supabase shows it rather than assuming they're the same format with a different port.

## 4. Run migrations

```bash
npx prisma generate     # generates the client (needs internet access to binaries.prisma.sh)
npx prisma migrate dev --name init
```

This reads `prisma.config.ts`, which points at `DIRECT_URL` — so migrations go straight to the database, bypassing the pooler, exactly as intended.

## 5. Run the app

```bash
npm run dev
```

`src/config/db.ts` builds a `PrismaPg` driver adapter from `DATABASE_URL` (the pooled string) — this is what the running app actually queries through. Prisma 7 requires this adapter explicitly; there's no default connector anymore, so if `DATABASE_URL` is missing or malformed you'll get an error immediately on boot rather than a mysterious runtime failure later, which is a nice property for catching a bad `.env` early.

## 6. Sanity-check the connection

```bash
npm run prisma:studio
```

This also uses `DIRECT_URL` (again via `prisma.config.ts`) and gives you a browsable UI over your actual Supabase tables — a quick way to confirm the migration landed before you start hitting the API.

## Common issues

| Symptom                                  | Likely cause                                                                                                                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `prepared statement "sX" already exists` | Missing `?pgbouncer=true` on `DATABASE_URL`                                                                                                                                          |
| Migrations hang or time out              | You accidentally put the pooled (6543) URL in `DIRECT_URL` instead of the direct (5432) one                                                                                          |
| `password authentication failed`         | Using your Supabase _account_ password instead of the _database_ password you set at project creation (resettable from Project Settings → Database)                                  |
| Works locally, fails when deployed       | Some hosts (e.g. certain serverless platforms) need `connection_limit=1` appended to `DATABASE_URL` to avoid exhausting Supavisor's pool across many concurrent function invocations |
