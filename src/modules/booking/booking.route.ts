import { Router } from "express";
import { bookingController } from "./booking.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validateRequest } from "../../middlewares/validateRequest";
import { bookingLimiter } from "../../middlewares/rateLimiter";
import {
  createBookingSchema,
  cancelBookingSchema,
  checkInSchema,
} from "./booking.validation";

// Nested router: mounted at /events/:eventId/book (POST only) from event.route.ts
const router = Router({ mergeParams: true });
router.post(
  "/",
  authenticate,
  authorize("ATTENDEE", "ORGANIZER"),
  bookingLimiter,
  validateRequest(createBookingSchema),
  bookingController.createBooking,
);
export const bookingRoutes = router;

// Mounted at exactly /users/bookings (spec 7.5: GET /api/v1/users/bookings)
const myBookingsRouter = Router();
myBookingsRouter.get("/", authenticate, bookingController.listMyBookings);
export const bookingMyRoutes = myBookingsRouter;

// Mounted at /bookings for the :id-scoped operations. Fine-grained ownership
// (booking owner vs. event organizer vs. admin) is enforced inside
// booking.service where the full booking + event record is already loaded,
// rather than duplicating a lookup here.
const flatRouter = Router();
flatRouter.get("/:id", authenticate, bookingController.getBooking);
flatRouter.patch(
  "/:id/cancel",
  authenticate,
  validateRequest(cancelBookingSchema),
  bookingController.cancelBooking,
);
flatRouter.post(
  "/:id/check-in",
  authenticate,
  authorize("ORGANIZER", "ADMIN"),
  validateRequest(checkInSchema),
  bookingController.checkIn,
);

export const bookingFlatRoutes = flatRouter;
