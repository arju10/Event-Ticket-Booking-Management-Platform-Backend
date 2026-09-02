import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendSuccess, sendPaginated } from "@/utils/ApiResponse";
import { reviewService } from "./review.service";

const createReview = catchAsync(async (req: Request, res: Response) => {
  const review = await reviewService.createReview(req.params.eventId, req.user!.id, req.body.bookingId, req.body.rating, req.body.comment);
  sendSuccess(res, 201, "Review submitted successfully", review);
});

const getEventReviews = catchAsync(async (req: Request, res: Response) => {
  const q = req.query as Record<string, string>;
  const { items, statistics, pagination } = await reviewService.getEventReviews(req.params.eventId, {
    page: Number(q.page) || 1,
    limit: Number(q.limit) || 10,
    rating: q.rating ? Number(q.rating) : undefined,
  });
  sendPaginated(res, "Reviews retrieved", items, pagination, { statistics });
});

const respondToReview = catchAsync(async (req: Request, res: Response) => {
  const result = await reviewService.respondToReview(req.params.id, req.body.response);
  sendSuccess(res, 200, "Response added successfully", result);
});

export const reviewController = { createReview, getEventReviews, respondToReview };
