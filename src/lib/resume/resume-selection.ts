import { z } from "zod";

const contactFieldsSchema = z.object({
  title: z.boolean().optional(),
  email: z.boolean().optional(),
  phone: z.boolean().optional(),
  linkedIn: z.boolean().optional(),
  github: z.boolean().optional(),
  portfolio: z.boolean().optional(),
  location: z.boolean().optional(),
});

/** Per-version subset of the Talent Passport included in export/preview. */
export const resumeSelectionSchema = z.object({
  sections: z
    .object({
      summary: z.boolean().optional(),
      contact: z.boolean().optional(),
      experience: z.boolean().optional(),
      education: z.boolean().optional(),
      skills: z.boolean().optional(),
      certifications: z.boolean().optional(),
      projects: z.boolean().optional(),
      languages: z.boolean().optional(),
    })
    .optional(),
  contactFields: contactFieldsSchema.optional(),
  experienceIds: z.array(z.string()).optional(),
  educationIds: z.array(z.string()).optional(),
  skillIds: z.array(z.string()).optional(),
  certificationIds: z.array(z.string()).optional(),
  projectIds: z.array(z.string()).optional(),
  languageIds: z.array(z.string()).optional(),
});

export type ResumeSelection = z.infer<typeof resumeSelectionSchema>;
export type ContactFieldKey = keyof z.infer<typeof contactFieldsSchema>;

export const CONTACT_FIELD_KEYS: ContactFieldKey[] = [
  "title",
  "email",
  "phone",
  "linkedIn",
  "github",
  "portfolio",
  "location",
];

export const EMPTY_RESUME_SELECTION: ResumeSelection = {};

export function parseResumeSelection(value: unknown): ResumeSelection {
  const parsed = resumeSelectionSchema.safeParse(value);
  return parsed.success ? parsed.data : EMPTY_RESUME_SELECTION;
}

function sectionEnabled(
  selection: ResumeSelection,
  key: keyof NonNullable<ResumeSelection["sections"]>
): boolean {
  return selection.sections?.[key] !== false;
}

function contactFieldEnabled(
  selection: ResumeSelection,
  key: ContactFieldKey
): boolean {
  if (!sectionEnabled(selection, "contact")) return false;
  return selection.contactFields?.[key] !== false;
}

function filterByIds<T extends { id: string }>(
  items: T[],
  selectedIds: string[] | undefined
): T[] {
  if (selectedIds === undefined) return items;
  const idSet = new Set(selectedIds);
  return items.filter((item) => idSet.has(item.id));
}

export function applyResumeSelection<
  T extends {
    professionalSummary?: string | null;
    professionalTitle?: string | null;
    phone?: string | null;
    linkedIn?: string | null;
    portfolio?: string | null;
    github?: string | null;
    city?: string | null;
    country?: string | null;
    experiences: { id: string }[];
    education: { id: string }[];
    skills: { id: string }[];
    certifications: { id: string }[];
    projects: { id: string }[];
    languages: { id: string }[];
  },
>(passport: T, selection: ResumeSelection | null | undefined): T {
  const sel = selection ?? EMPTY_RESUME_SELECTION;

  return {
    ...passport,
    professionalSummary: sectionEnabled(sel, "summary")
      ? passport.professionalSummary
      : null,
    professionalTitle: contactFieldEnabled(sel, "title")
      ? passport.professionalTitle
      : null,
    phone: contactFieldEnabled(sel, "phone") ? passport.phone : null,
    linkedIn: contactFieldEnabled(sel, "linkedIn") ? passport.linkedIn : null,
    portfolio: contactFieldEnabled(sel, "portfolio") ? passport.portfolio : null,
    github: contactFieldEnabled(sel, "github") ? passport.github : null,
    city: contactFieldEnabled(sel, "location") ? passport.city : null,
    country: contactFieldEnabled(sel, "location") ? passport.country : null,
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
    languages: sectionEnabled(sel, "languages")
      ? filterByIds(passport.languages, sel.languageIds)
      : [],
  };
}

export function applyEmailVisibility(
  email: string,
  selection: ResumeSelection | null | undefined
): string {
  const sel = selection ?? EMPTY_RESUME_SELECTION;
  if (!sectionEnabled(sel, "contact")) return "";
  if (sel.contactFields?.email === false) return "";
  return email;
}

export function countSelectedItems(selection: ResumeSelection): number {
  return (
    (selection.experienceIds?.length ?? 0) +
    (selection.educationIds?.length ?? 0) +
    (selection.skillIds?.length ?? 0) +
    (selection.certificationIds?.length ?? 0) +
    (selection.projectIds?.length ?? 0) +
    (selection.languageIds?.length ?? 0)
  );
}

export function isTailoredSelection(selection: ResumeSelection): boolean {
  if (countSelectedItems(selection) > 0) return true;
  if (selection.contactFields && Object.values(selection.contactFields).some((v) => v === false)) {
    return true;
  }
  const sections = selection.sections;
  if (!sections) return false;
  return Object.values(sections).some((v) => v === false);
}

export function isContactFieldVisible(
  selection: ResumeSelection,
  key: ContactFieldKey
): boolean {
  return contactFieldEnabled(selection, key);
}

export function isSectionVisible(
  selection: ResumeSelection,
  key: keyof NonNullable<ResumeSelection["sections"]>
): boolean {
  return sectionEnabled(selection, key);
}
