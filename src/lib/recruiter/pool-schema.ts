import { z } from "zod";

export const poolBodySchema = z.object({
  name: z.string().min(1, "Pool name is required"),
  description: z.string().optional().nullable(),
});

export const poolMemberSchema = z.object({
  candidateProfileId: z.string().min(1, "Candidate is required"),
  notes: z.string().optional().nullable(),
});
