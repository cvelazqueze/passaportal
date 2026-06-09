import { SecurityEventType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

interface SecurityEventParams {
  userId?: string;
  organizationId?: string;
  type: SecurityEventType;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Prisma.InputJsonValue;
}

export async function logSecurityEvent(
  params: SecurityEventParams
): Promise<void> {
  try {
    await db.securityEvent.create({
      data: {
        userId: params.userId,
        organizationId: params.organizationId,
        type: params.type,
        description: params.description,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        metadata: params.metadata ?? {},
      },
    });
  } catch (error) {
    console.error("Failed to log security event:", error);
  }
}

export async function recordLoginAttempt(
  userId: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await db.loginHistory.create({
    data: { userId, success, ipAddress, userAgent },
  });

  await logSecurityEvent({
    userId,
    type: success
      ? SecurityEventType.LOGIN_SUCCESS
      : SecurityEventType.LOGIN_FAILURE,
    description: success ? "Successful login" : "Failed login attempt",
    ipAddress,
    userAgent,
  });

  if (success) {
    await db.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }
}

export async function getSecurityEvents(filters: {
  userId?: string;
  organizationId?: string;
  type?: SecurityEventType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  return db.securityEvent.findMany({
    where: {
      userId: filters.userId,
      organizationId: filters.organizationId,
      type: filters.type,
      createdAt: {
        gte: filters.startDate,
        lte: filters.endDate,
      },
    },
    orderBy: { createdAt: "desc" },
    take: filters.limit ?? 50,
  });
}
