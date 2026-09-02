import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendSuccess, sendPaginated } from "@/utils/ApiResponse";
import { eventService } from "./event.service";

const createEvent = catchAsync(async (req: Request, res: Response) => {
  const event = await eventService.createEvent(req.user!.id, req.body);
  sendSuccess(res, 201, "Event created successfully", event);
});

const listEvents = catchAsync(async (req: Request, res: Response) => {
  const q = req.query as Record<string, string>;
  const { items, pagination } = await eventService.listEvents({
    page: Number(q.page) || 1,
    limit: Number(q.limit) || 20,
    category: q.category,
    subCategory: q.subCategory,
    city: q.city,
    status: q.status,
    sortBy: q.sortBy,
    sortOrder: q.sortOrder as "asc" | "desc" | undefined,
    dateFrom: q.dateFrom,
    dateTo: q.dateTo,
    priceMin: q.priceMin ? Number(q.priceMin) : undefined,
    priceMax: q.priceMax ? Number(q.priceMax) : undefined,
    search: q.search,
  });
  sendPaginated(res, "Events retrieved successfully", items, pagination);
});

const getEvent = catchAsync(async (req: Request, res: Response) => {
  const event = await eventService.getEventById(req.params.id);
  sendSuccess(res, 200, "Event details retrieved", event);
});

const updateEvent = catchAsync(async (req: Request, res: Response) => {
  const event = await eventService.updateEvent(req.params.id, req.body);
  sendSuccess(res, 200, "Event updated successfully", event);
});

const updateEventStatus = catchAsync(async (req: Request, res: Response) => {
  const event = await eventService.updateEventStatus(req.params.id, req.body.status, req.user!.id);
  sendSuccess(res, 200, "Event status updated successfully", event);
});

const deleteEvent = catchAsync(async (req: Request, res: Response) => {
  await eventService.deleteEvent(req.params.id, req.user!.id);
  res.status(204).send();
});

export const eventController = { createEvent, listEvents, getEvent, updateEvent, updateEventStatus, deleteEvent };
