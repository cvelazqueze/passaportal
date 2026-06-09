"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import {
  type ResumeSelection,
  isTailoredSelection,
} from "@/lib/resume/resume-selection";

interface PassportItem {
  id: string;
  label: string;
  sublabel?: string;
}

interface ResumeContentPickerProps {
  resumeId: string;
  resumeName: string;
  initialSelection: ResumeSelection;
  experiences: PassportItem[];
  education: PassportItem[];
  skills: PassportItem[];
  certifications: PassportItem[];
  projects: PassportItem[];
}

type SectionKey = "experience" | "education" | "skills" | "certifications" | "projects";

const SECTION_KEYS: SectionKey[] = [
  "experience",
  "education",
  "skills",
  "certifications",
  "projects",
];

function idsKey(section: SectionKey): keyof ResumeSelection {
  const map: Record<SectionKey, keyof ResumeSelection> = {
    experience: "experienceIds",
    education: "educationIds",
    skills: "skillIds",
    certifications: "certificationIds",
    projects: "projectIds",
  };
  return map[section];
}

function isSectionOn(selection: ResumeSelection, key: SectionKey): boolean {
  return selection.sections?.[key] !== false;
}

function getSelectedIds(
  selection: ResumeSelection,
  section: SectionKey,
  allIds: string[]
): Set<string> {
  const key = idsKey(section);
  const explicit = selection[key] as string[] | undefined;
  if (!explicit || explicit.length === 0) {
    return new Set(allIds);
  }
  return new Set(explicit);
}

function buildSelectionFromSets(
  base: ResumeSelection,
  sectionItems: Record<SectionKey, string[]>,
  selected: Record<SectionKey, Set<string>>
): ResumeSelection {
  const next: ResumeSelection = {
    sections: { ...base.sections },
  };

  for (const section of SECTION_KEYS) {
    const all = sectionItems[section];
    const set = selected[section];
    if (!isSectionOn(base, section) && base.sections?.[section] === false) {
      next.sections = { ...next.sections, [section]: false };
      continue;
    }
    if (set.size === all.length && all.every((id) => set.has(id))) {
      continue;
    }
    if (set.size === 0) {
      next.sections = { ...next.sections, [section]: false };
    } else {
      const key = idsKey(section);
      (next as Record<string, unknown>)[key] = Array.from(set);
    }
  }

  if (next.sections && Object.keys(next.sections).length === 0) {
    delete next.sections;
  }

  return next;
}

export function ResumeContentPicker({
  resumeId,
  resumeName,
  initialSelection,
  experiences,
  education,
  skills,
  certifications,
  projects,
}: ResumeContentPickerProps) {
  const router = useRouter();
  const { t } = useLocale();
  const h = t.resumeHub;

  const sectionData: Record<SectionKey, PassportItem[]> = {
    experience: experiences,
    education,
    skills,
    certifications,
    projects,
  };

  const sectionLabels: Record<SectionKey, string> = {
    experience: h.sectionExperience,
    education: h.sectionEducation,
    skills: h.sectionSkills,
    certifications: h.sectionCertifications,
    projects: h.sectionProjects,
  };

  const allIds = useMemo(
    () =>
      Object.fromEntries(
        SECTION_KEYS.map((k) => [k, sectionData[k].map((i) => i.id)])
      ) as Record<SectionKey, string[]>,
    [sectionData]
  );

  const [selection, setSelection] = useState<ResumeSelection>(initialSelection);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const selectedSets = useMemo(() => {
    const sets = {} as Record<SectionKey, Set<string>>;
    for (const section of SECTION_KEYS) {
      sets[section] = getSelectedIds(selection, section, allIds[section]);
    }
    return sets;
  }, [selection, allIds]);

  function toggleSection(section: SectionKey, enabled: boolean) {
    setSelection((prev) => {
      const sets = { ...selectedSets };
      if (enabled) {
        sets[section] = new Set(allIds[section]);
      }
      const sections = { ...prev.sections, [section]: enabled };
      const base = { ...prev, sections };
      return buildSelectionFromSets(base, allIds, sets);
    });
  }

  function toggleItem(section: SectionKey, id: string, checked: boolean) {
    setSelection((prev) => {
      const sets = { ...selectedSets };
      const set = new Set(sets[section]);
      if (checked) set.add(id);
      else set.delete(id);
      sets[section] = set;
      const sections = { ...prev.sections, [section]: true };
      return buildSelectionFromSets({ ...prev, sections }, allIds, sets);
    });
  }

  function includeAllInSection(section: SectionKey) {
    setSelection((prev) => {
      const sets = { ...selectedSets, [section]: new Set(allIds[section]) };
      const sections = { ...prev.sections, [section]: true };
      return buildSelectionFromSets({ ...prev, sections }, allIds, sets);
    });
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      for (const section of SECTION_KEYS) {
        if (isSectionOn(selection, section) && selectedSets[section].size === 0) {
          setError(h.selectAtLeastOne);
          setSaving(false);
          return;
        }
      }

      const res = await fetch(`/api/candidate/resumes/${resumeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includedSections: selection }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? h.contentSaveFailed);
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : h.contentSaveFailed);
    } finally {
      setSaving(false);
    }
  }

  const tailored = isTailoredSelection(selection);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            {h.contentTitle}
            <Badge variant={tailored ? "default" : "secondary"}>
              {tailored ? h.tailoredBadge : h.fullProfileBadge}
            </Badge>
          </CardTitle>
          <CardDescription>{h.contentDesc}</CardDescription>
          <p className="mt-2 text-sm text-muted-foreground">
            {h.contentFor}: <span className="font-medium text-foreground">{resumeName}</span>
          </p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {t.common.save}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {(error || success) && (
          <p
            className={`text-sm ${error ? "text-destructive" : "text-success"}`}
          >
            {error || h.contentSaved}
          </p>
        )}

        {SECTION_KEYS.map((section) => {
          const items = sectionData[section];
          if (items.length === 0) return null;
          const enabled = isSectionOn(selection, section);
          const selected = selectedSets[section];

          return (
            <div key={section} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 font-medium text-sm">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => toggleSection(section, e.target.checked)}
                  />
                  {sectionLabels[section]} ({selected.size}/{items.length})
                </label>
                {enabled && selected.size < items.length && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => includeAllInSection(section)}
                  >
                    {h.includeAll}
                  </Button>
                )}
              </div>
              {enabled && (
                <ul className="space-y-2 pl-6">
                  {items.map((item) => (
                    <li key={item.id}>
                      <label className="flex items-start gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={selected.has(item.id)}
                          onChange={(e) =>
                            toggleItem(section, item.id, e.target.checked)
                          }
                        />
                        <span>
                          <span className="font-medium">{item.label}</span>
                          {item.sublabel && (
                            <span className="block text-xs text-muted-foreground">
                              {item.sublabel}
                            </span>
                          )}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
