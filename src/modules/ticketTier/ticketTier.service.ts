import { prisma } from "@/config/db";
import { ApiError } from "@/utils/ApiError";
import { writeAuditLog } from "@/lib/audit";

function withAvailable<T extends { quantity: number; sold: number; reserved: number }>(tier: T) {
  return { ...tier, available: tier.quantity - tier.sold - tier.reserved };
}

async function getEventOwnerId(eventId: string): Promise<string | null> {
  const event = await prisma.event.findFirst({ where: { id: eventId, deletedAt: null }, select: { organizerId: true } });
  return event?.organizerId ?? null;
}

async function getTierOwnerId(tierId: string): Promise<string | null> {
  const tier = await prisma.ticketTier.findFirst({
    where: { id: tierId, deletedAt: null },
    select: { event: { select: { organizerId: true } } },
  });
  return tier?.event.organizerId ?? null;
}

async function createTicketTier(eventId: string, actorId: string, data: Record<string, unknown>) {
  const event = await prisma.event.findFirst({ where: { id: eventId, deletedAt: null } });
  if (!event) throw ApiError.notFound("Event not found");

  const tier = await prisma.ticketTier.create({ data: { ...data, eventId } as any });
  await writeAuditLog({ userId: actorId, action: "CREATE", entityType: "TicketTier", entityId: tier.id, newValues: data });
  return withAvailable(tier);
}

async function listTicketTiers(eventId: string) {
  const tiers = await prisma.ticketTier.findMany({ where: { eventId, deletedAt: null }, orderBy: { createdAt: "asc" } });
  return tiers.map(withAvailable);
}

async function updateTicketTier(tierId: string, actorId: string, data: Record<string, unknown>) {
  const tier = await prisma.ticketTier.findFirst({ where: { id: tierId, deletedAt: null } });
  if (!tier) throw ApiError.notFound("Ticket tier not found");

  if (data.quantity !== undefined) {
    const committed = tier.sold + tier.reserved;
    if ((data.quantity as number) < committed) {
      throw ApiError.unprocessable(
        `Cannot reduce quantity below ${committed} tickets already sold or reserved`,
        "QUANTITY_BELOW_COMMITTED"
      );
    }
  }

  const updated = await prisma.ticketTier.update({ where: { id: tierId }, data: data as any });
  await writeAuditLog({ userId: actorId, action: "UPDATE", entityType: "TicketTier", entityId: tierId, oldValues: tier, newValues: data });
  return withAvailable(updated);
}

export const ticketTierService = { getEventOwnerId, getTierOwnerId, createTicketTier, listTicketTiers, updateTicketTier };
