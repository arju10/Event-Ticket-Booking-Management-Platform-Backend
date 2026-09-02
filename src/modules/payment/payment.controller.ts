import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendSuccess } from "@/utils/ApiResponse";
import { paymentService } from "./payment.service";

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.initiatePayment(req.body.bookingId, req.user!.id, req.body.method);
  sendSuccess(res, 201, "Payment initiated successfully", result);
});

// Note: this route receives the RAW request body (see payment.route.ts /
// app.ts wiring) so the Stripe signature can be verified before JSON parsing.
const webhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;
  await paymentService.handleStripeWebhook(req.body as Buffer, signature);
  sendSuccess(res, 200, "Webhook processed successfully", null);
});

const mockConfirm = catchAsync(async (req: Request, res: Response) => {
  await paymentService.mockConfirmPayment(req.params.bookingId);
  sendSuccess(res, 200, "Payment mock-confirmed (development only)", null);
});

const getPaymentStatus = catchAsync(async (req: Request, res: Response) => {
  const payment = await paymentService.getPaymentStatus(req.params.id, req.user!);
  sendSuccess(res, 200, "Payment status retrieved", payment);
});

export const paymentController = { initiatePayment, webhook, mockConfirm, getPaymentStatus };
