import type { ResumeData } from "./types";
import { buildAdditionalInfo, formatAtsDate, formatContactLine } from "./ats-format";

/**
 * ATS-friendly template modeled after standard one-column resumes:
 * Name → Title → Contact → Experience → Education → Additional Info
 * No professional summary section.
 */
export function generateAtsResume(data: ResumeData): string {
  const lines: string[] = [];

  lines.push(`${data.firstName.toUpperCase()} ${data.lastName.toUpperCase()}`);
  if (data.professionalTitle) {
    lines.push(data.professionalTitle);
  }
  lines.push(formatContactLine(data));
  lines.push("");

  if (data.experiences.length > 0) {
    lines.push("PROFESSIONAL EXPERIENCE");
    for (const exp of data.experiences) {
      const end = exp.isCurrent
        ? "PRESENT"
        : exp.endDate
          ? formatAtsDate(exp.endDate)
          : "";
      const dateRange = `${formatAtsDate(exp.startDate)} - ${end}`.trim();
      const location = exp.location ? ` — ${exp.location}` : "";
      lines.push(`${exp.company.toUpperCase()}${location}\t${dateRange}`);
      lines.push(exp.position);
      const bullets = [...exp.achievements, ...exp.responsibilities];
      for (const bullet of bullets) {
        lines.push(`● ${bullet}`);
      }
      lines.push("");
    }
  }

  if (data.education.length > 0) {
    lines.push("EDUCATION");
    for (const edu of data.education) {
      const end = edu.endDate ? formatAtsDate(edu.endDate) : "";
      const start = formatAtsDate(edu.startDate);
      const dateRange = end ? `${start} - ${end}` : start;
      const location = edu.location ? `\t${edu.location}` : "";
      lines.push(`${edu.institution.toUpperCase()}${location}`);
      lines.push(`${edu.degree}\t${dateRange}`);
      lines.push("");
    }
  }

  const additional = buildAdditionalInfo(data);
  if (additional.length > 0) {
    lines.push("ADDITIONAL INFORMATION");
    for (const item of additional) {
      lines.push(`● ${item}`);
    }
  }

  return lines.join("\n").trim();
}
