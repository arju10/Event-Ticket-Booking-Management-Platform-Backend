import { prisma } from "@/config/db";
import { ApiError } from "@/utils/ApiError";
import { generateSlug } from "@/utils/generateCodes";
import { buildPaginationMeta, parsePagination } from "@/types/common.types";
import { writeAuditLog } from "@/lib/audit";
import { Prisma } from "@/generated/prisma";
import { EventListFilters, CreateEventInput, UpdateEventInput } from "./event.interface";

const EVENT_CARD_SELECT = {
  id: true,
  title: true,
  slug: true,
  category: true,
  venue: true,
  city: true,
  startDate: true,
  bannerImage: true,
  status: true,
  organizer: { select: { id: true, name: true, profileImage: true } },
  ticketTiers: { select: { price: true }, where: { deletedAt: null } },
} as const;

async function getOrganizerId(eventId: string): Promise<string | null> {
  const event = await prisma.event.findFirst({ where: { id: eventId, deletedAt: null }, select: { organizerId: true } });
  return event?.organizerId ?? null;
}

async function createEvent(organizerId: string, data: CreateEventInput) {
  const event = await prisma.event.create({
    data: {
      title: data.title,
      description: data.description,
      category: data.category,
      subCategory: data.subCategory,
      venue: data.venue,
      address: data.address,
      city: data.city,
      country: data.country,
      isVirtual: data.isVirtual,
      virtualLink: data.virtualLink,
      startDate: data.startDate,
      endDate: data.endDate,
      timezone: data.timezone,
      maxTicketsPerUser: data.maxTicketsPerUser,
      isWaitlistEnabled: data.isWaitlistEnabled,
      allowRefund: data.allowRefund,
      ageRestriction: data.ageRestriction,
      bannerImage: data.bannerImage,
      galleryImages: data.galleryImages,
      additionalInfo: data.additionalInfo as Prisma.InputJsonValue,
      slug: generateSlug(data.title),
      organizerId,
      status: "DRAFT",
    },
  });
  await writeAuditLog({
    userId: organizerId,
    action: "CREATE",
    entityType: "Event",
    entityId: event.id,
    newValues: { title: event.title, status: event.status },
  });
  return event;
}

async function listEvents(filters: EventListFilters) {
  const { page, limit, skip } = parsePagination(filters as unknown as Record<string, unknown>);

  const where: Prisma.EventWhereInput = { deletedAt: null };

  // Public callers only ever see PUBLISHED events; organizers/admins may pass
  // `status` explicitly to see their own DRAFT/CANCELLED events.
  if (filters.status) {
    where.status = filters.status as Prisma.EventWhereInput["status"];
  } else {
    where.status = "PUBLISHED";
  }

  if (filters.category) where.category = filters.category;
  if (filters.subCategory) where.subCategory = filters.subCategory;
  if (filters.city) where.city = { equals: filters.city, mode: "insensitive" };

  if (filters.dateFrom || filters.dateTo) {
    where.startDate = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
    };
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { venue: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const sortBy = filters.sortBy ?? "startDate";
  const sortOrder = filters.sortOrder ?? "asc";

  const [total, events] = await Promise.all([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      select: EVENT_CARD_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
  ]);

  let items = events.map((e) => ({
    ...e,
    lowestPrice: e.ticketTiers.length ? Math.min(...e.ticketTiers.map((t) => Number(t.price))) : null,
    ticketTiers: undefined,
  }));

  if (filters.priceMin !== undefined) {
    items = items.filter((e) => e.lowestPrice !== null && e.lowestPrice >= filters.priceMin!);
  }
  if (filters.priceMax !== undefined) {
    items = items.filter((e) => e.lowestPrice !== null && e.lowestPrice <= filters.priceMax!);
  }

  return { items, pagination: buildPaginationMeta(total, page, limit) };
}

async function getEventById(id: string) {
  const event = await prisma.event.findFirst({
    where: { id, deletedAt: null },
    include: {
      organizer: { select: { id: true, name: true, profileImage: true, email: true } },
      ticketTiers: { where: { deletedAt: null } },
    },
  });
  if (!event) throw ApiError.notFound("Event not found");

  const [bookingCount, reviewAgg] = await Promise.all([
    prisma.booking.count({ where: { eventId: id, status: { in: ["CONFIRMED", "CHECKED_IN"] } } }),
    prisma.review.aggregate({ where: { eventId: id, deletedAt: null }, _avg: { rating: true }, _count: true }),
  ]);

  const ticketTiers = event.ticketTiers.map((t) => ({
    ...t,
    available: t.quantity - t.sold - t.reserved,
  }));

  return {
    ...event,
    ticketTiers,
    statistics: {
      totalBookings: bookingCount,
      averageRating: reviewAgg._avg.rating ? Number(reviewAgg._avg.rating.toFixed(1)) : null,
      totalReviews: reviewAgg._count,
    },
  };
}

async function updateEvent(id: string, data: UpdateEventInput) {
  const event = await prisma.event.findFirst({ where: { id, deletedAt: null } });
  if (!event) throw ApiError.notFound("Event not found");
  if (event.startDate.getTime() <= Date.now()) {
    throw ApiError.conflict("Cannot edit an event that has already started");
  }

  const updated = await prisma.event.update({
    where: { id },
    data: { ...data, additionalInfo: data.additionalInfo as Prisma.InputJsonValue | undefined },
  });
  return updated;
}

async function updateEventStatus(id: string, status: string, actorId: string) {
  const event = await prisma.event.findFirst({ where: { id, deletedAt: null } });
  if (!event) throw ApiError.notFound("Event not found");

  const data: Prisma.EventUpdateInput = { status: status as Prisma.EventUpdateInput["status"] };
  if (status === "PUBLISHED") data.publishedAt = new Date();
  if (status === "CANCELLED") data.cancelledAt = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const ev = await tx.event.update({ where: { id }, data });

    if (status === "CANCELLED") {
      // Full-refund every CONFIRMED/CHECKED_IN booking — the organizer
      // cancelled, not the attendee, so the standard refund-window policy
      // does not apply here.
      const affected = await tx.booking.findMany({
        where: { eventId: id, status: { in: ["CONFIRMED", "CHECKED_IN"] } },
      });
      for (const booking of affected) {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: "REFUNDED",
            refundAmount: booking.finalAmount,
            refundProcessedAt: new Date(),
            cancellationReason: "Event cancelled by organizer",
          },
        });
        // NOTE: triggering the actual provider refund (Stripe/SSLCommerz) is
        // handled by paymentService.refundPayment in a follow-up job/call —
        // kept out of this transaction since it is an external network call.
        await writeAuditLog(
          {
            userId: actorId,
            action: "REFUND",
            entityType: "Booking",
            entityId: booking.id,
            newValues: { status: "REFUNDED", refundAmount: booking.finalAmount },
            description: "Auto-refunded due to event cancellation",
          },
          tx
        );
      }
    }

    await writeAuditLog(
      {
        userId: actorId,
        action: "STATUS_CHANGE",
        entityType: "Event",
        entityId: id,
        oldValues: { status: event.status },
        newValues: { status },
      },
      tx
    );

    return ev;
  });

  return updated;
}

async function deleteEvent(id: string, actorId: string) {
  const event = await prisma.event.findFirst({ where: { id, deletedAt: null } });
  if (!event) throw ApiError.notFound("Event not found");

  const soon = event.startDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
  const hasActiveBookings = await prisma.booking.count({
    where: { eventId: id, status: { in: ["CONFIRMED", "CHECKED_IN", "PENDING"] } },
  });

  if (soon && hasActiveBookings > 0) {
    throw ApiError.conflict(
      "Cannot delete an event with active bookings less than 7 days before start — cancel it instead to trigger refunds",
      "CANCELLATION_NOT_ALLOWED"
    );
  }

  await prisma.event.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  await writeAuditLog({ userId: actorId, action: "SOFT_DELETE", entityType: "Event", entityId: id });
}

export const eventService = {
  getOrganizerId,
  createEvent,
  listEvents,
  getEventById,
  updateEvent,
  updateEventStatus,
  deleteEvent,
};
