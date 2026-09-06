import { prisma } from "@/config/db";
import { ApiError } from "@/utils/ApiError";
import { buildPaginationMeta, parsePagination } from "@/types/common.types";
import { writeAuditLog } from "@/lib/audit";
import { Prisma } from "@/generated/prisma";

async function listUsers(filters: { role?: string; isActive?: boolean; page: number; limit: number; search?: string }) {
  const { page, limit, skip } = parsePagination(filters as unknown as Record<string, unknown>);
  const where: Prisma.UserWhereInput = { deletedAt: null };
  if (filters.role) where.role = filters.role as Prisma.UserWhereInput["role"];
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, _count: { select: { bookings: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  const items = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt,
    totalBookings: u._count.bookings,
  }));

  return { items, pagination: buildPaginationMeta(total, page, limit) };
}

async function updateUserRole(userId: string, role: string, actorId: string) {
  const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
  if (!user) throw ApiError.notFound("User not found");

  const updated = await prisma.user.update({ where: { id: userId }, data: { role: role as Prisma.UserUpdateInput["role"] } });
  await writeAuditLog({
    userId: actorId,
    action: "ROLE_CHANGE",
    entityType: "User",
    entityId: userId,
    oldValues: { role: user.role },
    newValues: { role },
  });

  return { id: updated.id, role: updated.role, updatedAt: updated.updatedAt };
}

async function suspendUser(userId: string, suspend: boolean, reason: string, actorId: string) {
  const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
  if (!user) throw ApiError.notFound("User not found");

  const updated = await prisma.user.update({ where: { id: userId }, data: { isActive: !suspend } });
  await writeAuditLog({
    userId: actorId,
    action: "SUSPEND",
    entityType: "User",
    entityId: userId,
    newValues: { isActive: !suspend, reason },
  });

  return { id: updated.id, isActive: updated.isActive, suspensionReason: suspend ? reason : null };
}

async function getDashboardStats() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalOrganizers,
    totalEvents,
    totalBookings,
    revenueAgg,
    refundAgg,
    newUsersToday,
    newEventsToday,
    newBookingsToday,
    categoryGroups,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { role: "ORGANIZER", deletedAt: null } }),
    prisma.event.count({ where: { deletedAt: null } }),
    prisma.booking.count({ where: { deletedAt: null } }),
    prisma.booking.aggregate({ where: { status: { in: ["CONFIRMED", "CHECKED_IN"] } }, _sum: { finalAmount: true } }),
    prisma.booking.aggregate({ where: { status: { in: ["REFUNDED", "PARTIALLY_REFUNDED"] } }, _sum: { refundAmount: true } }),
    prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.event.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.booking.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.event.groupBy({ by: ["category"], where: { deletedAt: null }, _count: true }),
  ]);

  const totalRevenue = Number(revenueAgg._sum.finalAmount ?? 0);
  const totalRefunds = Number(refundAgg._sum.refundAmount ?? 0);

  const recentBookings = await prisma.booking.count({ where: { createdAt: { gte: thirtyDaysAgo } } });

  return {
    overview: { totalUsers, totalOrganizers, totalEvents, totalBookings, totalRevenue, totalRefunds },
    recentActivity: { newUsersToday, newEventsToday, newBookingsToday },
    popularCategories: categoryGroups.map((c) => ({ category: c.category, count: c._count })),
    platformHealth: {
      activeUsers: totalUsers,
      conversionRate: totalBookings > 0 ? Number(((recentBookings / totalBookings) * 100).toFixed(1)) : 0,
      refundRate: totalRevenue > 0 ? Number(((totalRefunds / (totalRevenue + totalRefunds)) * 100).toFixed(1)) : 0,
    },
  };
}

async function getAuditLogs(filters: {
  entityType?: string;
  action?: string;
  userId?: string;
  from?: string;
  to?: string;
  page: number;
  limit: number;
}) {
  const { page, limit, skip } = parsePagination(filters as unknown as Record<string, unknown>);
  const where: Prisma.AuditLogWhereInput = {};
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.action) where.action = filters.action as Prisma.AuditLogWhereInput["action"];
  if (filters.userId) where.userId = filters.userId;
  if (filters.from || filters.to) {
    where.createdAt = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(filters.to) } : {}),
    };
  }

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return { items: logs, pagination: buildPaginationMeta(total, page, limit) };
}

export const adminService = { listUsers, updateUserRole, suspendUser, getDashboardStats, getAuditLogs };
