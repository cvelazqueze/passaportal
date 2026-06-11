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
import { translateInterviewType } from "@/lib/i18n/helpers";
import {
  INTERVIEW_TYPES,
  parseQuestions,
} from "@/lib/candidate/interview-schema";
import type { InterviewType } from "@prisma/client";

export interface OpportunityOption {
  id: string;
  title: string | null;
  company: string | null;
}

export interface InterviewQuestion {
  id: string;
  questionType: "TECHNICAL" | "BEHAVIORAL";
  question: string;
}

export interface InterviewSession {
  id: string;
  applicationId: string;
  interviewDate: string;
  interviewType: InterviewType;
  interviewer: string | null;
  notes: string | null;
  outcome: string | null;
  lessonsLearned: string | null;
  application: { title: string | null; company: string | null };
  questions: InterviewQuestion[];
}

interface InterviewSessionFormProps {
  mode: "add" | "edit";
  opportunities: OpportunityOption[];
  initial?: InterviewSession;
  onSuccess: (session: InterviewSession) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function formatDateInput(iso: string): string {
  return iso.slice(0, 10);
}

function questionsToText(questions: InterviewQuestion[], type: "TECHNICAL" | "BEHAVIORAL") {
  return questions
    .filter((q) => q.questionType === type)
    .map((q) => q.question)
    .join("\n");
}

function opportunityLabel(o: OpportunityOption): string {
  const title = o.title?.trim() || "—";
  const company = o.company?.trim();
  return company ? `${title} @ ${company}` : title;
}

export function InterviewSessionForm({
  mode,
  opportunities,
  initial,
  onSuccess,
  onCancel,
  onDelete,
}: InterviewSessionFormProps) {
  const t = useT();
  const i = t.interviews;
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
      interviewDate: form.get("interviewDate") as string,
      interviewType: form.get("interviewType") as InterviewType,
      interviewer: (form.get("interviewer") as string).trim() || null,
      outcome: (form.get("outcome") as string).trim() || null,
      lessonsLearned: (form.get("lessonsLearned") as string).trim() || null,
      notes: (form.get("notes") as string).trim() || null,
      technicalQuestions: parseQuestions(form.get("technicalQuestions") as string),
      behavioralQuestions: parseQuestions(form.get("behavioralQuestions") as string),
    };

    try {
      const url = isEdit
        ? `/api/candidate/interviews/${initial!.id}`
        : "/api/candidate/interviews";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? (isEdit ? i.editFailed : i.addFailed));
        return;
      }
      onSuccess(json.session);
    } catch {
      setError(isEdit ? i.editFailed : i.addFailed);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!isEdit || !initial || !onDelete) return;
    if (!window.confirm(i.deleteConfirm)) return;

    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/candidate/interviews/${initial.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? i.deleteFailed);
        return;
      }
      onDelete();
    } catch {
      setError(i.deleteFailed);
    } finally {
      setDeleting(false);
    }
  }

  if (opportunities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? i.editInterview : i.logInterview}</CardTitle>
          <CardDescription>{i.noOpportunitiesDesc}</CardDescription>
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
        <CardTitle>{isEdit ? i.editInterview : i.logInterview}</CardTitle>
        <CardDescription>
          {isEdit ? i.editInterviewDesc : i.logInterviewDesc}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="applicationId">{i.opportunity}</Label>
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

            <div className="space-y-2">
              <Label htmlFor="interviewDate">{i.interviewDate}</Label>
              <Input
                id="interviewDate"
                name="interviewDate"
                type="date"
                required
                defaultValue={
                  initial ? formatDateInput(initial.interviewDate) : undefined
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interviewType">{i.interviewType}</Label>
              <select
                id="interviewType"
                name="interviewType"
                required
                defaultValue={initial?.interviewType ?? "VIDEO"}
                className={selectClassName}
              >
                {INTERVIEW_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {translateInterviewType(type, t)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interviewer">{i.interviewer}</Label>
              <Input
                id="interviewer"
                name="interviewer"
                defaultValue={initial?.interviewer ?? ""}
                placeholder={i.interviewerPlaceholder}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="outcome">{i.outcome}</Label>
              <Input
                id="outcome"
                name="outcome"
                defaultValue={initial?.outcome ?? ""}
                placeholder={i.outcomePlaceholder}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lessonsLearned">{i.lessonsLearned}</Label>
            <textarea
              id="lessonsLearned"
              name="lessonsLearned"
              rows={3}
              defaultValue={initial?.lessonsLearned ?? ""}
              placeholder={i.lessonsLearnedPlaceholder}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{i.notes}</Label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={initial?.notes ?? ""}
              placeholder={i.notesPlaceholder}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="technicalQuestions">{i.technicalQuestionsLabel}</Label>
              <textarea
                id="technicalQuestions"
                name="technicalQuestions"
                rows={5}
                defaultValue={
                  initial ? questionsToText(initial.questions, "TECHNICAL") : ""
                }
                placeholder={i.questionsPlaceholder}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="behavioralQuestions">{i.behavioralQuestionsLabel}</Label>
              <textarea
                id="behavioralQuestions"
                name="behavioralQuestions"
                rows={5}
                defaultValue={
                  initial ? questionsToText(initial.questions, "BEHAVIORAL") : ""
                }
                placeholder={i.questionsPlaceholder}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs min-h-[120px]"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={submitting || deleting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? t.common.save : i.logInterview}
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
