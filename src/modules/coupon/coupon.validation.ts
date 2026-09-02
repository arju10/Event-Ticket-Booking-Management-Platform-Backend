import { z } from "zod";

export const validateCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1),
    eventId: z.string().min(1),
    ticketTierId: z.string().min(1),
    quantity: z.number().int().positive(),
  }),
});

export const createCouponSchema = z.object({
  body: z
    .object({
      code: z.string().min(3).max(30).toUpperCase(),
      description: z.string().max(300).optional(),
      discountType: z.enum(["PERCENTAGE", "FIXED"]),
      discountValue: z.number().positive(),
      minPurchase: z.number().nonnegative().optional(),
      maxDiscount: z.number().positive().optional(),
      usageLimit: z.number().int().positive().optional(),
      perUserLimit: z.number().int().positive().optional(),
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
    })
    .refine((d) => d.endDate.getTime() > d.startDate.getTime(), {
      message: "endDate must be after startDate",
      path: ["endDate"],
    })
    .refine((d) => d.discountType !== "PERCENTAGE" || d.discountValue <= 100, {
      message: "Percentage discount cannot exceed 100",
      path: ["discountValue"],
    }),
});
