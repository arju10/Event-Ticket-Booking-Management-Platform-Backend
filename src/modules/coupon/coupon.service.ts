import { Prisma } from "@prisma/client";
import { ApiError } from "@/utils/ApiError";

export interface CouponValidationResult {
  coupon: { id: string; code: string; discountType: string; discountValue: Prisma.Decimal; maxDiscount: Prisma.Decimal | null };
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
  totalPrice: number
): Promise<CouponValidationResult> {
  const coupon = await tx.coupon.findFirst({ where: { code, deletedAt: null } });
  if (!coupon || !coupon.isActive) throw ApiError.badRequest("Coupon is invalid or expired", [{ field: "couponCode", message: "Invalid coupon" }]);

  const now = new Date();
  if (now < coupon.startDate || now > coupon.endDate) {
    throw new ApiError(400, "Coupon is expired or invalid", "INVALID_COUPON");
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, "Coupon usage limit reached", "INVALID_COUPON");
  }
  if (coupon.minPurchase && totalPrice < Number(coupon.minPurchase)) {
    throw new ApiError(400, `Coupon requires a minimum purchase of ${coupon.minPurchase}`, "INVALID_COUPON");
  }

  const priorUses = await tx.booking.count({
    where: { userId, couponCode: code, status: { in: ["CONFIRMED", "CHECKED_IN", "PENDING"] } },
  });
  if (priorUses >= coupon.perUserLimit) {
    throw new ApiError(400, "You have already used this coupon", "INVALID_COUPON");
  }

  let discountAmount =
    coupon.discountType === "PERCENTAGE" ? (totalPrice * Number(coupon.discountValue)) / 100 : Number(coupon.discountValue);

  if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
  discountAmount = Math.min(discountAmount, totalPrice);

  return { coupon, discountAmount };
}
