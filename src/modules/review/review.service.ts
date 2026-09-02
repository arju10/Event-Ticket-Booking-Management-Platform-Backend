import { prisma } from "@/config/db";
import { ApiError } from "@/utils/ApiError";
import { buildPaginationMeta, parsePagination } from "@/types/common.types";
import { writeAuditLog } from "@/lib/audit";
import { Prisma } from "@prisma/client";

async function getReviewEventOwnerId(reviewId: string): Promise<string | null> {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, deletedAt: null },
    select: { event: { select: { organizerId: true } } },
  });
  return review?.event.organizerId ?? null;
}

async function createReview(eventId: string, userId: string, bookingId: string, rating: number, comment?: string) {
  const booking = await prisma.booking.findFirst({ where: { id: bookingId, deletedAt: null } });
  if (!booking) throw ApiError.notFound("Booking not found");
  if (booking.userId !== userId) throw ApiError.forbidden("This is not your booking");
  if (booking.eventId !== eventId) throw ApiError.badRequest("Booking does not belong to this event");
  if (booking.status !== "CHECKED_IN") {
    throw ApiError.forbidden("You can only review an event after checking in to it");
  }

  const existing = await prisma.review.findUnique({ where: { bookingId } });
  if (existing) throw ApiError.conflict("This booking has already been reviewed");

  const review = await prisma.review.create({
    data: { userId, eventId, bookingId, rating, comment },
  });

  await writeAuditLog({ userId, action: "CREATE", entityType: "Review", entityId: review.id });

  return { id: review.id, rating: review.rating, comment: review.comment, createdAt: review.createdAt };
}

async function getEventReviews(eventId: string, filters: { page: number; limit: number; rating?: number }) {
  const { page, limit, skip } = parsePagination(filters as unknown as Record<string, unknown>);
  const where: Prisma.ReviewWhereInput = { eventId, deletedAt: null, isHidden: false };
  if (filters.rating) where.rating = filters.rating;

  const [total, reviews, statsAgg, distribution] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      include: { user: { select: { id: true, name: true, profileImage: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.review.aggregate({ where: { eventId, deletedAt: null, isHidden: false }, _avg: { rating: true }, _count: true }),
    prisma.review.groupBy({ by: ["rating"], where: { eventId, deletedAt: null, isHidden: false }, _count: true }),
  ]);

  const ratingDistribution: Record<string, number> = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
  for (const row of distribution) ratingDistribution[String(row.rating)] = row._count;

  return {
    items: reviews,
    statistics: {
      averageRating: statsAgg._avg.rating ? Number(statsAgg._avg.rating.toFixed(1)) : null,
      totalReviews: statsAgg._count,
      ratingDistribution,
    },
    pagination: buildPaginationMeta(total, page, limit),
  };
}

async function respondToReview(reviewId: string, response: string) {
  const review = await prisma.review.findFirst({ where: { id: reviewId, deletedAt: null } });
  if (!review) throw ApiError.notFound("Review not found");
  if (review.organizerResponse) throw ApiError.conflict("This review already has a response");

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: { organizerResponse: response, responseDate: new Date() },
  });

  return { id: updated.id, organizerResponse: updated.organizerResponse, responseDate: updated.responseDate };
}

export const reviewService = { getReviewEventOwnerId, createReview, getEventReviews, respondToReview };
