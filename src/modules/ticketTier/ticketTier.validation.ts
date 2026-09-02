import { z } from "zod";

export const createTicketTierSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(50),
    description: z.string().max(500).optional(),
    price: z.number().nonnegative(),
    quantity: z.number().int().positive(),
    minPurchase: z.number().int().positive().optional(),
    maxPurchase: z.number().int().positive().optional(),
    saleStartDate: z.coerce.date().optional(),
    saleEndDate: z.coerce.date().optional(),
    includes: z.array(z.string()).optional(),
  }),
});

export const updateTicketTierSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(50).optional(),
    description: z.string().max(500).optional(),
    price: z.number().nonnegative().optional(),
    quantity: z.number().int().positive().optional(),
    minPurchase: z.number().int().positive().optional(),
    maxPurchase: z.number().int().positive().optional(),
    saleStartDate: z.coerce.date().optional(),
    saleEndDate: z.coerce.date().optional(),
    status: z.enum(["ACTIVE", "SOLD_OUT", "PAUSED"]).optional(),
    includes: z.array(z.string()).optional(),
  }),
});
