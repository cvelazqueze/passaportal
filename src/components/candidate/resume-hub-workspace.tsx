"use client";

import { useMemo, useState, useCallback } from "react";
import type { ResumeTemplate } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResumeHubPreview } from "@/components/candidate/resume-hub-preview";
import { ResumeExportActions } from "@/components/candidate/resume-export-actions";
import { ResumeContentPicker } from "@/components/candidate/resume-content-picker";
import { buildResumeData } from "@/lib/resume/build-resume-data";
import {
  parseResumeSelection,
  EMPTY_RESUME_SELECTION,
  type ResumeSelection,
} from "@/lib/resume/resume-selection";
import {
  deserializePassport,
  type SerializedPassport,
} from "@/lib/resume/serialize-passport";
import { useLocale } from "@/components/locale-provider";

interface ResumeRow {
  id: string;
  name: string;
  isMaster: boolean;
  status?: string;
  template: ResumeTemplate;
  targetRole: string | null;
  includedSections: unknown;
}

interface ResumeHubWorkspaceProps {
  user: { firstName: string; lastName: string; email: string };
  passport: SerializedPassport;
  resumes: ResumeRow[];
}

export function ResumeHubWorkspace({
  user,
  passport,
  resumes,
}: ResumeHubWorkspaceProps) {
  const { t } = useLocale();
  const master = resumes.find((r) => r.isMaster) ?? resumes[0];

  const initialSelections = useMemo(() => {
    const map: Record<string, ResumeSelection> = {};
    for (const r of resumes) {
      map[r.id] = parseResumeSelection(r.includedSections);
    }
    return map;
  }, [resumes]);

  const [activeId, setActiveId] = useState(master?.id ?? "");
  const [selections, setSelections] =
    useState<Record<string, ResumeSelection>>(initialSelections);

  const active = resumes.find((r) => r.id === activeId) ?? master;
  const activeSelection = active ? selections[active.id] : undefined;

  const previewData = useMemo(() => {
    if (!active || !activeSelection) return null;
    const deserialized = deserializePassport(passport);
    return buildResumeData(user, deserialized, activeSelection);
  }, [user, passport, active, activeSelection]);

  const handleSelectionChange = useCallback(
    (resumeId: string, next: ResumeSelection) => {
      setSelections((prev) => ({ ...prev, [resumeId]: next }));
    },
    []
  );

  const handleSaved = useCallback((resumeId: string, saved: ResumeSelection) => {
    setSelections((prev) => ({ ...prev, [resumeId]: saved }));
  }, []);

  if (!active || !previewData) return null;

  const templateMeta =
    t.templates[active.template as keyof typeof t.templates] ?? t.templates.ATS;

  const pickerItems = {
    experiences: passport.experiences.map((e) => ({
      id: e.id,
      label: e.position,
      sublabel: `${e.company}${e.location ? ` — ${e.location}` : ""}`,
    })),
    education: passport.education.map((e) => ({
      id: e.id,
      label: e.degree,
      sublabel: e.institution,
    })),
    skills: passport.skills.map((s) => ({
      id: s.id,
      label: s.name,
      sublabel: undefined as string | undefined,
    })),
    certifications: passport.certifications.map((c) => ({
      id: c.id,
      label: c.name,
      sublabel: c.issuer,
    })),
    projects: passport.projects.map((p) => ({
      id: p.id,
      label: p.title,
    })),
    languages: passport.languages.map((l) => ({
      id: l.id,
      label: l.name,
      sublabel: l.proficiency,
    })),
  };

  const locationLabel = [passport.city, passport.country].filter(Boolean).join(", ");
  const contactFieldItems = [
    { key: "title" as const, label: t.resumeHub.contactFieldTitle, value: passport.professionalTitle ?? "" },
    { key: "email" as const, label: t.resumeHub.contactFieldEmail, value: user.email },
    { key: "phone" as const, label: t.resumeHub.contactFieldPhone, value: passport.phone ?? "" },
    { key: "linkedIn" as const, label: t.resumeHub.contactFieldLinkedIn, value: passport.linkedIn ?? "" },
    { key: "github" as const, label: t.resumeHub.contactFieldGithub, value: passport.github ?? "" },
    { key: "portfolio" as const, label: t.resumeHub.contactFieldPortfolio, value: passport.portfolio ?? "" },
    { key: "location" as const, label: t.resumeHub.contactFieldLocation, value: locationLabel },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-primary/30">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              {active.isMaster && (
                <Badge className="mb-2">{t.resumeHub.masterResume}</Badge>
              )}
              <CardTitle>{active.name}</CardTitle>
              <CardDescription>
                {active.isMaster
                  ? t.resumeHub.masterDescription
                  : t.resumeHub.versionsDescription}
              </CardDescription>
            </div>
            <ResumeExportActions
              resumeId={active.id}
              resumeName={active.name}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t.resumeHub.template}: {templateMeta.name}
            {active.targetRole && ` · ${t.resumeHub.target}: ${active.targetRole}`}
          </p>
          <ResumeHubPreview
            data={previewData}
            template={active.template}
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {resumes.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {t.resumeHub.contentFor}:
            </span>
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
          resumeId={active.id}
          resumeName={active.name}
          selection={activeSelection ?? EMPTY_RESUME_SELECTION}
          onSelectionChange={(next) => handleSelectionChange(active.id, next)}
          onSaved={(saved) => handleSaved(active.id, saved)}
          hasSummary={!!passport.professionalSummary}
          contactFields={contactFieldItems}
          {...pickerItems}
        />
      </div>
    </div>
  );
}
