import type { ResumeData } from "./types";

export function formatAtsDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  })
    .format(new Date(date))
    .toUpperCase();
}

export function formatContactLine(data: Pick<ResumeData, "email" | "phone" | "linkedIn">): string {
  const parts: string[] = [`• ${data.email}`];
  if (data.phone) parts.push(`• ${data.phone}`);
  if (data.linkedIn) {
    const display = data.linkedIn.replace(/^https?:\/\//, "");
    parts.push(`• ${display}`);
  }
  return parts.join(" ");
}

export function buildAdditionalInfo(data: ResumeData): string[] {
  const additional: string[] = [];

  const techList = [
    ...(data.technologies ?? []),
    ...data.skills.map((s) => s.name),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  if (techList.length > 0) {
    additional.push(`Technical Skills: ${techList.join(", ")}`);
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
    additional.push(`Certifications: ${certs}`);
  }

  if (data.github) {
    additional.push(`Github Portfolio: ${data.github}`);
  }

  if (data.portfolio) {
    additional.push(`Portfolio: ${data.portfolio}`);
  }

  return additional;
}
