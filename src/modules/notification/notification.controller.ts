import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendSuccess, sendPaginated } from "../../utils/ApiResponse";
import { notificationService } from "./notification.service";

const listNotifications = catchAsync(async (req: Request, res: Response) => {
  const q = req.query as Record<string, string>;
  const { items, unreadCount, pagination } = await notificationService.listNotifications(req.user!.id, {
    page: Number(q.page) || 1,
    limit: Number(q.limit) || 20,
    isRead: q.isRead !== undefined ? q.isRead === "true" : undefined,
  });
  sendPaginated(res, "Notifications retrieved", items, pagination, { unreadCount });
});

const markAsRead = catchAsync(async (req: Request, res: Response) => {
  await notificationService.markAsRead(req.params.id, req.user!.id);
  sendSuccess(res, 200, "Notification marked as read", null);
});

const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
  await notificationService.markAllAsRead(req.user!.id);
  sendSuccess(res, 200, "All notifications marked as read", null);
});

export const notificationController = { listNotifications, markAsRead, markAllAsRead };
