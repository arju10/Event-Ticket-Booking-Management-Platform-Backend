/**
 * Fires N simultaneous booking requests against a single ticket tier to prove
 * the checkout transaction (booking.service.ts) never oversells.
 *
 * Usage (against the seeded VIP tier, which has quantity=5):
 *   npx ts-node scripts/concurrency-test.ts
 *
 * Expected result: exactly 5 requests succeed (201), the rest fail with
 * 409 INSUFFICIENT_TICKETS — never more than 5 successes, regardless of
 * how many concurrent requests are fired.
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:5000/api/v1";
const TICKET_TIER_ID = process.env.TICKET_TIER_ID ?? "seed-tier-vip"; // quantity = 5 in the seed
const EVENT_SLUG_LOOKUP_NOTE =
  "Run `npm run seed` first, then replace EVENT_ID below with the seeded event's id.";
const EVENT_ID = process.env.EVENT_ID ?? ""; // must be provided — see note above
const CONCURRENT_REQUESTS = Number(process.env.CONCURRENT_REQUESTS ?? 20);

interface LoginResponse {
  data: { accessToken: string };
}

async function registerAndLogin(index: number): Promise<string> {
  const email = `concurrency-test-${index}-${Date.now()}@example.com`;
  await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: "TestPass123!",
      name: `Load Test ${index}`,
      role: "ATTENDEE",
    }),
  });
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "TestPass123!" }),
  });
  const login = (await loginRes.json()) as LoginResponse;
  return login.data.accessToken;
}

async function attemptBooking(token: string, index: number) {
  const res = await fetch(`${BASE_URL}/events/${EVENT_ID}/book`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ticketTierId: TICKET_TIER_ID, quantity: 1 }),
  });
  const body = await res.json();
  return {
    index,
    status: res.status,
    success: res.status === 201,
    code: body.code,
  };
}

async function main() {
  if (!EVENT_ID) {
    console.error(EVENT_SLUG_LOOKUP_NOTE);
    console.error(
      "Set EVENT_ID env var to the seeded event's id (check `npm run prisma:studio` or the seed log) and re-run.",
    );
    process.exit(1);
  }

  console.log(
    `Firing ${CONCURRENT_REQUESTS} concurrent booking requests against tier "${TICKET_TIER_ID}"...`,
  );

  const tokens = await Promise.all(
    Array.from({ length: CONCURRENT_REQUESTS }, (_, i) => registerAndLogin(i)),
  );

  const results = await Promise.all(
    tokens.map((token, i) => attemptBooking(token, i)),
  );

  const succeeded = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(
    `\nResults: ${succeeded.length} succeeded, ${failed.length} failed`,
  );
  console.log("Failure reasons:", [...new Set(failed.map((f) => f.code))]);
  console.log(
    succeeded.length <= 5
      ? "✅ PASS — no overselling occurred (succeeded count is within tier capacity)"
      : "❌ FAIL — more bookings succeeded than tier capacity allows!",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
