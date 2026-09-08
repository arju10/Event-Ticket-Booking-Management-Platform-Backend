import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendSuccess } from "../../utils/ApiResponse";
import { couponService } from "./coupon.service";

const validateCoupon = catchAsync(async (req: Request, res: Response) => {
  const result = await couponService.previewCoupon(
    req.body.code,
    req.user!.id,
    req.body.eventId,
    req.body.ticketTierId,
    req.body.quantity
  );
  sendSuccess(res, 200, "Coupon is valid", result);
});

const createCoupon = catchAsync(async (req: Request, res: Response) => {
  const coupon = await couponService.createCoupon(req.user!.id, req.body);
  sendSuccess(res, 201, "Coupon created successfully", coupon);
});

export const couponController = { validateCoupon, createCoupon };
