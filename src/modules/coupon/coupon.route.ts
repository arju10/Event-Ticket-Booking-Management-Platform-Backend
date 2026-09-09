import { Router } from "express";
import { couponController } from "./coupon.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validateRequest } from "../../middlewares/validateRequest";
import { validateCouponSchema, createCouponSchema } from "./coupon.validation";

const router = Router();
router.post(
  "/validate",
  authenticate,
  validateRequest(validateCouponSchema),
  couponController.validateCoupon,
);
export const couponRoutes = router;

const adminRouter = Router();
adminRouter.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validateRequest(createCouponSchema),
  couponController.createCoupon,
);
export const couponAdminRoutes = adminRouter;
