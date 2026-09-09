import { Router } from "express";

import { authRoutes } from "../modules/auth/auth.route";
import { userRoutes } from "../modules/user/user.route";
import { eventRoutes } from "../modules/event/event.route";
import { ticketTierFlatRoutes } from "../modules/ticketTier/ticketTier.route";
import {
  bookingFlatRoutes,
  bookingMyRoutes,
} from "../modules/booking/booking.route";
import { paymentRoutes } from "../modules/payment/payment.route";
import { waitlistFlatRoutes } from "../modules/waitlist/waitlist.route";
import { reviewFlatRoutes } from "../modules/review/review.route";
import { couponRoutes } from "../modules/coupon/coupon.route";
import {
  notificationRoutes,
  notificationFlatRoutes,
} from "../modules/notification/notification.route";
import { adminRoutes } from "../modules/admin/admin.route";

const router = Router();

// Nested resources (ticket tiers, waitlist, reviews, booking) are mounted
// inside event.route.ts itself under /events/:eventId/... — only the
// top-level module prefixes are wired here.
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/users/bookings", bookingMyRoutes);
router.use("/users/notifications", notificationRoutes);
router.use("/events", eventRoutes);
router.use("/ticket-tiers", ticketTierFlatRoutes);
router.use("/bookings", bookingFlatRoutes);
router.use("/payments", paymentRoutes);
router.use("/waitlist", waitlistFlatRoutes);
router.use("/reviews", reviewFlatRoutes);
router.use("/coupons", couponRoutes);
router.use("/notifications", notificationFlatRoutes);
router.use("/admin", adminRoutes);

export const apiRoutes = router;
