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

export interface OpportunityOption {
  id: string;
  title: string | null;
  company: string | null;
  pipelineStage?: { name: string } | null;
}

export interface RejectionReason {
  id: string;
  label: string;
}

export interface RejectionRecord {
  id: string;
  applicationId: string;
  reasonId: string | null;
  stageName: string | null;
  rejectedAt: string;
  candidateNotes: string | null;
  reason: RejectionReason | null;
  application: { title: string | null; company: string | null };
}

interface PipelineStageOption {
  id: string;
  name: string;
}

interface RejectionFormProps {
  mode: "add" | "edit";
  opportunities: OpportunityOption[];
  reasons: RejectionReason[];
  stages: PipelineStageOption[];
  initial?: RejectionRecord;
  onSuccess: (record: RejectionRecord) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function opportunityLabel(o: OpportunityOption): string {
  const title = o.title?.trim() || "—";
  const company = o.company?.trim();
  return company ? `${title} @ ${company}` : title;
}

function formatDateInput(iso: string): string {
  return iso.slice(0, 10);
}

export function RejectionForm({
  mode,
  opportunities,
  reasons,
  stages,
  initial,
  onSuccess,
  onCancel,
  onDelete,
}: RejectionFormProps) {
  const t = useT();
  const r = t.rejections;
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const isEdit = mode === "edit";
  const defaultOpportunityId = initial?.applicationId ?? opportunities[0]?.id ?? "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const payload = {
      applicationId: form.get("applicationId") as string,
      reasonId: (form.get("reasonId") as string) || null,
      stageName: (form.get("stageName") as string) || null,
      rejectedAt: form.get("rejectedAt") as string,
      candidateNotes: (form.get("candidateNotes") as string).trim() || null,
    };

    try {
      const url = isEdit
        ? `/api/candidate/rejections/${initial!.id}`
        : "/api/candidate/rejections";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? (isEdit ? r.editFailed : r.addFailed));
        return;
      }
      onSuccess(json.record);
    } catch {
      setError(isEdit ? r.editFailed : r.addFailed);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!isEdit || !initial || !onDelete) return;
    if (!window.confirm(r.deleteConfirm)) return;

    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/candidate/rejections/${initial.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? r.deleteFailed);
        return;
      }
      onDelete();
    } catch {
      setError(r.deleteFailed);
    } finally {
      setDeleting(false);
    }
  }

  if (opportunities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? r.editRejection : r.logRejection}</CardTitle>
          <CardDescription>{r.noOpportunitiesDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t.common.cancel}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? r.editRejection : r.logRejection}</CardTitle>
        <CardDescription>
          {isEdit ? r.editRejectionDesc : r.logRejectionDesc}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="applicationId">{r.opportunity}</Label>
            <select
              id="applicationId"
              name="applicationId"
              required
              defaultValue={defaultOpportunityId}
              className={selectClassName}
            >
              {opportunities.map((o) => (
                <option key={o.id} value={o.id}>
                  {opportunityLabel(o)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rejectedAt">{r.rejectedDate}</Label>
              <Input
                id="rejectedAt"
                name="rejectedAt"
                type="date"
                required
                defaultValue={
                  initial ? formatDateInput(initial.rejectedAt) : undefined
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stageName">{r.stage}</Label>
              <select
                id="stageName"
                name="stageName"
                defaultValue={initial?.stageName ?? ""}
                className={selectClassName}
              >
                <option value="">{r.stageAuto}</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.name}>
                    {translatePipelineStage(s.name, t)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reasonId">{r.reason}</Label>
            <select
              id="reasonId"
              name="reasonId"
              defaultValue={initial?.reasonId ?? ""}
              className={selectClassName}
            >
              <option value="">{r.reasonUnspecified}</option>
              {reasons.map((reason) => (
                <option key={reason.id} value={reason.id}>
                  {reason.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="candidateNotes">{r.notes}</Label>
            <textarea
              id="candidateNotes"
              name="candidateNotes"
              rows={4}
              defaultValue={initial?.candidateNotes ?? ""}
              placeholder={r.notesPlaceholder}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px]"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={submitting || deleting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? t.common.save : r.logRejection}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={submitting || deleting}
            >
              {t.common.cancel}
            </Button>
            {isEdit && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={submitting || deleting}
                className="ml-auto"
              >
                {deleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                {t.common.delete}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
