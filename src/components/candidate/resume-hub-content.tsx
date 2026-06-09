"use client";

import { useState } from "react";
import { ResumeContentPicker } from "./resume-content-picker";
import { parseResumeSelection } from "@/lib/resume/resume-selection";
import { useLocale } from "@/components/locale-provider";

interface PassportItem {
  id: string;
  label: string;
  sublabel?: string;
}

interface ResumeRow {
  id: string;
  name: string;
  isMaster: boolean;
  status?: string;
  includedSections: unknown;
}

interface ResumeHubContentPanelProps {
  resumes: ResumeRow[];
  experiences: PassportItem[];
  education: PassportItem[];
  skills: PassportItem[];
  certifications: PassportItem[];
  projects: PassportItem[];
}

export function ResumeHubContentPanel({
  resumes,
  experiences,
  education,
  skills,
  certifications,
  projects,
}: ResumeHubContentPanelProps) {
  const { t } = useLocale();
  const master = resumes.find((r) => r.isMaster) ?? resumes[0];
  const [activeId, setActiveId] = useState(master?.id ?? "");

  const active = resumes.find((r) => r.id === activeId) ?? master;
  if (!active) return null;

  return (
    <div className="space-y-4">
      {resumes.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">{t.resumeHub.contentFor}:</span>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={activeId}
            onChange={(e) => setActiveId(e.target.value)}
          >
            {resumes
              .filter((r) => r.status !== "ARCHIVED")
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {r.isMaster ? ` (${t.resumeHub.masterResume})` : ""}
                </option>
              ))}
          </select>
        </div>
      )}
      <ResumeContentPicker
        key={active.id}
        resumeId={active.id}
        resumeName={active.name}
        initialSelection={parseResumeSelection(active.includedSections)}
        experiences={experiences}
        education={education}
        skills={skills}
        certifications={certifications}
        projects={projects}
      />
    </div>
  );
}
