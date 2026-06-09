import { NotificationType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Prisma.InputJsonValue;
}

export async function createNotification(
  params: CreateNotificationParams
): Promise<void> {
  await db.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data ?? {},
    },
  });
}

export async function notifyInterviewScheduled(
  userId: string,
  jobTitle: string,
  scheduledAt: Date
): Promise<void> {
  await createNotification({
    userId,
    type: NotificationType.INTERVIEW_SCHEDULED,
    title: "Interview Scheduled",
    message: `Your interview for ${jobTitle} is scheduled for ${scheduledAt.toLocaleDateString()}`,
    data: { jobTitle, scheduledAt: scheduledAt.toISOString() },
  });
}

export async function notifyStageChanged(
  userId: string,
  jobTitle: string,
  newStage: string
): Promise<void> {
  await createNotification({
    userId,
    type: NotificationType.STAGE_CHANGED,
    title: "Application Update",
    message: `Your application for ${jobTitle} moved to ${newStage.replace(/_/g, " ")}`,
    data: { jobTitle, newStage },
  });
}

export async function notifyFeedbackAdded(
  userId: string,
  jobTitle: string
): Promise<void> {
  await createNotification({
    userId,
    type: NotificationType.FEEDBACK_ADDED,
    title: "New Feedback",
    message: `New feedback has been added for your ${jobTitle} application`,
    data: { jobTitle },
  });
}

export async function getUnreadNotifications(userId: string) {
  return db.notification.findMany({
    where: { userId, isRead: false },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await db.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });
}
