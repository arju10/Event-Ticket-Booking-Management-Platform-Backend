import { prisma } from "@/config/db";
import { buildPaginationMeta, parsePagination } from "@/types/common.types";
import { Prisma } from "@/generated/prisma";

async function listNotifications(userId: string, filters: { page: number; limit: number; isRead?: boolean }) {
  const { page, limit, skip } = parsePagination(filters as unknown as Record<string, unknown>);
  const where: Prisma.NotificationWhereInput = { userId, deletedAt: null };
  if (filters.isRead !== undefined) where.isRead = filters.isRead;

  const [total, items, unreadCount] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.notification.count({ where: { userId, deletedAt: null, isRead: false } }),
  ]);

  return { items, unreadCount, pagination: buildPaginationMeta(total, page, limit) };
}

async function markAsRead(notificationId: string, userId: string) {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true, readAt: new Date() },
  });
}

async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

export const notificationService = { listNotifications, markAsRead, markAllAsRead };
