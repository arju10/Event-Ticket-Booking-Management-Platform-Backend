import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendSuccess } from "../../utils/ApiResponse";
import { ticketTierService } from "./ticketTier.service";

const createTicketTier = catchAsync(async (req: Request, res: Response) => {
  const tier = await ticketTierService.createTicketTier(
    req.params.eventId,
    req.user!.id,
    req.body,
  );
  sendSuccess(res, 201, "Ticket tier added successfully", tier);
});

const listTicketTiers = catchAsync(async (req: Request, res: Response) => {
  const tiers = await ticketTierService.listTicketTiers(req.params.eventId);
  sendSuccess(res, 200, "Ticket tiers retrieved", { items: tiers });
});

const updateTicketTier = catchAsync(async (req: Request, res: Response) => {
  const tier = await ticketTierService.updateTicketTier(
    req.params.id,
    req.user!.id,
    req.body,
  );
  sendSuccess(res, 200, "Ticket tier updated successfully", tier);
});

export const ticketTierController = {
  createTicketTier,
  listTicketTiers,
  updateTicketTier,
};
