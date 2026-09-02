import { z } from "zod";

export const joinWaitlistSchema = z.object({
  body: z.object({
    ticketTierId: z.string().min(1),
    quantity: z.number().int().positive().max(20),
  }),
});
