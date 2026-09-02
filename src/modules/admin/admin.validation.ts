import { z } from "zod";

export const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.enum(["ATTENDEE", "ORGANIZER", "ADMIN"]),
  }),
});

export const suspendUserSchema = z.object({
  body: z.object({
    suspend: z.boolean(),
    reason: z.string().min(2).max(300),
  }),
});

export const listUsersQuerySchema = z.object({
  query: z.object({
    role: z.enum(["ATTENDEE", "ORGANIZER", "ADMIN"]).optional(),
    isActive: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
  }),
});

export const auditLogsQuerySchema = z.object({
  query: z.object({
    entityType: z.string().optional(),
    action: z.string().optional(),
    userId: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});
