import { Router } from "express";
import { waitlistController } from "./waitlist.controller";
import { authenticate } from "@/middlewares/authenticate";
import { authorize } from "@/middlewares/authorize";
import { isResourceOwner } from "@/middlewares/isResourceOwner";
import { validateRequest } from "@/middlewares/validateRequest";
import { joinWaitlistSchema } from "./waitlist.validation";
import { waitlistService } from "./waitlist.service";

// Nested router: mounted at /events/:eventId/waitlist
const router = Router({ mergeParams: true });
const ownsEvent = isResourceOwner((req) => waitlistService.getEventOwnerId(req.params.eventId));

router.post("/", authenticate, authorize("ATTENDEE", "ORGANIZER"), validateRequest(joinWaitlistSchema), waitlistController.joinWaitlist);
router.get("/", authenticate, authorize("ORGANIZER", "ADMIN"), ownsEvent, waitlistController.getEventWaitlist);

export const waitlistRoutes = router;

// Flat router: mounted at /waitlist for DELETE /waitlist/:id
const flatRouter = Router();
flatRouter.delete("/:id", authenticate, waitlistController.leaveWaitlist);
export const waitlistFlatRoutes = flatRouter;
