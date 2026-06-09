import type { Dictionary, Locale } from "@/lib/i18n";
import type { ResumeData } from "./types";

export function formatResumeDate(
  date: Date | string,
  locale: Locale,
  uppercase = false
): string {
  const tag = locale === "es" ? "es-ES" : "en-US";
  const formatted = new Intl.DateTimeFormat(tag, {
    month: "short",
    year: "numeric",
  }).format(new Date(date));
  return uppercase ? formatted.toUpperCase() : formatted;
}

export function formatContactLine(
  data: Pick<
    ResumeData,
    "email" | "phone" | "linkedIn" | "github" | "portfolio" | "city" | "country"
  >,
  separator = " • "
): string {
  const parts: string[] = [];
  if (data.email) parts.push(data.email);
  if (data.phone) parts.push(data.phone);
  if (data.linkedIn) {
    parts.push(data.linkedIn.replace(/^https?:\/\//, ""));
  }
  if (data.github) {
    parts.push(data.github.replace(/^https?:\/\//, ""));
  }
  if (data.portfolio) {
    parts.push(data.portfolio.replace(/^https?:\/\//, ""));
  }
  const location = [data.city, data.country].filter(Boolean).join(", ");
  if (location) parts.push(location);
  return parts.join(separator);
}

export function buildAdditionalInfo(
  data: ResumeData,
  labels: Dictionary["resume"]
): string[] {
  const additional: string[] = [];

  const techList = [
    ...(data.technologies ?? []),
    ...data.skills.map((s) => s.name),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  if (techList.length > 0 && data.experiences.length > 0) {
    additional.push(`${labels.skills}: ${techList.join(", ")}`);
  }

  if (data.languages.length > 0) {
    const langs = data.languages
      .map((l) => `${l.name} (${l.proficiency.toLowerCase()})`)
      .join(", ");
    additional.push(`${labels.languages}: ${langs}`);
  }

  if (data.certifications.length > 0) {
    const certs = data.certifications
      .map((c) => {
        const year = c.issueDate
          ? ` (${new Date(c.issueDate).getFullYear()})`
          : "";
        return `${c.name}${year}`;
      })
      .join(", ");
    additional.push(`${labels.certifications}: ${certs}`);
  }

  if (data.github) {
    additional.push(`${labels.githubPortfolio}: ${data.github}`);
  }

  if (data.portfolio) {
    additional.push(`${labels.portfolio}: ${data.portfolio}`);
  }

  return additional;
}

export function getSkillList(data: ResumeData): string[] {
  return [
    ...(data.technologies ?? []),
    ...data.skills.map((s) => s.name),
  ].filter((v, i, arr) => arr.indexOf(v) === i);
}

export function presentLabel(locale: Locale, uppercase = false): string {
  const label = locale === "es" ? "Presente" : "Present";
  return uppercase ? label.toUpperCase() : label;
}
