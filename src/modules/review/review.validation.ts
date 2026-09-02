import { z } from "zod";

export const createReviewSchema = z.object({
  body: z.object({
    bookingId: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(2000).optional(),
  }),
});

export const respondToReviewSchema = z.object({
  body: z.object({
    response: z.string().min(2).max(1000),
  }),
});

export const listReviewsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    rating: z.string().optional(),
  }),
});
