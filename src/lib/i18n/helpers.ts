import type { Dictionary, Locale } from "./index";
import { interpolate } from "./index";

const BREADCRUMB_KEYS: Record<string, keyof Dictionary["nav"]> = {
  dashboard: "dashboard",
  profile: "profileHub",
  resumes: "resumeHub",
  jobs: "jobWorkspace",
  opportunities: "opportunities",
  interviews: "interviewHub",
  rejections: "rejections",
  offers: "offers",
  outreach: "outreach",
  analytics: "analytics",
  insights: "insights",
};

const RECRUITER_BREADCRUMB_KEYS: Record<string, keyof Dictionary["nav"]> = {
  jobs: "recruiterJobs",
  candidates: "recruiterCandidates",
  pools: "recruiterPools",
  interviews: "recruiterInterviews",
  search: "recruiterSearch",
};

export function getBreadcrumbLabel(
  segment: string,
  t: Dictionary,
  pathname?: string
): string {
  if (pathname?.startsWith("/recruiter")) {
    const recruiterKey = RECRUITER_BREADCRUMB_KEYS[segment];
    if (recruiterKey) return t.nav[recruiterKey];
  }
  const key = BREADCRUMB_KEYS[segment];
  return key ? t.nav[key] : segment;
}

export function translatePipelineStage(
  name: string,
  t: Dictionary
): string {
  return t.pipeline[name as keyof Dictionary["pipeline"]] ?? name;
}

export function translateInterviewType(
  type: string,
  t: Dictionary
): string {
  return (
    t.interviews.interviewTypes[
      type as keyof Dictionary["interviews"]["interviewTypes"]
    ] ?? type
  );
}

export function formatRelativeTimeLocalized(
  date: Date | string,
  locale: Locale,
  t: Dictionary
): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const tag = locale === "es" ? "es-ES" : "en-US";

  if (diffMins < 1) return t.time.justNow;
  if (diffMins < 60) return interpolate(t.time.minutesAgo, { n: diffMins });
  if (diffHours < 24) return interpolate(t.time.hoursAgo, { n: diffHours });
  if (diffDays < 7) return interpolate(t.time.daysAgo, { n: diffDays });

  return new Intl.DateTimeFormat(tag, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(target);
}

export function getCompletenessSections(
  passport: {
    professionalTitle: string | null;
    professionalSummary: string | null;
    phone: string | null;
    linkedIn: string | null;
    github: string | null;
    portfolio: string | null;
    experiences: unknown[];
    skills: unknown[];
    languages: unknown[];
    education: unknown[];
    certifications: unknown[];
    projects: unknown[];
  },
  t: Dictionary
) {
  const s = t.profile.sections;
  return [
    { key: "professionalTitle", label: s.professionalTitle, done: !!passport.professionalTitle },
    { key: "summary", label: s.summary, done: !!passport.professionalSummary },
    {
      key: "contact",
      label: s.contactLinks,
      done: !!(passport.phone || passport.linkedIn || passport.github || passport.portfolio),
    },
    { key: "experience", label: s.experience, done: passport.experiences.length > 0 },
    { key: "skills", label: s.skills, done: passport.skills.length > 0 },
    { key: "education", label: s.education, done: passport.education.length > 0 },
    { key: "projects", label: s.projects, done: passport.projects.length > 0 },
    { key: "certifications", label: s.certifications, done: passport.certifications.length > 0 },
    { key: "languages", label: s.languages, done: passport.languages.length > 0 },
  ];
}
