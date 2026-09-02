import { z } from "zod";

const eventStatuses = ["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED", "POSTPONED"] as const;

export const createEventSchema = z.object({
  body: z
    .object({
      title: z.string().min(5).max(200),
      description: z.string().min(50).max(5000),
      category: z.string().min(2),
      subCategory: z.string().optional(),
      venue: z.string().min(2),
      address: z.string().min(2),
      city: z.string().min(2),
      country: z.string().min(2),
      isVirtual: z.boolean().optional().default(false),
      virtualLink: z.string().url().optional(),
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
      timezone: z.string().optional(),
      maxTicketsPerUser: z.number().int().positive().optional(),
      isWaitlistEnabled: z.boolean().optional(),
      allowRefund: z.boolean().optional(),
      ageRestriction: z.number().int().positive().optional(),
      bannerImage: z.string().url().optional(),
      galleryImages: z.array(z.string().url()).optional(),
      additionalInfo: z.record(z.unknown()).optional(),
    })
    .refine((d) => d.startDate.getTime() > Date.now(), {
      message: "startDate must be in the future",
      path: ["startDate"],
    })
    .refine((d) => d.endDate.getTime() > d.startDate.getTime(), {
      message: "endDate must be after startDate",
      path: ["endDate"],
    }),
});

export const updateEventSchema = z.object({
  body: z.object({
    title: z.string().min(5).max(200).optional(),
    description: z.string().min(50).max(5000).optional(),
    category: z.string().min(2).optional(),
    subCategory: z.string().optional(),
    venue: z.string().min(2).optional(),
    address: z.string().min(2).optional(),
    city: z.string().min(2).optional(),
    country: z.string().min(2).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    allowRefund: z.boolean().optional(),
    bannerImage: z.string().url().optional(),
    galleryImages: z.array(z.string().url()).optional(),
    additionalInfo: z.record(z.unknown()).optional(),
  }),
});

export const updateEventStatusSchema = z.object({
  body: z.object({
    status: z.enum(eventStatuses),
  }),
});

export const listEventsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    category: z.string().optional(),
    subCategory: z.string().optional(),
    city: z.string().optional(),
    status: z.enum(eventStatuses).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    priceMin: z.string().optional(),
    priceMax: z.string().optional(),
    search: z.string().optional(),
  }),
});
