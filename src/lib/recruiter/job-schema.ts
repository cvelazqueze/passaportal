import { z } from "zod";
import { JobStatus } from "@prisma/client";
import { parseList } from "@/lib/candidate/opportunity-schema";

export const JOB_STATUSES = [
  "DRAFT",
  "OPEN",
  "ON_HOLD",
  "CLOSED",
  "FILLED",
] as const satisfies readonly JobStatus[];

export const jobBodySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  requirements: z.array(z.string()).default([]),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  location: z.string().optional().nullable(),
  remote: z.boolean().default(false),
  salaryMin: z.number().int().nonnegative().optional().nullable(),
  salaryMax: z.number().int().nonnegative().optional().nullable(),
  salaryCurrency: z.string().default("USD"),
  status: z.nativeEnum(JobStatus).default("DRAFT"),
  clientId: z.string().optional().nullable(),
});

export function parseSkills(text: string): string[] {
  return parseList(text);
}
