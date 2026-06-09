import { z } from "zod";
import { WorkArrangement } from "@prisma/client";

function parseList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const workArrangementSchema = z.nativeEnum(WorkArrangement).optional().nullable();

export const opportunityBodySchema = z.object({
  title: z.string().min(1, "Role title is required"),
  company: z.string().optional().nullable(),
  client: z.string().optional().nullable(),
  pipelineStageId: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  recruiterName: z.string().optional().nullable(),
  recruiterContact: z.string().optional().nullable(),
  salaryMin: z.number().int().nonnegative().optional().nullable(),
  salaryMax: z.number().int().nonnegative().optional().nullable(),
  salaryCurrency: z.string().optional().nullable(),
  contractType: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  workType: workArrangementSchema,
  benefits: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
  appliedAt: z.string().datetime().optional(),
});

export const opportunityPatchSchema = opportunityBodySchema
  .partial()
  .extend({
    title: z.string().min(1).optional(),
  });

export function normalizeOpportunityInput(
  data: z.infer<typeof opportunityBodySchema>
) {
  return {
    title: data.title.trim(),
    company: data.company?.trim() || null,
    client: data.client?.trim() || null,
    pipelineStageId: data.pipelineStageId || null,
    source: data.source?.trim() || null,
    notes: data.notes?.trim() || null,
    recruiterName: data.recruiterName?.trim() || null,
    recruiterContact: data.recruiterContact?.trim() || null,
    salaryMin: data.salaryMin ?? null,
    salaryMax: data.salaryMax ?? null,
    salaryCurrency: data.salaryCurrency?.trim() || "USD",
    contractType: data.contractType?.trim() || null,
    duration: data.duration?.trim() || null,
    workType: data.workType ?? null,
    benefits: data.benefits ?? [],
    technologies: data.technologies ?? [],
    appliedAt: data.appliedAt ? new Date(data.appliedAt) : undefined,
  };
}

export { parseList };
