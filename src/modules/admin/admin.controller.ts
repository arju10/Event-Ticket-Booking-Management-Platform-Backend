import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendSuccess, sendPaginated } from "../../utils/ApiResponse";
import { adminService } from "./admin.service";

const listUsers = catchAsync(async (req: Request, res: Response) => {
  const q = req.query as Record<string, string>;
  const { items, pagination } = await adminService.listUsers({
    role: q.role,
    isActive: q.isActive !== undefined ? q.isActive === "true" : undefined,
    page: Number(q.page) || 1,
    limit: Number(q.limit) || 20,
    search: q.search,
  });
  sendPaginated(res, "Users retrieved", items, pagination);
});

const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.updateUserRole(
    req.params.id,
    req.body.role,
    req.user!.id,
  );
  sendSuccess(res, 200, "User role updated successfully", result);
});

const suspendUser = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.suspendUser(
    req.params.id,
    req.body.suspend,
    req.body.reason,
    req.user!.id,
  );
  sendSuccess(
    res,
    200,
    `User ${req.body.suspend ? "suspended" : "reinstated"} successfully`,
    result,
  );
});

const getDashboardStats = catchAsync(async (_req: Request, res: Response) => {
  const stats = await adminService.getDashboardStats();
  sendSuccess(res, 200, "Dashboard statistics", stats);
});

const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const q = req.query as Record<string, string>;
  const { items, pagination } = await adminService.getAuditLogs({
    entityType: q.entityType,
    action: q.action,
    userId: q.userId,
    from: q.from,
    to: q.to,
    page: Number(q.page) || 1,
    limit: Number(q.limit) || 50,
  });
  sendPaginated(res, "Audit logs retrieved", items, pagination);
});

export const adminController = {
  listUsers,
  updateUserRole,
  suspendUser,
  getDashboardStats,
  getAuditLogs,
};
