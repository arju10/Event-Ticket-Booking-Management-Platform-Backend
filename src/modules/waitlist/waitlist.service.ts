import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { env } from "../../config/env";
import { writeAuditLog } from "../../lib/audit";

async function getEventOwnerId(eventId: string): Promise<string | null> {
  const event = await prisma.event.findFirst({ where: { id: eventId, deletedAt: null }, select: { organizerId: true } });
  return event?.organizerId ?? null;
}

async function getWaitlistOwnerId(waitlistId: string): Promise<string | null> {
  const entry = await prisma.waitlist.findFirst({ where: { id: waitlistId, deletedAt: null }, select: { userId: true } });
  return entry?.userId ?? null;
}

async function joinWaitlist(eventId: string, userId: string, ticketTierId: string, quantity: number) {
  const event = await prisma.event.findFirst({ where: { id: eventId, deletedAt: null } });
  if (!event) throw ApiError.notFound("Event not found");
  if (!event.isWaitlistEnabled) throw ApiError.unprocessable("Waitlist is not enabled for this event");

  const tier = await prisma.ticketTier.findFirst({ where: { id: ticketTierId, eventId, deletedAt: null } });
  if (!tier) throw ApiError.notFound("Ticket tier not found");

  const available = tier.quantity - tier.sold - tier.reserved;
  if (available > 0) throw ApiError.unprocessable("This tier is not sold out — book directly instead", "TIER_NOT_SOLD_OUT");

  const position = (await prisma.waitlist.count({ where: { eventId, ticketTierId, status: "WAITING" } })) + 1;

  const entry = await prisma.waitlist.create({
    data: { eventId, userId, ticketTierId, quantity, status: "WAITING" },
  });

  await writeAuditLog({ userId, action: "CREATE", entityType: "Waitlist", entityId: entry.id });

  return { id: entry.id, position, status: entry.status, createdAt: entry.createdAt };
}

async function getEventWaitlist(eventId: string) {
  const entries = await prisma.waitlist.findMany({
    where: { eventId, deletedAt: null },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  let position = 0;
  const items = entries.map((e) => ({
    id: e.id,
    user: e.user,
    quantity: e.quantity,
    status: e.status,
    position: e.status === "WAITING" ? ++position : null,
    createdAt: e.createdAt,
  }));

  return { items, total: items.length };
}

async function leaveWaitlist(waitlistId: string, userId: string) {
  const entry = await prisma.waitlist.findFirst({ where: { id: waitlistId, deletedAt: null } });
  if (!entry) throw ApiError.notFound("Waitlist entry not found");
  if (entry.userId !== userId) throw ApiError.forbidden();

  await prisma.waitlist.update({ where: { id: waitlistId }, data: { status: "CANCELLED", deletedAt: new Date() } });
}

// Called by bookingService.cancelBooking when a CONFIRMED/PENDING booking
// frees up inventory (spec 8.4). Offers the freed slot to the oldest WAITING
// entry that fits within the freed quantity, holding the inventory via the
// tier's `reserved` counter for a fixed offer window.
// Exported directly (not just via `waitlistService`) so bookingService can
// import just this one function without pulling in the whole service object.
export async function offerNextWaitlistEntry(eventId: string, ticketTierId: string, freedQuantity: number) {
  const candidate = await prisma.waitlist.findFirst({
    where: { eventId, ticketTierId, status: "WAITING", quantity: { lte: freedQuantity } },
    orderBy: { createdAt: "asc" },
  });
  if (!candidate) return;

  const offerExpiresAt = new Date(Date.now() + env.waitlistOfferHours * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    // Hold the offered quantity so it cannot be sold to someone else while
    // the waitlisted user decides.
    await tx.ticketTier.update({ where: { id: ticketTierId }, data: { reserved: { increment: candidate.quantity } } });
    await tx.waitlist.update({
      where: { id: candidate.id },
      data: { status: "NOTIFIED", notifiedAt: new Date(), offerExpiresAt },
    });
    await tx.notification.create({
      data: {
        userId: candidate.userId,
        type: "WAITLIST_OFFER",
        title: "A ticket just opened up!",
        message: `A spot is available for your waitlisted event. You have ${env.waitlistOfferHours} hour(s) to book before it is offered to the next person in line.`,
        data: { eventId, ticketTierId, waitlistId: candidate.id },
      },
    });
  });
}

// Scheduled job companion (spec 8.4 step 3): expires lapsed offers, releases
// the hold, and cascades the offer to the next person in line.
async function expireLapsedWaitlistOffers(): Promise<number> {
  const lapsed = await prisma.waitlist.findMany({
    where: { status: "NOTIFIED", offerExpiresAt: { lt: new Date() } },
  });

  for (const entry of lapsed) {
    await prisma.$transaction(async (tx) => {
      await tx.ticketTier.update({ where: { id: entry.ticketTierId }, data: { reserved: { decrement: entry.quantity } } });
      await tx.waitlist.update({ where: { id: entry.id }, data: { status: "EXPIRED", expiredAt: new Date() } });
    });
    await offerNextWaitlistEntry(entry.eventId, entry.ticketTierId, entry.quantity);
  }

  return lapsed.length;
}

export const waitlistService = {
  getEventOwnerId,
  getWaitlistOwnerId,
  joinWaitlist,
  getEventWaitlist,
  leaveWaitlist,
  offerNextWaitlistEntry,
  expireLapsedWaitlistOffers,
};
