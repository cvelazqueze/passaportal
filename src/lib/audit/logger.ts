import { AuditAction, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

interface AuditLogParams {
  userId?: string;
  organizationId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId,
        organizationId: params.organizationId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        metadata: params.metadata ?? {},
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

export async function getAuditLogs(filters: {
  userId?: string;
  organizationId?: string;
  resource?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  return db.auditLog.findMany({
    where: {
      userId: filters.userId,
      organizationId: filters.organizationId,
      resource: filters.resource,
      action: filters.action,
      createdAt: {
        gte: filters.startDate,
        lte: filters.endDate,
      },
    },
    orderBy: { createdAt: "desc" },
    take: filters.limit ?? 50,
    skip: filters.offset ?? 0,
    include: {
      user: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  });
}
