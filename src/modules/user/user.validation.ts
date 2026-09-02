import { z } from "zod";

export const updateMeSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(50).optional(),
    phone: z.string().optional(),
    bio: z.string().max(500).optional(),
    dateOfBirth: z.coerce.date().optional(),
    notificationPreferences: z
      .object({ email: z.boolean().optional(), sms: z.boolean().optional() })
      .optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1),
      newPassword: z
        .string()
        .min(8)
        .regex(/[A-Z]/, "Must contain at least one uppercase letter")
        .regex(/[a-z]/, "Must contain at least one lowercase letter")
        .regex(/[0-9]/, "Must contain at least one number"),
      confirmNewPassword: z.string().min(1),
    })
    .refine((d) => d.newPassword === d.confirmNewPassword, {
      message: "Passwords do not match",
      path: ["confirmNewPassword"],
    }),
});
