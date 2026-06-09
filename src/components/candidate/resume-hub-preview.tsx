"use client";

import type { ResumeTemplate } from "@prisma/client";
import type { ResumeData } from "@/lib/resume/types";
import { useLocale } from "@/components/locale-provider";
import { ResumePreview } from "@/components/candidate/resume-preview";

interface ResumeHubPreviewProps {
  data: ResumeData;
  template: ResumeTemplate;
}

export function ResumeHubPreview({ data, template }: ResumeHubPreviewProps) {
  const { locale, t } = useLocale();

  return (
    <ResumePreview
      template={template}
      data={data}
      locale={locale}
      labels={t.resume}
      hubLabels={t.resumeHub}
      label={t.resumeHub.previewLabel}
    />
  );
}
