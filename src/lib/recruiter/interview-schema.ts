import { z } from "zod";
import { InterviewStatus, InterviewType } from "@prisma/client";

export function toScheduledAt(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T10:00:00`);
  }
  return new Date(value);
}

export const interviewBodySchema = z.object({
  applicationId: z.string().min(1, "Application is required"),
  type: z.nativeEnum(InterviewType),
  scheduledAt: z.string().min(1, "Date is required"),
  duration: z.number().int().positive().default(60),
  location: z.string().optional().nullable(),
  meetingUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.nativeEnum(InterviewStatus).default("SCHEDULED"),
});

export const INTERVIEW_TYPES = [
  "PHONE",
  "VIDEO",
  "ONSITE",
  "TECHNICAL",
  "BEHAVIORAL",
  "PANEL",
] as const satisfies readonly InterviewType[];
