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
import { JOB_STATUSES, parseSkills } from "@/lib/recruiter/job-schema";
import type { JobStatus } from "@prisma/client";

export interface RecruiterJob {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  location: string | null;
  remote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  status: JobStatus;
  _count?: { applications: number };
}

interface JobFormProps {
  mode: "add" | "edit";
  initial?: RecruiterJob;
  onSuccess: (job: RecruiterJob) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

export function JobForm({ mode, initial, onSuccess, onCancel, onDelete }: JobFormProps) {
  const t = useT();
  const j = t.recruiter.jobs;
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const isEdit = mode === "edit";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const salaryMinRaw = form.get("salaryMin") as string;
    const salaryMaxRaw = form.get("salaryMax") as string;

    const payload = {
      title: (form.get("title") as string).trim(),
      description: (form.get("description") as string).trim(),
      location: (form.get("location") as string).trim() || null,
      remote: form.get("remote") === "on",
      status: form.get("status") as JobStatus,
      salaryCurrency: (form.get("salaryCurrency") as string) || "USD",
      salaryMin: salaryMinRaw ? Number(salaryMinRaw) : null,
      salaryMax: salaryMaxRaw ? Number(salaryMaxRaw) : null,
      requirements: parseSkills(form.get("requirements") as string),
      requiredSkills: parseSkills(form.get("requiredSkills") as string),
      preferredSkills: parseSkills(form.get("preferredSkills") as string),
    };

    try {
      const url = isEdit ? `/api/recruiter/jobs/${initial!.id}` : "/api/recruiter/jobs";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? (isEdit ? j.editFailed : j.addFailed));
        return;
      }
      onSuccess(json.job);
    } catch {
      setError(isEdit ? j.editFailed : j.addFailed);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!isEdit || !initial || !onDelete) return;
    if (!window.confirm(j.deleteConfirm)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/recruiter/jobs/${initial.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? j.deleteFailed);
        return;
      }
      onDelete();
    } catch {
      setError(j.deleteFailed);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? j.editJob : j.newJob}</CardTitle>
        <CardDescription>{isEdit ? j.editJobDesc : j.newJobDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">{j.titleLabel}</Label>
              <Input id="title" name="title" required defaultValue={initial?.title} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">{j.descriptionLabel}</Label>
              <textarea
                id="description"
                name="description"
                required
                rows={5}
                defaultValue={initial?.description}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">{j.status}</Label>
              <select
                id="status"
                name="status"
                defaultValue={initial?.status ?? "DRAFT"}
                className={selectClassName}
              >
                {JOB_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {j.statuses[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">{j.location}</Label>
              <Input id="location" name="location" defaultValue={initial?.location ?? ""} />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                name="remote"
                defaultChecked={initial?.remote ?? false}
                className="h-4 w-4 rounded border-input"
              />
              {j.remote}
            </label>
            <div className="space-y-2">
              <Label htmlFor="salaryMin">{j.salaryMin}</Label>
              <Input id="salaryMin" name="salaryMin" type="number" min={0} defaultValue={initial?.salaryMin ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salaryMax">{j.salaryMax}</Label>
              <Input id="salaryMax" name="salaryMax" type="number" min={0} defaultValue={initial?.salaryMax ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requiredSkills">{j.requiredSkills}</Label>
              <Input
                id="requiredSkills"
                name="requiredSkills"
                defaultValue={initial?.requiredSkills.join(", ")}
                placeholder={j.skillsPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredSkills">{j.preferredSkills}</Label>
              <Input
                id="preferredSkills"
                name="preferredSkills"
                defaultValue={initial?.preferredSkills.join(", ")}
                placeholder={j.skillsPlaceholder}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="requirements">{j.requirements}</Label>
              <Input
                id="requirements"
                name="requirements"
                defaultValue={initial?.requirements.join(", ")}
                placeholder={j.skillsPlaceholder}
              />
            </div>
          </div>
          <input type="hidden" name="salaryCurrency" value={initial?.salaryCurrency ?? "USD"} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={submitting || deleting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? t.common.save : j.newJob}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting || deleting}>
              {t.common.cancel}
            </Button>
            {isEdit && onDelete && (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={submitting || deleting} className="ml-auto">
                {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                {t.common.delete}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
