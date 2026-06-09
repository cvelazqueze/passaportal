import { z } from "zod";

export const resumeCustomizationsSchema = z.object({
  displayName: z.string().max(120).nullable().optional(),
});

export type ResumeCustomizations = z.infer<typeof resumeCustomizationsSchema>;

export const EMPTY_RESUME_CUSTOMIZATIONS: ResumeCustomizations = {};

export function parseResumeCustomizations(value: unknown): ResumeCustomizations {
  const parsed = resumeCustomizationsSchema.safeParse(value);
  return parsed.success ? parsed.data : EMPTY_RESUME_CUSTOMIZATIONS;
}

export function normalizeDisplayName(
  value: string | null | undefined
): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function mergeResumeCustomizations(
  existing: unknown,
  patch: ResumeCustomizations
): ResumeCustomizations {
  const base = parseResumeCustomizations(existing);
  const next: ResumeCustomizations = { ...base, ...patch };

  if ("displayName" in patch) {
    next.displayName = normalizeDisplayName(patch.displayName);
    if (!next.displayName) delete next.displayName;
  }

  return Object.keys(next).length > 0 ? next : EMPTY_RESUME_CUSTOMIZATIONS;
}
