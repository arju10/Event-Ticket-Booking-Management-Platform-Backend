import { Router, raw } from "express";
import { paymentController } from "./payment.controller";
import { authenticate } from "@/middlewares/authenticate";
import { validateRequest } from "@/middlewares/validateRequest";
import { paymentLimiter } from "@/middlewares/rateLimiter";
import { initiatePaymentSchema } from "./payment.validation";

const router = Router();

router.post("/initiate", authenticate, paymentLimiter, validateRequest(initiatePaymentSchema), paymentController.initiatePayment);

// Raw-body route for Stripe signature verification — also exported
// separately so app.ts can mount it BEFORE the global express.json()
// parser, which is required for webhook signature verification to work.
export const paymentWebhookRoute = Router();
paymentWebhookRoute.post("/webhook", raw({ type: "application/json" }), paymentController.webhook);

router.post("/mock-confirm/:bookingId", authenticate, paymentController.mockConfirm);
router.get("/:id/status", authenticate, paymentController.getPaymentStatus);

export const paymentRoutes = router;
