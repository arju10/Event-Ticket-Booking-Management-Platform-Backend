import { Router } from "express";
import { reviewController } from "./review.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { isResourceOwner } from "../../middlewares/isResourceOwner";
import { validateRequest } from "../../middlewares/validateRequest";
import { createReviewSchema, respondToReviewSchema } from "./review.validation";
import { reviewService } from "./review.service";

// Nested router: mounted at /events/:eventId/review (POST) and /reviews (GET)
const router = Router({ mergeParams: true });

router.post("/", authenticate, authorize("ATTENDEE"), validateRequest(createReviewSchema), reviewController.createReview);
router.get("/", reviewController.getEventReviews);

export const reviewRoutes = router;

// Flat router: mounted at /reviews for POST /reviews/:id/respond
const flatRouter = Router();
const ownsReviewEvent = isResourceOwner((req) => reviewService.getReviewEventOwnerId(req.params.id));

flatRouter.post(
  "/:id/respond",
  authenticate,
  authorize("ORGANIZER", "ADMIN"),
  ownsReviewEvent,
  validateRequest(respondToReviewSchema),
  reviewController.respondToReview
);
export const reviewFlatRoutes = flatRouter;
