import { z } from "zod";
import { InterviewType } from "@prisma/client";

export function parseQuestions(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function toInterviewDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00`);
  }
  return new Date(value);
}

export const interviewBodySchema = z.object({
  applicationId: z.string().min(1, "Opportunity is required"),
  interviewDate: z.string().min(1, "Interview date is required"),
  interviewType: z.nativeEnum(InterviewType),
  interviewer: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  outcome: z.string().optional().nullable(),
  lessonsLearned: z.string().optional().nullable(),
  technicalQuestions: z.array(z.string()).default([]),
  behavioralQuestions: z.array(z.string()).default([]),
});

export const INTERVIEW_TYPES = [
  "PHONE",
  "VIDEO",
  "ONSITE",
  "TECHNICAL",
  "BEHAVIORAL",
  "PANEL",
] as const satisfies readonly InterviewType[];
