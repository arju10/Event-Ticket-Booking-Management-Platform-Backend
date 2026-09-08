import { Router } from "express";
import { notificationController } from "./notification.controller";
import { authenticate } from "../../middlewares/authenticate";

// Mounted at /users/notifications
const router = Router();
router.get("/", authenticate, notificationController.listNotifications);
export const notificationRoutes = router;

// Mounted at /notifications for the two PATCH routes
const flatRouter = Router();
flatRouter.patch("/:id/read", authenticate, notificationController.markAsRead);
flatRouter.patch("/read-all", authenticate, notificationController.markAllAsRead);
export const notificationFlatRoutes = flatRouter;
