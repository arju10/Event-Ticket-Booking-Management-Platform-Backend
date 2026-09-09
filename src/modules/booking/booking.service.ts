import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { generateBookingNumber } from "../../utils/generateCodes";
import { buildPaginationMeta, parsePagination } from "../../types/common.types";
import { writeAuditLog } from "../../lib/audit";
import { validateAndPriceCoupon } from "../coupon/coupon.service";
import { getRefundPercent, BOOKING_INCLUDE } from "./booking.constant";
import { CreateBookingInput } from "./booking.interface";
import { env } from "../../config/env";
import { Prisma } from "../../generated/prisma/client";
import { offerNextWaitlistEntry } from "../waitlist/waitlist.service";

interface TierRow {
  id: string;
  eventId: string;
  price: Prisma.Decimal;
  quantity: number;
  sold: number;
  reserved: number;
  minPurchase: number;
  maxPurchase: number;
  saleStartDate: Date | null;
  saleEndDate: Date | null;
  status: string;
}

async function getBookingOwnerId(bookingId: string): Promise<string | null> {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, deletedAt: null },
    select: { userId: true },
  });
  return booking?.userId ?? null;
}

async function getBookingEventOwnerId(
  bookingId: string,
): Promise<string | null> {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, deletedAt: null },
    select: { event: { select: { organizerId: true } } },
  });
  return booking?.event.organizerId ?? null;
}

// ============================================================
// CREATE BOOKING — the concurrency-critical checkout transaction
// ============================================================
async function createBooking(
  eventId: string,
  userId: string,
  input: CreateBookingInput,
) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
  });
  if (!event) throw ApiError.notFound("Event not found");
  if (event.status !== "PUBLISHED")
    throw ApiError.unprocessable("Event is not open for booking");

  const booking = await prisma.$transaction(async (tx) => {
    // Steps 1-4 of spec 8.1, collapsed into ONE atomic conditional UPDATE:
    // the row is locked by Postgres for the duration of this statement, and
    // the WHERE clause re-checks capacity against the *current* committed
    // row values — not a value read earlier in JS — so two concurrent
    // requests racing the last ticket cannot both succeed.
    const rows = await tx.$queryRaw<TierRow[]>`
      UPDATE "TicketTier"
      SET reserved = reserved + ${input.quantity}
      WHERE id = ${input.ticketTierId}
        AND "deletedAt" IS NULL
        AND (quantity - sold - reserved) >= ${input.quantity}
      RETURNING id, "eventId", price, quantity, sold, reserved, "minPurchase", "maxPurchase", "saleStartDate", "saleEndDate", status
    `;

    if (rows.length === 0) {
      const tier = await tx.ticketTier.findFirst({
        where: { id: input.ticketTierId, deletedAt: null },
      });
      if (!tier) throw ApiError.notFound("Ticket tier not found");
      const available = tier.quantity - tier.sold - tier.reserved;
      throw new ApiError(
        409,
        "Not enough tickets available",
        "INSUFFICIENT_TICKETS",
        [
          {
            field: input.ticketTierId,
            message: `Only ${available} ticket(s) remaining`,
          },
        ],
      );
    }

    const tier = rows[0];
    if (tier.eventId !== eventId)
      throw ApiError.badRequest("Ticket tier does not belong to this event");

    const now = new Date();
    if (
      (tier.saleStartDate && now < tier.saleStartDate) ||
      (tier.saleEndDate && now > tier.saleEndDate)
    ) {
      throw ApiError.unprocessable(
        "Ticket sales are not currently open for this tier",
        "SALES_CLOSED",
      );
    }

    if (
      input.quantity < tier.minPurchase ||
      input.quantity > tier.maxPurchase
    ) {
      throw ApiError.badRequest(
        `Quantity must be between ${tier.minPurchase} and ${tier.maxPurchase} for this tier`,
      );
    }

    const existingAgg = await tx.booking.aggregate({
      where: {
        userId,
        eventId,
        status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] },
      },
      _sum: { quantity: true },
    });
    const alreadyHeld = existingAgg._sum.quantity ?? 0;
    if (alreadyHeld + input.quantity > event.maxTicketsPerUser) {
      throw ApiError.unprocessable(
        `You can book at most ${event.maxTicketsPerUser} tickets for this event`,
        "MAX_TICKETS_EXCEEDED",
      );
    }

    const unitPrice = Number(tier.price);
    const totalPrice = unitPrice * input.quantity;
    let discountAmount = 0;

    if (input.couponCode) {
      const couponResult = await validateAndPriceCoupon(
        tx,
        input.couponCode,
        userId,
        totalPrice,
      );
      discountAmount = couponResult.discountAmount;
      await tx.coupon.update({
        where: { id: couponResult.coupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    const finalAmount = totalPrice - discountAmount;
    const expiresAt = new Date(Date.now() + env.bookingHoldMinutes * 60 * 1000);

    const created = await tx.booking.create({
      data: {
        bookingNumber: generateBookingNumber(),
        userId,
        eventId,
        ticketTierId: input.ticketTierId,
        quantity: input.quantity,
        unitPrice,
        totalPrice,
        discountAmount,
        finalAmount,
        couponCode: input.couponCode,
        specialRequests: input.specialRequests,
        dietaryNeeds: input.dietaryNeeds,
        status: "PENDING",
        expiresAt,
      },
    });

    await writeAuditLog(
      {
        userId,
        action: "CREATE",
        entityType: "Booking",
        entityId: created.id,
        newValues: { quantity: input.quantity, finalAmount },
      },
      tx,
    );

    return created;
  });

  return booking;
}

async function listMyBookings(
  userId: string,
  filters: { status?: string; page: number; limit: number; eventId?: string },
) {
  const { page, limit, skip } = parsePagination(
    filters as unknown as Record<string, unknown>,
  );
  const where: Prisma.BookingWhereInput = { userId, deletedAt: null };
  if (filters.status)
    where.status = filters.status as Prisma.BookingWhereInput["status"];
  if (filters.eventId) where.eventId = filters.eventId;

  const [total, bookings] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: BOOKING_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    items: bookings,
    pagination: buildPaginationMeta(total, page, limit),
  };
}

// A booking may be viewed/cancelled by the attendee who made it, the event's
// organizer, or an admin. Centralized here since both getBookingById and
// cancelBooking need the same check against the same loaded record.
function assertCanAccessBooking(
  booking: { userId: string; event: { organizerId: string } },
  actor: { id: string; role: string },
) {
  if (actor.role === "ADMIN") return;
  if (booking.userId === actor.id) return;
  if (booking.event.organizerId === actor.id) return;
  throw ApiError.forbidden("You do not have access to this booking");
}

async function getBookingById(
  bookingId: string,
  actor: { id: string; role: string },
) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, deletedAt: null },
    include: BOOKING_INCLUDE,
  });
  if (!booking) throw ApiError.notFound("Booking not found");
  assertCanAccessBooking(booking, actor);
  return booking;
}

async function cancelBooking(
  bookingId: string,
  actor: { id: string; role: string },
  reason: string,
) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, deletedAt: null },
    include: { event: true },
  });
  if (!booking) throw ApiError.notFound("Booking not found");
  assertCanAccessBooking(booking, actor);
  const actorId = actor.id;

  if (booking.status === "CHECKED_IN") {
    throw new ApiError(
      409,
      "Cannot cancel a booking that has already been checked in",
      "CANCELLATION_NOT_ALLOWED",
    );
  }
  if (
    ["CANCELLED", "REFUNDED", "PARTIALLY_REFUNDED", "EXPIRED"].includes(
      booking.status,
    )
  ) {
    throw new ApiError(
      409,
      "Booking is already cancelled",
      "CANCELLATION_NOT_ALLOWED",
    );
  }
  if (booking.event.startDate.getTime() <= Date.now()) {
    throw new ApiError(
      409,
      "Cannot cancel — the event has already started",
      "CANCELLATION_NOT_ALLOWED",
    );
  }

  let refundPercent = 100;
  if (!booking.event.allowRefund) {
    refundPercent = 0;
  } else {
    const hoursUntilStart =
      (booking.event.startDate.getTime() - Date.now()) / (1000 * 60 * 60);
    refundPercent = getRefundPercent(hoursUntilStart);
  }
  const refundAmount = Number(booking.finalAmount) * (refundPercent / 100);
  const newStatus =
    refundPercent === 100
      ? "REFUNDED"
      : refundPercent > 0
        ? "PARTIALLY_REFUNDED"
        : "CANCELLED";
  const wasConfirmed = booking.status === "CONFIRMED";
  const wasPending = booking.status === "PENDING";

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: newStatus,
        cancelledAt: new Date(),
        cancellationReason: reason,
        refundAmount,
        refundProcessedAt: refundAmount > 0 ? new Date() : null,
      },
    });

    // Release whichever counter this booking was holding.
    if (wasPending) {
      await tx.ticketTier.update({
        where: { id: booking.ticketTierId },
        data: { reserved: { decrement: booking.quantity } },
      });
    } else if (wasConfirmed) {
      await tx.ticketTier.update({
        where: { id: booking.ticketTierId },
        data: { sold: { decrement: booking.quantity } },
      });
    }

    await writeAuditLog(
      {
        userId: actorId,
        action: "CANCEL",
        entityType: "Booking",
        entityId: bookingId,
        newValues: { status: newStatus, refundAmount },
      },
      tx,
    );
  });

  // Secondary side-effect, intentionally outside the main transaction: a
  // failure here should not roll back a cancellation that already succeeded.
  if (booking.event.isWaitlistEnabled && (wasConfirmed || wasPending)) {
    await offerNextWaitlistEntry(
      booking.eventId,
      booking.ticketTierId,
      booking.quantity,
    ).catch(() => undefined);
  }

  return {
    id: bookingId,
    status: newStatus,
    refundAmount,
    refundPolicy:
      refundPercent === 100
        ? "FULL_REFUND"
        : refundPercent > 0
          ? "PARTIAL_REFUND"
          : "NO_REFUND",
    cancelledAt: new Date(),
  };
}

async function checkIn(bookingId: string, actorId: string, qrCode: string) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, deletedAt: null },
    include: {
      user: { select: { name: true } },
      ticketTier: { select: { name: true } },
    },
  });
  if (!booking) throw ApiError.notFound("Booking not found");
  if (booking.bookingNumber !== qrCode) {
    throw ApiError.badRequest("QR code does not match this booking");
  }
  if (booking.status === "CHECKED_IN") {
    throw new ApiError(
      409,
      `Ticket already checked in at ${booking.checkedInAt?.toISOString()}`,
      "ALREADY_CHECKED_IN",
    );
  }
  if (booking.status !== "CONFIRMED") {
    throw ApiError.unprocessable(
      "Booking is not in a confirmed state and cannot be checked in",
    );
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "CHECKED_IN",
      checkedInAt: new Date(),
      checkedInBy: actorId,
    },
  });

  await writeAuditLog({
    userId: actorId,
    action: "CHECK_IN",
    entityType: "Booking",
    entityId: bookingId,
  });

  return {
    bookingId: updated.id,
    checkedInAt: updated.checkedInAt,
    attendeeName: booking.user.name,
    ticketTierName: booking.ticketTier.name,
    quantity: updated.quantity,
  };
}

// Called by the scheduled job in src/jobs — releases inventory held by
// abandoned PENDING checkouts (spec 8.2).
async function expireStalePendingBookings(): Promise<number> {
  const stale = await prisma.booking.findMany({
    where: { status: "PENDING", expiresAt: { lt: new Date() } },
  });

  for (const booking of stale) {
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: "EXPIRED" },
      });
      await tx.ticketTier.update({
        where: { id: booking.ticketTierId },
        data: { reserved: { decrement: booking.quantity } },
      });
    });
  }

  return stale.length;
}

export const bookingService = {
  getBookingOwnerId,
  getBookingEventOwnerId,
  createBooking,
  listMyBookings,
  getBookingById,
  cancelBooking,
  checkIn,
  expireStalePendingBookings,
};
