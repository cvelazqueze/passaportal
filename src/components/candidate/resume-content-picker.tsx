"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VisibilityToggle } from "@/components/ui/visibility-toggle";
import { Loader2, Save } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import {
  type ResumeSelection,
  type ContactFieldKey,
  CONTACT_FIELD_KEYS,
  isTailoredSelection,
  isContactFieldVisible,
  isSectionVisible,
} from "@/lib/resume/resume-selection";

interface PassportItem {
  id: string;
  label: string;
  sublabel?: string;
}

interface ContactFieldItem {
  key: ContactFieldKey;
  label: string;
  value: string;
}

interface ResumeContentPickerProps {
  resumeId: string;
  resumeName: string;
  selection: ResumeSelection;
  onSelectionChange: (selection: ResumeSelection) => void;
  onSaved: (selection: ResumeSelection) => void;
  hasSummary: boolean;
  contactFields: ContactFieldItem[];
  experiences: PassportItem[];
  education: PassportItem[];
  skills: PassportItem[];
  certifications: PassportItem[];
  projects: PassportItem[];
  languages: PassportItem[];
}

type ItemSectionKey =
  | "experience"
  | "education"
  | "skills"
  | "certifications"
  | "projects"
  | "languages";

const ITEM_SECTION_KEYS: ItemSectionKey[] = [
  "experience",
  "education",
  "skills",
  "certifications",
  "projects",
  "languages",
];

function idsKey(section: ItemSectionKey): keyof ResumeSelection {
  const map: Record<ItemSectionKey, keyof ResumeSelection> = {
    experience: "experienceIds",
    education: "educationIds",
    skills: "skillIds",
    certifications: "certificationIds",
    projects: "projectIds",
    languages: "languageIds",
  };
  return map[section];
}

function getSelectedIds(
  selection: ResumeSelection,
  section: ItemSectionKey,
  allIds: string[]
): Set<string> {
  if (!isSectionVisible(selection, section)) return new Set();
  const key = idsKey(section);
  const explicit = selection[key] as string[] | undefined;
  if (explicit === undefined) return new Set(allIds);
  return new Set(explicit);
}

function pruneContactFields(
  contactFields: ResumeSelection["contactFields"]
): ResumeSelection["contactFields"] | undefined {
  if (!contactFields) return undefined;
  const pruned = Object.fromEntries(
    Object.entries(contactFields).filter(([, v]) => v === false)
  );
  return Object.keys(pruned).length > 0 ? pruned : undefined;
}

function finalizeSelection(base: ResumeSelection): ResumeSelection {
  const next: ResumeSelection = { ...base };
  const prunedContact = pruneContactFields(next.contactFields);
  if (prunedContact) next.contactFields = prunedContact;
  else delete next.contactFields;

  if (next.sections) {
    const disabled = Object.entries(next.sections).filter(([, v]) => v === false);
    if (disabled.length === 0) delete next.sections;
  }

  return next;
}

function buildItemSelection(
  sectionItems: Record<ItemSectionKey, string[]>,
  selected: Record<ItemSectionKey, Set<string>>,
  sectionOn: Record<ItemSectionKey, boolean>,
  base: ResumeSelection
): ResumeSelection {
  const next: ResumeSelection = { ...base };
  const sections = { ...next.sections };

  for (const section of ITEM_SECTION_KEYS) {
    if (!sectionOn[section]) {
      sections[section] = false;
      delete (next as Record<string, unknown>)[idsKey(section)];
      continue;
    }

    delete sections[section];

    const all = sectionItems[section];
    const set = selected[section];
    if (all.length === 0) continue;

    if (set.size === 0) {
      (next as Record<string, string[]>)[idsKey(section) as string] = [];
    } else if (set.size === all.length && all.every((id) => set.has(id))) {
      delete (next as Record<string, unknown>)[idsKey(section)];
    } else {
      (next as Record<string, string[]>)[idsKey(section) as string] =
        Array.from(set);
    }
  }

  const hasDisabled = ITEM_SECTION_KEYS.some((s) => sections[s] === false);
  const hasSummaryOff = sections.summary === false;
  const hasContactOff = sections.contact === false;
  if (hasDisabled || hasSummaryOff || hasContactOff) {
    next.sections = sections;
  } else if (next.sections) {
    const onlyTruthy = Object.values(next.sections).some((v) => v === false);
    if (!onlyTruthy) delete next.sections;
  }

  return finalizeSelection(next);
}

export function ResumeContentPicker({
  resumeId,
  resumeName,
  selection,
  onSelectionChange,
  onSaved,
  hasSummary,
  contactFields,
  experiences,
  education,
  skills,
  certifications,
  projects,
  languages,
}: ResumeContentPickerProps) {
  const { t } = useLocale();
  const h = t.resumeHub;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const sectionData = useMemo(
    () => ({
      experience: experiences,
      education,
      skills,
      certifications,
      projects,
      languages,
    }),
    [experiences, education, skills, certifications, projects, languages]
  );

  const sectionLabels: Record<ItemSectionKey, string> = {
    experience: h.sectionExperience,
    education: h.sectionEducation,
    skills: h.sectionSkills,
    certifications: h.sectionCertifications,
    projects: h.sectionProjects,
    languages: h.sectionLanguages,
  };

  const allIds = useMemo(
    () =>
      Object.fromEntries(
        ITEM_SECTION_KEYS.map((k) => [k, sectionData[k].map((i) => i.id)])
      ) as Record<ItemSectionKey, string[]>,
    [sectionData]
  );

  const selectedSets = useMemo(() => {
    const sets = {} as Record<ItemSectionKey, Set<string>>;
    for (const section of ITEM_SECTION_KEYS) {
      sets[section] = getSelectedIds(selection, section, allIds[section]);
    }
    return sets;
  }, [selection, allIds]);

  const itemSections = ITEM_SECTION_KEYS.filter((k) => sectionData[k].length > 0);
  const extraColumns = (hasSummary ? 1 : 0) + 1;
  const columnCount = Math.min(
    Math.max(itemSections.length + extraColumns, 1),
    10
  );

  function updateItemSelection(
    mutator: (
      sets: Record<ItemSectionKey, Set<string>>,
      sectionOn: Record<ItemSectionKey, boolean>
    ) => void
  ) {
    const sets = { ...selectedSets };
    const sectionOn = Object.fromEntries(
      ITEM_SECTION_KEYS.map((s) => [s, isSectionVisible(selection, s)])
    ) as Record<ItemSectionKey, boolean>;
    mutator(sets, sectionOn);
    onSelectionChange(buildItemSelection(allIds, sets, sectionOn, selection));
  }

  function toggleSummary(visible: boolean) {
    const next: ResumeSelection = { ...selection, sections: { ...selection.sections } };
    if (visible) delete next.sections?.summary;
    else next.sections = { ...next.sections, summary: false };
    if (next.sections && Object.keys(next.sections).length === 0) delete next.sections;
    onSelectionChange(finalizeSelection(next));
  }

  function toggleContactSection(visible: boolean) {
    const next: ResumeSelection = { ...selection, sections: { ...selection.sections } };
    if (visible) {
      delete next.sections?.contact;
      delete next.contactFields;
    } else {
      next.sections = { ...next.sections, contact: false };
    }
    if (next.sections && !Object.values(next.sections).some((v) => v === false)) {
      delete next.sections;
    }
    onSelectionChange(finalizeSelection(next));
  }

  function toggleContactField(key: ContactFieldKey, visible: boolean) {
    const next: ResumeSelection = {
      ...selection,
      sections: { ...selection.sections },
      contactFields: { ...selection.contactFields },
    };
    delete next.sections?.contact;
    if (visible) {
      delete next.contactFields?.[key];
    } else {
      next.contactFields = { ...next.contactFields, [key]: false };
    }
    onSelectionChange(finalizeSelection(next));
  }

  function toggleItemSection(section: ItemSectionKey, enabled: boolean) {
    updateItemSelection((sets, sectionOn) => {
      sectionOn[section] = enabled;
      if (enabled) sets[section] = new Set(allIds[section]);
      else sets[section] = new Set();
    });
  }

  function toggleItem(section: ItemSectionKey, id: string, visible: boolean) {
    updateItemSelection((sets, sectionOn) => {
      sectionOn[section] = true;
      const set = new Set(sets[section]);
      if (visible) set.add(id);
      else set.delete(id);
      sets[section] = set;
    });
  }

  function includeAllInSection(section: ItemSectionKey) {
    updateItemSelection((sets, sectionOn) => {
      sectionOn[section] = true;
      sets[section] = new Set(allIds[section]);
    });
  }

  async function handleSave() {
    if (!resumeId) return;

    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch(`/api/candidate/resumes/${resumeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includedSections: selection }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? h.contentSaveFailed);
      onSaved(selection);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : h.contentSaveFailed);
    } finally {
      setSaving(false);
    }
  }

  const tailored = isTailoredSelection(selection);
  const contactOn = isSectionVisible(selection, "contact");
  const summaryOn = isSectionVisible(selection, "summary");

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
            {h.contentFor}:{" "}
            <span className="font-medium text-foreground">{resumeName}</span>
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={saving || !resumeId}
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {t.common.save}
        </Button>
      </CardHeader>
      <CardContent>
        {(error || success) && (
          <p
            className={`mb-4 text-sm ${error ? "text-destructive" : "text-success"}`}
          >
            {error || h.contentSaved}
          </p>
        )}

        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:[grid-template-columns:repeat(var(--resume-cols),minmax(0,1fr))]"
          style={{ "--resume-cols": columnCount } as React.CSSProperties}
        >
          {hasSummary && (
            <div className="flex min-w-0 flex-col rounded-lg border bg-card p-3">
              <VisibilityToggle
                visible={summaryOn}
                onToggle={toggleSummary}
                label={h.sectionSummary}
                sublabel={h.sectionSummaryHint}
              />
            </div>
          )}

          <div className="flex min-w-0 flex-col rounded-lg border bg-card p-3">
            <div className="mb-2">
              <VisibilityToggle
                visible={contactOn}
                onToggle={toggleContactSection}
                label={h.sectionContact}
                sublabel={h.sectionContactHint}
              />
            </div>
            {contactOn ? (
              <ul className="flex flex-col gap-1">
                {contactFields.map((field) => (
                  <li key={field.key}>
                    <VisibilityToggle
                      size="sm"
                      visible={isContactFieldVisible(selection, field.key)}
                      onToggle={(v) => toggleContactField(field.key, v)}
                      label={field.label}
                      sublabel={field.value || h.contactEmpty}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs italic text-muted-foreground">—</p>
            )}
          </div>

          {itemSections.map((section) => {
            const items = sectionData[section];
            const enabled = isSectionVisible(selection, section);
            const selected = selectedSets[section];

            return (
              <div
                key={section}
                className="flex min-w-0 flex-col rounded-lg border bg-card p-3"
              >
                <div className="mb-2 flex items-start justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <VisibilityToggle
                      visible={enabled}
                      onToggle={(v) => toggleItemSection(section, v)}
                      label={sectionLabels[section]}
                      sublabel={`${selected.size}/${items.length}`}
                    />
                  </div>
                  {enabled && selected.size < items.length && items.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 shrink-0 px-2 text-xs"
                      onClick={() => includeAllInSection(section)}
                    >
                      {h.includeAll}
                    </Button>
                  )}
                </div>

                {enabled ? (
                  <ul className="flex min-h-0 flex-1 flex-col gap-0.5">
                    {items.map((item) => (
                      <li key={item.id}>
                        <VisibilityToggle
                          size="sm"
                          visible={selected.has(item.id)}
                          onToggle={(v) => toggleItem(section, item.id, v)}
                          label={item.label}
                          sublabel={item.sublabel}
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs italic text-muted-foreground">—</p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
