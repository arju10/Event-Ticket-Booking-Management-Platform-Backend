import { Router } from "express";
import { eventController } from "./event.controller";
import { authenticate } from "@/middlewares/authenticate";
import { authorize } from "@/middlewares/authorize";
import { isResourceOwner } from "@/middlewares/isResourceOwner";
import { validateRequest } from "@/middlewares/validateRequest";
import { createEventSchema, updateEventSchema, updateEventStatusSchema } from "./event.validation";
import { eventService } from "./event.service";
import { ticketTierRoutes } from "../ticketTier/ticketTier.route";
import { waitlistRoutes } from "../waitlist/waitlist.route";
import { reviewRoutes } from "../review/review.route";
import { bookingRoutes } from "../booking/booking.route";

const router = Router();

const ownsEvent = isResourceOwner((req) => eventService.getOrganizerId(req.params.id));

router.post("/", authenticate, authorize("ORGANIZER", "ADMIN"), validateRequest(createEventSchema), eventController.createEvent);
router.get("/", eventController.listEvents);
router.get("/:id", eventController.getEvent);
router.patch("/:id", authenticate, authorize("ORGANIZER", "ADMIN"), ownsEvent, validateRequest(updateEventSchema), eventController.updateEvent);
router.patch("/:id/status", authenticate, authorize("ORGANIZER", "ADMIN"), ownsEvent, validateRequest(updateEventStatusSchema), eventController.updateEventStatus);
router.delete("/:id", authenticate, authorize("ORGANIZER", "ADMIN"), ownsEvent, eventController.deleteEvent);

// Nested resource routes (ticket tiers, waitlist, reviews, booking) live under /events/:eventId/...
router.use("/:eventId/ticket-tiers", ticketTierRoutes);
router.use("/:eventId/waitlist", waitlistRoutes);
router.use("/:eventId/review", reviewRoutes);
router.use("/:eventId/reviews", reviewRoutes);
router.use("/:eventId/book", bookingRoutes);

export const eventRoutes = router;
