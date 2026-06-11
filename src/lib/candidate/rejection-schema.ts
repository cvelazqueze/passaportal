import { z } from "zod";

export function toRejectionDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00`);
  }
  return new Date(value);
}

export const rejectionBodySchema = z.object({
  applicationId: z.string().min(1, "Opportunity is required"),
  reasonId: z.string().optional().nullable(),
  stageName: z.string().optional().nullable(),
  candidateNotes: z.string().optional().nullable(),
  rejectedAt: z.string().optional().nullable(),
});
