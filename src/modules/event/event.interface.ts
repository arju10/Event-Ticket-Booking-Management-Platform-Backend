import { z } from "zod";
import { createEventSchema, updateEventSchema } from "./event.validation";

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
