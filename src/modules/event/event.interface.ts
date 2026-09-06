import { z } from "zod";
import { createEventSchema, updateEventSchema } from "./event.validation";

// Derived directly from the Zod schemas so the service layer gets real,
// checked field types instead of a loose Record<string, any> -- this is what
// actually fixes the "missing properties" Prisma type error: spreading a
// concrete interface (with title/description/etc. as known keys) into a
// Prisma `create`/`update` payload type-checks correctly, whereas spreading
// an untyped Record collapses to an index signature Prisma can't reconcile
// with its required-field union types.
export type CreateEventInput = z.infer<typeof createEventSchema>["body"];
export type UpdateEventInput = z.infer<typeof updateEventSchema>["body"];

export interface EventListFilters {
  page: number;
  limit: number;
  category?: string;
  subCategory?: string;
  city?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  dateFrom?: string;
  dateTo?: string;
  priceMin?: number;
  priceMax?: number;
  search?: string;
  requesterId?: string;
  requesterRole?: string;
}
