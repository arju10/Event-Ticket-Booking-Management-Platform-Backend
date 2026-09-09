import { prisma } from "../config/db";
import { AuditAction, Prisma } from "../generated/prisma/client";

interface WriteAuditLogInput {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function writeAuditLog(
  input: WriteAuditLogInput,
  client: Prisma.TransactionClient | typeof prisma = prisma,
) {
  await client.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      oldValues: input.oldValues as Prisma.InputJsonValue,
      newValues: input.newValues as Prisma.InputJsonValue,
      description: input.description,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });
}
