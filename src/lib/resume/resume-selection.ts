import { z } from "zod";

/** Per-version subset of the Talent Passport included in export/preview. */
export const resumeSelectionSchema = z.object({
  sections: z
    .object({
      experience: z.boolean().optional(),
      education: z.boolean().optional(),
      skills: z.boolean().optional(),
      certifications: z.boolean().optional(),
      projects: z.boolean().optional(),
    })
    .optional(),
  experienceIds: z.array(z.string()).optional(),
  educationIds: z.array(z.string()).optional(),
  skillIds: z.array(z.string()).optional(),
  certificationIds: z.array(z.string()).optional(),
  projectIds: z.array(z.string()).optional(),
});

export type ResumeSelection = z.infer<typeof resumeSelectionSchema>;

export const EMPTY_RESUME_SELECTION: ResumeSelection = {};

export function parseResumeSelection(value: unknown): ResumeSelection {
  const parsed = resumeSelectionSchema.safeParse(value);
  return parsed.success ? parsed.data : EMPTY_RESUME_SELECTION;
}

function sectionEnabled(
  selection: ResumeSelection,
  key: keyof NonNullable<ResumeSelection["sections"]>,
  defaultValue = true
): boolean {
  return selection.sections?.[key] ?? defaultValue;
}

function filterByIds<T extends { id: string }>(
  items: T[],
  selectedIds: string[] | undefined
): T[] {
  if (!selectedIds || selectedIds.length === 0) return items;
  const idSet = new Set(selectedIds);
  return items.filter((item) => idSet.has(item.id));
}

export function applyResumeSelection<
  T extends {
    experiences: { id: string }[];
    education: { id: string }[];
    skills: { id: string }[];
    certifications: { id: string }[];
    projects: { id: string }[];
  },
>(passport: T, selection: ResumeSelection | null | undefined): T {
  const sel = selection ?? EMPTY_RESUME_SELECTION;

  return {
    ...passport,
    experiences: sectionEnabled(sel, "experience")
      ? filterByIds(passport.experiences, sel.experienceIds)
      : [],
    education: sectionEnabled(sel, "education")
      ? filterByIds(passport.education, sel.educationIds)
      : [],
    skills: sectionEnabled(sel, "skills")
      ? filterByIds(passport.skills, sel.skillIds)
      : [],
    certifications: sectionEnabled(sel, "certifications")
      ? filterByIds(passport.certifications, sel.certificationIds)
      : [],
    projects: sectionEnabled(sel, "projects")
      ? filterByIds(passport.projects, sel.projectIds)
      : [],
  };
}

export function countSelectedItems(selection: ResumeSelection): number {
  return (
    (selection.experienceIds?.length ?? 0) +
    (selection.educationIds?.length ?? 0) +
    (selection.skillIds?.length ?? 0) +
    (selection.certificationIds?.length ?? 0) +
    (selection.projectIds?.length ?? 0)
  );
}

export function isTailoredSelection(selection: ResumeSelection): boolean {
  if (countSelectedItems(selection) > 0) return true;
  const sections = selection.sections;
  if (!sections) return false;
  return Object.values(sections).some((v) => v === false);
}
