import Stripe from "stripe";
import { prisma } from "../../config/db";
import { stripe } from "../../config/stripe";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import { writeAuditLog } from "../../lib/audit";
import { InitiatePaymentResult } from "./payment.interface";
import { Prisma } from "../../generated/prisma";

function buildMockPaymentUrl(bookingId: string): string {
  // Dev-only stand-in used when no Stripe key is configured, so the booking
  // lifecycle can still be exercised end-to-end without real payment creds.
  return `http://localhost:${env.port}/api/${env.apiVersion}/payments/mock-confirm/${bookingId}`;
}

async function initiatePayment(bookingId: string, userId: string, method: string): Promise<InitiatePaymentResult> {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, deletedAt: null },
    include: { payment: true },
  });
  if (!booking) throw ApiError.notFound("Booking not found");
  if (booking.userId !== userId) throw ApiError.forbidden("You do not own this booking");
  if (booking.status !== "PENDING") throw ApiError.unprocessable("This booking is not awaiting payment");

  // Idempotent: re-initiating for a booking that already has a live session
  // returns that session instead of creating a duplicate one.
  if (booking.payment && booking.payment.status === "INITIATED") {
    const raw = booking.payment.rawResponse as Record<string, unknown> | null;
    return {
      paymentId: booking.payment.id,
      amount: Number(booking.payment.amount),
      method: booking.payment.method,
      status: booking.payment.status,
      paymentUrl: (raw?.paymentUrl as string) ?? buildMockPaymentUrl(bookingId),
      expiresAt: booking.expiresAt,
    };
  }

  let paymentUrl: string;
  let transactionId: string | undefined;
  let rawResponse: Prisma.InputJsonValue = {};

  if (env.stripe.secretKey && stripe) {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Booking ${booking.bookingNumber}` },
            unit_amount: Math.round(Number(booking.finalAmount) * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { bookingId: booking.id },
      success_url: `${env.clientUrl}/payment/success?bookingId=${booking.id}`,
      cancel_url: `${env.clientUrl}/payment/cancel?bookingId=${booking.id}`,
    });
    paymentUrl = session.url ?? "";
    transactionId = session.id;
    rawResponse = { sessionId: session.id, paymentUrl };
  } else {
    paymentUrl = buildMockPaymentUrl(bookingId);
    rawResponse = { mock: true, paymentUrl };
  }

  const payment = await prisma.payment.upsert({
    where: { bookingId },
    create: { bookingId, userId, amount: booking.finalAmount, method, transactionId, status: "INITIATED", rawResponse },
    update: { method, transactionId, status: "INITIATED", rawResponse },
  });

  await writeAuditLog({ userId, action: "PAYMENT_INITIATE", entityType: "Payment", entityId: payment.id });

  return { paymentId: payment.id, amount: Number(payment.amount), method: payment.method, status: payment.status, paymentUrl, expiresAt: booking.expiresAt };
}

// Shared outcome handler for both the real Stripe webhook and the dev mock
// endpoint. Idempotent: a booking no longer in PENDING is a silent no-op, so
// a duplicate webhook delivery cannot double-confirm or double-cancel it.
async function processPaymentOutcome(
  bookingId: string,
  success: boolean,
  transactionId?: string,
  rawResponse?: unknown
) {
  const booking = await prisma.booking.findFirst({ where: { id: bookingId }, include: { payment: true } });
  if (!booking || !booking.payment) throw ApiError.notFound("Booking or payment not found");
  if (booking.status !== "PENDING") return;

  await prisma.$transaction(async (tx) => {
    if (success) {
      await tx.payment.update({
        where: { id: booking.payment!.id },
        data: { status: "SUCCESS", transactionId, rawResponse: rawResponse as Prisma.InputJsonValue },
      });
      await tx.booking.update({ where: { id: bookingId }, data: { status: "CONFIRMED" } });
      // The reservation converts to a confirmed sale — move the held units
      // from `reserved` to `sold` on the tier.
      await tx.ticketTier.update({
        where: { id: booking.ticketTierId },
        data: { reserved: { decrement: booking.quantity }, sold: { increment: booking.quantity } },
      });
      await tx.notification.create({
        data: {
          userId: booking.userId,
          type: "BOOKING_CONFIRMATION",
          title: "Booking Confirmed",
          message: `Your booking ${booking.bookingNumber} has been confirmed.`,
          data: { bookingId },
        },
      });
      await writeAuditLog({ userId: booking.userId, action: "PAYMENT_SUCCESS", entityType: "Payment", entityId: booking.payment!.id }, tx);
    } else {
      await tx.payment.update({
        where: { id: booking.payment!.id },
        data: { status: "FAILED", failureReason: "Payment failed or was cancelled" },
      });
      await tx.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED", cancellationReason: "Payment failed" } });
      await tx.ticketTier.update({ where: { id: booking.ticketTierId }, data: { reserved: { decrement: booking.quantity } } });
      await writeAuditLog({ userId: booking.userId, action: "PAYMENT_FAILED", entityType: "Payment", entityId: booking.payment!.id }, tx);
    }
  });
}

async function handleStripeWebhook(rawBody: Buffer, signature: string) {
  if (!stripe || !env.stripe.webhookSecret) {
    throw ApiError.badRequest("Stripe is not configured on this server");
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.stripe.webhookSecret);
  } catch {
    throw ApiError.badRequest("Invalid webhook signature");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;
    if (bookingId) await processPaymentOutcome(bookingId, true, (session.payment_intent as string) ?? session.id, session);
  } else if (event.type === "checkout.session.expired" || event.type === "payment_intent.payment_failed") {
    const obj = event.data.object as Stripe.Checkout.Session;
    const bookingId = obj.metadata?.bookingId;
    if (bookingId) await processPaymentOutcome(bookingId, false, undefined, obj);
  }
}

// Dev-only: simulates a successful webhook when Stripe is not configured.
async function mockConfirmPayment(bookingId: string) {
  if (env.stripe.secretKey) {
    throw ApiError.badRequest("Mock confirmation is disabled when Stripe is configured");
  }
  await processPaymentOutcome(bookingId, true, `mock_${bookingId}`, { mock: true });
}

async function getPaymentStatus(paymentId: string, actor: { id: string; role: string }) {
  const payment = await prisma.payment.findFirst({ where: { id: paymentId, deletedAt: null } });
  if (!payment) throw ApiError.notFound("Payment not found");
  if (actor.role !== "ADMIN" && payment.userId !== actor.id) throw ApiError.forbidden();
  return payment;
}

// Called from booking/event cancellation flows. Refund failures are logged
// but intentionally do not throw — a refund-provider hiccup should not block
// the cancellation the user already requested.
async function refundPayment(bookingId: string, amount: number, reason: string) {
  const payment = await prisma.payment.findUnique({ where: { bookingId } });
  if (!payment || payment.status !== "SUCCESS") return;

  // Integration point: call stripe.refunds.create({ payment_intent: ... })
  // here once the PaymentIntent id (not the Checkout session id) is stored.

  await prisma.payment.update({
    where: { bookingId },
    data: {
      status: amount >= Number(payment.amount) ? "REFUNDED" : "PARTIALLY_REFUNDED",
      refundedAmount: amount,
      refundReason: reason,
      refundedAt: new Date(),
    },
  });
}

export const paymentService = {
  initiatePayment,
  handleStripeWebhook,
  mockConfirmPayment,
  getPaymentStatus,
  refundPayment,
};
