import { z } from "zod";
import { createTicketTierSchema, updateTicketTierSchema } from "./ticketTier.validation";

export type CreateTicketTierInput = z.infer<typeof createTicketTierSchema>["body"];
export type UpdateTicketTierInput = z.infer<typeof updateTicketTierSchema>["body"];
