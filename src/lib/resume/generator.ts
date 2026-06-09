import { ResumeTemplate } from "@prisma/client";
import type { ResumeData } from "./types";
import { generateAtsResume } from "./ats-template";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function generateTechnicalTemplate(data: ResumeData): string {
  const sections: string[] = [];

  sections.push(`# ${data.firstName} ${data.lastName}`);
  if (data.professionalTitle) sections.push(data.professionalTitle);
  sections.push(`${data.email}${data.phone ? ` | ${data.phone}` : ""}`);
  if (data.github) sections.push(`GitHub: ${data.github}`);
  if (data.linkedIn) sections.push(`LinkedIn: ${data.linkedIn}`);
  sections.push("");

  if (data.skills.length > 0) {
    sections.push("## Technical Skills");
    sections.push(data.skills.map((s) => s.name).join(" • "));
    sections.push("");
  }

  if (data.experiences.length > 0) {
    sections.push("## Experience");
    for (const exp of data.experiences) {
      const endDate = exp.isCurrent ? "Present" : exp.endDate ? formatDate(exp.endDate) : "";
      sections.push(`### ${exp.position} — ${exp.company}`);
      sections.push(`${formatDate(exp.startDate)} – ${endDate}`);
      if (exp.technologies.length > 0) {
        sections.push(`*Technologies: ${exp.technologies.join(", ")}*`);
      }
      for (const resp of exp.responsibilities) {
        sections.push(`- ${resp}`);
      }
      for (const ach of exp.achievements) {
        sections.push(`- ${ach}`);
      }
      sections.push("");
    }
  }

  if (data.education.length > 0) {
    sections.push("## Education");
    for (const edu of data.education) {
      sections.push(`**${edu.degree}** — ${edu.institution}`);
      sections.push(`${formatDate(edu.startDate)} – ${edu.endDate ? formatDate(edu.endDate) : "Present"}`);
    }
    sections.push("");
  }

  if (data.certifications.length > 0) {
    sections.push("## Certifications");
    for (const cert of data.certifications) {
      sections.push(`- ${cert.name} (${cert.issuer})`);
    }
  }

  return sections.join("\n");
}

function generateExecutiveTemplate(data: ResumeData): string {
  const sections: string[] = [];

  sections.push(`${data.firstName.toUpperCase()} ${data.lastName.toUpperCase()}`);
  if (data.professionalTitle) sections.push(data.professionalTitle);
  sections.push(`${data.email}${data.phone ? ` | ${data.phone}` : ""}${data.city ? ` | ${data.city}` : ""}`);
  sections.push("");

  if (data.experiences.length > 0) {
    sections.push("PROFESSIONAL EXPERIENCE");
    sections.push("─".repeat(40));
    for (const exp of data.experiences) {
      const endDate = exp.isCurrent ? "Present" : exp.endDate ? formatDate(exp.endDate) : "";
      sections.push(`${exp.position}`);
      sections.push(`${exp.company} | ${formatDate(exp.startDate)} – ${endDate}`);
      for (const ach of exp.achievements) {
        sections.push(`  • ${ach}`);
      }
      sections.push("");
    }
  }

  if (data.education.length > 0) {
    sections.push("EDUCATION");
    for (const edu of data.education) {
      sections.push(`${edu.degree}, ${edu.institution}`);
    }
  }

  return sections.join("\n");
}

export function generateResumeContent(
  data: ResumeData,
  template: ResumeTemplate
): string {
  switch (template) {
    case "ATS":
      return generateAtsResume(data);
    case "TECHNICAL":
      return generateTechnicalTemplate(data);
    case "EXECUTIVE":
      return generateExecutiveTemplate(data);
    case "CORPORATE":
      return generateExecutiveTemplate(data);
    case "MODERN":
    default:
      return generateTechnicalTemplate(data);
  }
}

import { generateAtsDocx } from "./ats-docx";
import { generateExecutiveDocx } from "./executive-docx";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";

export async function generateDocx(
  data: ResumeData,
  template: ResumeTemplate,
  locale: Locale = "en"
) {
  const labels = getDictionary(locale).resume;

  if (template === "ATS") {
    return generateAtsDocx(data);
  }

  if (template === "EXECUTIVE" || template === "CORPORATE") {
    return generateExecutiveDocx(data, labels, locale);
  }

  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");

  const content = generateResumeContent(data, template);
  const lines = content.split("\n");

  const children = lines.map((line) => {
    if (line.startsWith("# ")) {
      return new Paragraph({
        text: line.replace("# ", ""),
        heading: HeadingLevel.HEADING_1,
      });
    }
    if (line.startsWith("## ")) {
      return new Paragraph({
        text: line.replace("## ", ""),
        heading: HeadingLevel.HEADING_2,
      });
    }
    return new Paragraph({
      children: [new TextRun(line)],
    });
  });

  const doc = new Document({
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}

export type { ResumeData };
