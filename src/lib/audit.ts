import { prisma } from "../config/db";
import { AuditAction, Prisma } from "../generated/prisma";

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

// Fire-and-forget audit trail writer. Accepts an optional Prisma transaction
// client (`tx`) so a log entry can be written atomically alongside the state
// change it describes, or `prisma` directly for a standalone write.
export async function writeAuditLog(
  input: WriteAuditLogInput,
  client: Prisma.TransactionClient | typeof prisma = prisma
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
