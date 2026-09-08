import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendSuccess } from "../../utils/ApiResponse";
import { waitlistService } from "./waitlist.service";

const joinWaitlist = catchAsync(async (req: Request, res: Response) => {
  const result = await waitlistService.joinWaitlist(req.params.eventId, req.user!.id, req.body.ticketTierId, req.body.quantity);
  sendSuccess(res, 201, "Added to waitlist successfully", result);
});

const getEventWaitlist = catchAsync(async (req: Request, res: Response) => {
  const result = await waitlistService.getEventWaitlist(req.params.eventId);
  sendSuccess(res, 200, "Waitlist retrieved", result);
});

const leaveWaitlist = catchAsync(async (req: Request, res: Response) => {
  await waitlistService.leaveWaitlist(req.params.id, req.user!.id);
  sendSuccess(res, 200, "Removed from waitlist successfully", null);
});

export const waitlistController = { joinWaitlist, getEventWaitlist, leaveWaitlist };
