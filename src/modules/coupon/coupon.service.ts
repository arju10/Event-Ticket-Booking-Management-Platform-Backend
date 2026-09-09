import { Prisma } from "../../generated/prisma/client";
import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../config/db";
import { writeAuditLog } from "../../lib/audit";
import { CreateCouponInput } from "./coupon.interface";

export interface CouponValidationResult {
  coupon: {
    id: string;
    code: string;
    discountType: string;
    discountValue: Prisma.Decimal;
    maxDiscount: Prisma.Decimal | null;
  };
  discountAmount: number;
}

// Validates a coupon against all rules from spec 8.5 and computes the
// discount. Runs INSIDE the booking transaction (tx) so usedCount increments
// atomically with the booking it applies to — two concurrent bookings racing
// the last use of a limited coupon cannot both succeed.
export async function validateAndPriceCoupon(
  tx: Prisma.TransactionClient,
  code: string,
  userId: string,
  totalPrice: number,
): Promise<CouponValidationResult> {
  const coupon = await tx.coupon.findFirst({
    where: { code, deletedAt: null },
  });
  if (!coupon || !coupon.isActive)
    throw ApiError.badRequest("Coupon is invalid or expired", [
      { field: "couponCode", message: "Invalid coupon" },
    ]);

  const now = new Date();
  if (now < coupon.startDate || now > coupon.endDate) {
    throw new ApiError(400, "Coupon is expired or invalid", "INVALID_COUPON");
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, "Coupon usage limit reached", "INVALID_COUPON");
  }
  if (coupon.minPurchase && totalPrice < Number(coupon.minPurchase)) {
    throw new ApiError(
      400,
      `Coupon requires a minimum purchase of ${coupon.minPurchase}`,
      "INVALID_COUPON",
    );
  }

  const priorUses = await tx.booking.count({
    where: {
      userId,
      couponCode: code,
      status: { in: ["CONFIRMED", "CHECKED_IN", "PENDING"] },
    },
  });
  if (priorUses >= coupon.perUserLimit) {
    throw new ApiError(
      400,
      "You have already used this coupon",
      "INVALID_COUPON",
    );
  }

  let discountAmount =
    coupon.discountType === "PERCENTAGE"
      ? (totalPrice * Number(coupon.discountValue)) / 100
      : Number(coupon.discountValue);

  if (coupon.maxDiscount)
    discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
  discountAmount = Math.min(discountAmount, totalPrice);

  return { coupon, discountAmount };
}

// Standalone, read-only preview for POST /coupons/validate — reuses the same
// rule set as the transactional validator above, just without the tx lock
// (nothing is committed here, it is purely informational for the client).
async function previewCoupon(
  code: string,
  userId: string,
  eventId: string,
  ticketTierId: string,
  quantity: number,
) {
  const tier = await prisma.ticketTier.findFirst({
    where: { id: ticketTierId, eventId, deletedAt: null },
  });
  if (!tier) throw ApiError.notFound("Ticket tier not found");

  const totalPrice = Number(tier.price) * quantity;
  const { coupon, discountAmount } = await validateAndPriceCoupon(
    prisma as unknown as Prisma.TransactionClient,
    code,
    userId,
    totalPrice,
  );

  return {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: Number(coupon.discountValue),
    discountedAmount: discountAmount,
    finalAmount: totalPrice - discountAmount,
  };
}

async function createCoupon(actorId: string, data: CreateCouponInput) {
  const coupon = await prisma.coupon.create({ data });
  await writeAuditLog({
    userId: actorId,
    action: "COUPON_CREATE",
    entityType: "Coupon",
    entityId: coupon.id,
    newValues: data,
  });
  return {
    id: coupon.id,
    code: coupon.code,
    discountValue: Number(coupon.discountValue),
    isActive: coupon.isActive,
    createdAt: coupon.createdAt,
  };
}

export const couponService = {
  validateAndPriceCoupon,
  previewCoupon,
  createCoupon,
};
