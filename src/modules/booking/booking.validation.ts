import { z } from "zod";

export const createBookingSchema = z.object({
  body: z.object({
    ticketTierId: z.string().min(1),
    quantity: z.number().int().positive().max(20),
    specialRequests: z.string().max(500).optional(),
    dietaryNeeds: z.string().max(200).optional(),
    couponCode: z.string().optional(),
  }),
});

export const cancelBookingSchema = z.object({
  body: z.object({
    cancellationReason: z.string().min(2).max(300),
  }),
});

export const checkInSchema = z.object({
  body: z.object({
    qrCode: z.string().min(1),
  }),
});

export const listMyBookingsQuerySchema = z.object({
  query: z.object({
    status: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    eventId: z.string().optional(),
  }),
});
