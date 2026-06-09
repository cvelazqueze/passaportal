"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2 } from "lucide-react";
import { useT } from "@/components/locale-provider";
import { translatePipelineStage } from "@/lib/i18n/helpers";
import { parseList } from "@/lib/candidate/opportunity-schema";
import type { WorkArrangement } from "@prisma/client";

export interface PipelineStageOption {
  id: string;
  name: string;
}

export interface Opportunity {
  id: string;
  title: string | null;
  company: string | null;
  client: string | null;
  pipelineStageId: string | null;
  pipelineStage: PipelineStageOption | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  contractType: string | null;
  duration: string | null;
  workType: WorkArrangement | null;
  benefits: string[];
  technologies: string[];
  source: string | null;
  notes?: string | null;
  recruiterName: string | null;
  recruiterContact: string | null;
}

interface OpportunityFormProps {
  mode: "add" | "edit";
  stages: PipelineStageOption[];
  initial?: Opportunity;
  onSuccess: (opportunity: Opportunity) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "MXN", "COP", "ARS", "BRL"] as const;
const WORK_TYPES: WorkArrangement[] = ["REMOTE", "HYBRID", "ONSITE"];

function buildPayload(form: FormData) {
  const salaryMinRaw = form.get("salaryMin") as string;
  const salaryMaxRaw = form.get("salaryMax") as string;
  const workTypeRaw = form.get("workType") as string;

  return {
    title: (form.get("title") as string).trim(),
    company: (form.get("company") as string).trim() || null,
    client: (form.get("client") as string).trim() || null,
    pipelineStageId: (form.get("pipelineStageId") as string) || null,
    source: (form.get("source") as string).trim() || null,
    notes: (form.get("notes") as string).trim() || null,
    recruiterName: (form.get("recruiterName") as string).trim() || null,
    recruiterContact: (form.get("recruiterContact") as string).trim() || null,
    contractType: (form.get("contractType") as string).trim() || null,
    duration: (form.get("duration") as string).trim() || null,
    salaryCurrency: (form.get("salaryCurrency") as string) || "USD",
    workType: workTypeRaw ? (workTypeRaw as WorkArrangement) : null,
    technologies: parseList(form.get("technologies") as string),
    benefits: parseList(form.get("benefits") as string),
    salaryMin: salaryMinRaw ? Number(salaryMinRaw) : null,
    salaryMax: salaryMaxRaw ? Number(salaryMaxRaw) : null,
  };
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

export function OpportunityForm({
  mode,
  stages,
  initial,
  onSuccess,
  onCancel,
  onDelete,
}: OpportunityFormProps) {
  const t = useT();
  const o = t.opportunities;
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const isEdit = mode === "edit";
  const defaultStageId = initial?.pipelineStageId ?? stages[0]?.id ?? "";

  function workTypeLabel(type: WorkArrangement): string {
    return o.workTypes[type];
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = buildPayload(new FormData(e.currentTarget));

    try {
      const url = isEdit
        ? `/api/candidate/opportunities/${initial!.id}`
        : "/api/candidate/opportunities";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? (isEdit ? o.editFailed : o.addFailed));
        return;
      }
      onSuccess(json.opportunity);
    } catch {
      setError(isEdit ? o.editFailed : o.addFailed);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!isEdit || !initial || !onDelete) return;
    if (!window.confirm(o.deleteConfirm)) return;

    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/candidate/opportunities/${initial.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? o.deleteFailed);
        return;
      }
      onDelete();
    } catch {
      setError(o.deleteFailed);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? o.editOpportunity : o.addOpportunity}</CardTitle>
        <CardDescription>
          {isEdit ? o.editOpportunityDesc : o.addOpportunityDesc}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-sm text-destructive">{error}</p>}

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold">{o.sectionRole}</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="opp-title">
                  {o.roleTitle} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="opp-title"
                  name="title"
                  defaultValue={initial?.title ?? ""}
                  placeholder={o.roleTitlePlaceholder}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opp-company">{o.company}</Label>
                <Input
                  id="opp-company"
                  name="company"
                  defaultValue={initial?.company ?? ""}
                  placeholder={o.companyPlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opp-client">{o.client}</Label>
                <Input
                  id="opp-client"
                  name="client"
                  defaultValue={initial?.client ?? ""}
                  placeholder={o.clientPlaceholder}
                />
                <p className="text-xs text-muted-foreground">{o.clientHint}</p>
              </div>
              {stages.length > 0 && (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="opp-stage">{o.initialStage}</Label>
                  <select
                    id="opp-stage"
                    name="pipelineStageId"
                    defaultValue={defaultStageId}
                    className={selectClassName}
                  >
                    {stages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {translatePipelineStage(stage.name, t)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold">{o.sectionTerms}</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="opp-work-type">{o.workType}</Label>
                <select
                  id="opp-work-type"
                  name="workType"
                  defaultValue={initial?.workType ?? ""}
                  className={selectClassName}
                >
                  <option value="">{o.workTypeUnset}</option>
                  {WORK_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {workTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="opp-contract">{o.contractType}</Label>
                <Input
                  id="opp-contract"
                  name="contractType"
                  defaultValue={initial?.contractType ?? ""}
                  placeholder={o.contractTypePlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opp-duration">{o.duration}</Label>
                <Input
                  id="opp-duration"
                  name="duration"
                  defaultValue={initial?.duration ?? ""}
                  placeholder={o.durationPlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opp-currency">{o.currency}</Label>
                <select
                  id="opp-currency"
                  name="salaryCurrency"
                  defaultValue={initial?.salaryCurrency ?? "USD"}
                  className={selectClassName}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="opp-salary-min">{o.salaryMin}</Label>
                <Input
                  id="opp-salary-min"
                  name="salaryMin"
                  type="number"
                  min={0}
                  defaultValue={initial?.salaryMin ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opp-salary-max">{o.salaryMax}</Label>
                <Input
                  id="opp-salary-max"
                  name="salaryMax"
                  type="number"
                  min={0}
                  defaultValue={initial?.salaryMax ?? ""}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="opp-benefits">{o.benefits}</Label>
                <Input
                  id="opp-benefits"
                  name="benefits"
                  defaultValue={initial?.benefits.join(", ") ?? ""}
                  placeholder={o.benefitsPlaceholder}
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold">{o.sectionContact}</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="opp-contact">{o.contactPerson}</Label>
                <Input
                  id="opp-contact"
                  name="recruiterName"
                  defaultValue={initial?.recruiterName ?? ""}
                  placeholder={o.contactPersonPlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opp-contact-info">{o.contactInfo}</Label>
                <Input
                  id="opp-contact-info"
                  name="recruiterContact"
                  defaultValue={initial?.recruiterContact ?? ""}
                  placeholder={o.contactInfoPlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opp-source">{o.source}</Label>
                <Input
                  id="opp-source"
                  name="source"
                  defaultValue={initial?.source ?? ""}
                  placeholder={o.sourcePlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opp-technologies">{o.technologies}</Label>
                <Input
                  id="opp-technologies"
                  name="technologies"
                  defaultValue={initial?.technologies.join(", ") ?? ""}
                  placeholder={o.technologiesPlaceholder}
                />
              </div>
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="opp-notes">{o.notes}</Label>
            <textarea
              id="opp-notes"
              name="notes"
              rows={3}
              defaultValue={initial?.notes ?? ""}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder={o.notesPlaceholder}
            />
          </div>

          <div className="flex flex-wrap justify-between gap-2">
            {isEdit && onDelete ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={submitting || deleting}
              >
                {deleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                {o.deleteOpportunity}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={submitting || deleting}
              >
                {t.common.cancel}
              </Button>
              <Button type="submit" disabled={submitting || deleting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitting
                  ? isEdit
                    ? o.saving
                    : o.adding
                  : isEdit
                    ? t.common.save
                    : o.addOpportunity}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
