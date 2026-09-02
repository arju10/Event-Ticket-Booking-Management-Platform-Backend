import { z } from "zod";

export const initiatePaymentSchema = z.object({
  body: z.object({
    bookingId: z.string().min(1),
    method: z.enum(["STRIPE", "SSLCOMMERZ", "BKASH"]).default("STRIPE"),
  }),
});
