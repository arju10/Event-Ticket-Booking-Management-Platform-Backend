import { z } from "zod";
import { createCouponSchema } from "./coupon.validation";

export type CreateCouponInput = z.infer<typeof createCouponSchema>["body"];
