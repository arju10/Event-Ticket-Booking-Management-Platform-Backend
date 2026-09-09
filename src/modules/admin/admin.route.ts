import { Router } from "express";
import { adminController } from "./admin.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validateRequest } from "../../middlewares/validateRequest";
import { updateUserRoleSchema, suspendUserSchema } from "./admin.validation";
import { couponAdminRoutes } from "../coupon/coupon.route";

const router = Router();
router.use(authenticate, authorize("ADMIN"));

router.get("/users", adminController.listUsers);
router.patch(
  "/users/:id/role",
  validateRequest(updateUserRoleSchema),
  adminController.updateUserRole,
);
router.patch(
  "/users/:id/suspend",
  validateRequest(suspendUserSchema),
  adminController.suspendUser,
);
router.get("/dashboard-stats", adminController.getDashboardStats);
router.get("/audit-logs", adminController.getAuditLogs);
router.use("/coupons", couponAdminRoutes);

export const adminRoutes = router;
