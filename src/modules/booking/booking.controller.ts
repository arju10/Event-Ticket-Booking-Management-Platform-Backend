import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendSuccess, sendPaginated } from "../../utils/ApiResponse";
import { bookingService } from "./booking.service";
import { paymentService } from "../payment/payment.service";

const createBooking = catchAsync(async (req: Request, res: Response) => {
  const booking = await bookingService.createBooking(req.params.eventId, req.user!.id, req.body);
  // Immediately open a payment session so the client gets one round trip
  // from "book" to "pay" (mirrors POST /payments/initiate under the hood).
  const payment = await paymentService.initiatePayment(booking.id, req.user!.id, "STRIPE");

  sendSuccess(res, 201, "Booking created successfully", {
    booking: {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      eventId: booking.eventId,
      quantity: booking.quantity,
      unitPrice: booking.unitPrice,
      totalPrice: booking.totalPrice,
      discountAmount: booking.discountAmount,
      finalAmount: booking.finalAmount,
      status: booking.status,
      expiresAt: booking.expiresAt,
      createdAt: booking.createdAt,
    },
    payment: { paymentUrl: payment.paymentUrl },
  });
});

const listMyBookings = catchAsync(async (req: Request, res: Response) => {
  const q = req.query as Record<string, string>;
  const { items, pagination } = await bookingService.listMyBookings(req.user!.id, {
    status: q.status,
    page: Number(q.page) || 1,
    limit: Number(q.limit) || 20,
    eventId: q.eventId,
  });
  sendPaginated(res, "Bookings retrieved", items, pagination);
});

const getBooking = catchAsync(async (req: Request, res: Response) => {
  const booking = await bookingService.getBookingById(req.params.id, req.user!);
  sendSuccess(res, 200, "Booking details retrieved", booking);
});

const cancelBooking = catchAsync(async (req: Request, res: Response) => {
  const result = await bookingService.cancelBooking(req.params.id, req.user!, req.body.cancellationReason);
  sendSuccess(res, 200, "Booking cancelled successfully", result);
});

const checkIn = catchAsync(async (req: Request, res: Response) => {
  const result = await bookingService.checkIn(req.params.id, req.user!.id, req.body.qrCode);
  sendSuccess(res, 200, "Check-in successful", result);
});

export const bookingController = { createBooking, listMyBookings, getBooking, cancelBooking, checkIn };
