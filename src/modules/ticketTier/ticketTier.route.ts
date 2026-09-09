import { Router } from "express";
import { ticketTierController } from "./ticketTier.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { isResourceOwner } from "../../middlewares/isResourceOwner";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  createTicketTierSchema,
  updateTicketTierSchema,
} from "./ticketTier.validation";
import { ticketTierService } from "./ticketTier.service";

// mergeParams so nested mounting under /events/:eventId/ticket-tiers still
// exposes req.params.eventId here.
const router = Router({ mergeParams: true });

const ownsEvent = isResourceOwner((req) =>
  ticketTierService.getEventOwnerId(req.params.eventId),
);
const ownsTier = isResourceOwner((req) =>
  ticketTierService.getTierOwnerId(req.params.id),
);

router.post(
  "/",
  authenticate,
  authorize("ORGANIZER", "ADMIN"),
  ownsEvent,
  validateRequest(createTicketTierSchema),
  ticketTierController.createTicketTier,
);
router.get("/", ticketTierController.listTicketTiers);

export const ticketTierRoutes = router;

// A second router for the flat /ticket-tiers/:id PATCH route (not nested
// under an event path), mounted separately in routes/index.ts.
const flatRouter = Router();
flatRouter.patch(
  "/:id",
  authenticate,
  authorize("ORGANIZER", "ADMIN"),
  ownsTier,
  validateRequest(updateTicketTierSchema),
  ticketTierController.updateTicketTier,
);
export const ticketTierFlatRoutes = flatRouter;
