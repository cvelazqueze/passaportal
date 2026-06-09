import type { ResumeTemplate } from "@prisma/client";
import type { ResumeData } from "@/lib/resume/types";
import type { Dictionary, Locale } from "@/lib/i18n";
import { AtsResumePreview } from "./ats-resume-preview";
import { TechnicalResumePreview } from "./technical-resume-preview";
import { ModernResumePreview } from "./modern-resume-preview";
import { ExecutiveResumePreview } from "./executive-resume-preview";

interface ResumePreviewProps {
  template: ResumeTemplate;
  data: ResumeData;
  locale: Locale;
  labels: Dictionary["resume"];
  hubLabels: Dictionary["resumeHub"];
  label?: string;
  variant?: "preview" | "print";
}

export function ResumePreview({
  template,
  data,
  locale,
  labels,
  hubLabels,
  label,
  variant = "preview",
}: ResumePreviewProps) {
  const props = { data, locale, labels, hubLabels, label, variant };

  switch (template) {
    case "TECHNICAL":
      return <TechnicalResumePreview {...props} />;
    case "MODERN":
      return <ModernResumePreview {...props} />;
    case "EXECUTIVE":
    case "CORPORATE":
      return <ExecutiveResumePreview {...props} />;
    case "ATS":
    default:
      return <AtsResumePreview {...props} />;
  }
}
