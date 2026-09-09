export const REFUND_POLICY = [
  { minHoursBeforeStart: 24 * 7, refundPercent: 100 },
  { minHoursBeforeStart: 24, refundPercent: 50 },
  { minHoursBeforeStart: 0, refundPercent: 0 },
] as const;

export function getRefundPercent(hoursUntilStart: number): number {
  for (const tier of REFUND_POLICY) {
    if (hoursUntilStart >= tier.minHoursBeforeStart) return tier.refundPercent;
  }
  return 0;
}

export const BOOKING_INCLUDE = {
  event: {
    select: {
      id: true,
      title: true,
      venue: true,
      startDate: true,
      endDate: true,
      bannerImage: true,
      organizerId: true,
      allowRefund: true,
      isWaitlistEnabled: true,
    },
  },
  ticketTier: { select: { id: true, name: true, price: true } },
  payment: { select: { method: true, status: true, transactionId: true } },
} as const;
