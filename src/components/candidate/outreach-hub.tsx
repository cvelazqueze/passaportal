"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/candidate/page-header";
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
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Mail,
  FileText,
  Sparkles,
  Save,
  Trash2,
  Clock,
} from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { interpolate } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { OutreachKind } from "@prisma/client";

type KindTab = OutreachKind;

interface OpportunityOption {
  id: string;
  title: string | null;
  company: string | null;
  recruiterName: string | null;
  recruiterContact: string | null;
}

interface SavedDraft {
  id: string;
  kind: OutreachKind;
  jobTitle: string;
  company: string;
  recipientName: string | null;
  recipientEmail: string | null;
  subject: string | null;
  body: string;
  updatedAt: string;
  application?: { id: string; title: string | null; company: string | null } | null;
}

const KINDS: KindTab[] = ["COVER_LETTER", "APPLICATION_EMAIL", "FOLLOW_UP_EMAIL"];

export function OutreachHub() {
  const { t, locale } = useLocale();
  const searchParams = useSearchParams();
  const o = t.outreach;
  const dateLocale = locale === "es" ? "es-ES" : "en-US";

  const [activeKind, setActiveKind] = useState<KindTab>("COVER_LETTER");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [matchingSkills, setMatchingSkills] = useState<string[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityOption[]>([]);
  const [drafts, setDrafts] = useState<SavedDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);

  const loadLists = useCallback(async () => {
    const [oppRes, draftsRes] = await Promise.all([
      fetch("/api/candidate/opportunities"),
      fetch("/api/candidate/outreach"),
    ]);

    if (oppRes.ok) {
      const json = await oppRes.json();
      setOpportunities(
        (json.opportunities ?? []).map(
          (item: {
            id: string;
            title: string | null;
            company: string | null;
            recruiterName: string | null;
            recruiterContact: string | null;
          }) => ({
            id: item.id,
            title: item.title,
            company: item.company,
            recruiterName: item.recruiterName,
            recruiterContact: item.recruiterContact,
          })
        )
      );
    }

    if (draftsRes.ok) {
      const json = await draftsRes.json();
      setDrafts(json.drafts ?? []);
    }

    setListLoading(false);
  }, []);

  useEffect(() => {
    void loadLists();
  }, [loadLists]);

  useEffect(() => {
    const title = searchParams.get("jobTitle");
    const co = searchParams.get("company");
    if (title) setJobTitle(title);
    if (co) setCompany(co);
  }, [searchParams]);

  function kindLabel(kind: KindTab): string {
    if (kind === "COVER_LETTER") return o.coverLetter;
    if (kind === "APPLICATION_EMAIL") return o.applicationEmail;
    return o.followUpEmail;
  }

  function applyOpportunity(id: string) {
    const opp = opportunities.find((item) => item.id === id);
    if (!opp) return;
    if (opp.title) setJobTitle(opp.title);
    if (opp.company) setCompany(opp.company);
    if (opp.recruiterName) setRecipientName(opp.recruiterName);
    if (opp.recruiterContact?.includes("@")) setRecipientEmail(opp.recruiterContact);
  }

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function loadDraft(draft: SavedDraft) {
    setEditingDraftId(draft.id);
    setActiveKind(draft.kind);
    setJobTitle(draft.jobTitle);
    setCompany(draft.company);
    setRecipientName(draft.recipientName ?? "");
    setRecipientEmail(draft.recipientEmail ?? "");
    setSubject(draft.subject ?? "");
    setBody(draft.body);
    setApplicationId(draft.application?.id ?? "");
    setDescription("");
    setMatchingSkills([]);
    clearMessages();
  }

  function resetEditor() {
    setEditingDraftId(null);
    setSubject("");
    setBody("");
    setMatchingSkills([]);
    clearMessages();
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    clearMessages();
    setCopied(false);

    try {
      const res = await fetch("/api/candidate/outreach/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: activeKind,
          jobTitle,
          company,
          description: description || undefined,
          recipientName: recipientName || undefined,
          recipientEmail: recipientEmail || undefined,
          applicationId: applicationId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? o.generateFailed);
        return;
      }
      setSubject(json.subject ?? "");
      setBody(json.body ?? "");
      setMatchingSkills(json.matchingSkills ?? []);
      setEditingDraftId(null);
    } catch {
      setError(o.generateFailed);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!body.trim()) return;
    setSaving(true);
    clearMessages();

    const payload = {
      kind: activeKind,
      jobTitle,
      company,
      recipientName: recipientName || undefined,
      recipientEmail: recipientEmail || undefined,
      subject: subject || undefined,
      body,
      applicationId: applicationId || null,
    };

    try {
      const res = editingDraftId
        ? await fetch(`/api/candidate/outreach/${editingDraftId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/candidate/outreach", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? o.saveFailed);
        return;
      }

      setEditingDraftId(json.draft.id);
      setSuccess(editingDraftId ? o.draftUpdated : o.draftSaved);
      await loadLists();
    } catch {
      setError(o.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(o.deleteConfirm)) return;
    clearMessages();
    const res = await fetch(`/api/candidate/outreach/${id}`, { method: "DELETE" });
    if (res.ok) {
      if (editingDraftId === id) resetEditor();
      await loadLists();
    } else {
      setError(o.deleteFailed);
    }
  }

  async function handleCopy() {
    const text =
      activeKind !== "COVER_LETTER" && subject
        ? `Subject: ${subject}\n\n${body}`
        : body;
    clearMessages();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(o.copyFailed);
    }
  }

  const showEmailFields = activeKind !== "COVER_LETTER";

  return (
    <div className="space-y-6">
      <PageHeader title={o.title} description={o.description} />

      <div className="flex flex-wrap gap-2">
        {KINDS.map((kind) => (
          <Button
            key={kind}
            type="button"
            variant={activeKind === kind ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setActiveKind(kind);
              resetEditor();
            }}
          >
            {kind === "COVER_LETTER" && <FileText className="mr-2 h-4 w-4" />}
            {kind === "APPLICATION_EMAIL" && <Mail className="mr-2 h-4 w-4" />}
            {kind === "FOLLOW_UP_EMAIL" && <Clock className="mr-2 h-4 w-4" />}
            {kindLabel(kind)}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              {o.jobContext}
            </CardTitle>
            <CardDescription>{o.jobContextDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                  {success}
                </div>
              )}

              {opportunities.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="opportunity">{o.linkOpportunity}</Label>
                  <select
                    id="opportunity"
                    value={applicationId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setApplicationId(id);
                      if (id) applyOpportunity(id);
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">{o.noOpportunitySelected}</option>
                    {opportunities.map((opp) => (
                      <option key={opp.id} value={opp.id}>
                        {opp.title ?? o.untitledRole} {t.common.at}{" "}
                        {opp.company ?? t.common.unknown}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">{o.jobTitle}</Label>
                  <Input
                    id="jobTitle"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder={o.jobTitlePlaceholder}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">{o.company}</Label>
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder={o.companyPlaceholder}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="recipientName">{o.recipientName}</Label>
                  <Input
                    id="recipientName"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder={o.recipientNamePlaceholder}
                  />
                </div>
                {showEmailFields && (
                  <div className="space-y-2">
                    <Label htmlFor="recipientEmail">{o.recipientEmail}</Label>
                    <Input
                      id="recipientEmail"
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder={o.recipientEmailPlaceholder}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{o.jobDescription}</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder={o.jobDescriptionPlaceholder}
                />
                <p className="text-xs text-muted-foreground">{o.jobDescriptionHint}</p>
              </div>

              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? o.generating : o.generate}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{kindLabel(activeKind)}</CardTitle>
            <CardDescription>{o.editorDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!body ? (
              <p className="text-sm text-muted-foreground">{o.emptyEditor}</p>
            ) : (
              <>
                {matchingSkills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">{o.skillsUsed}</p>
                    <div className="flex flex-wrap gap-1">
                      {matchingSkills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {showEmailFields && (
                  <div className="space-y-2">
                    <Label htmlFor="subject">{o.subject}</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="body">{o.content}</Label>
                  <textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={16}
                    className={cn(
                      "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono leading-relaxed",
                      body.includes("[Add") || body.includes("[Agrega")
                        ? "ring-1 ring-amber-500/40"
                        : ""
                    )}
                  />
                  <p className="text-xs text-muted-foreground">{o.placeholderHint}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleCopy()}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    {copied ? o.copied : o.copy}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleSave()}
                    disabled={saving || !body.trim()}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? o.saving : editingDraftId ? o.updateDraft : o.saveDraft}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{o.savedDrafts}</CardTitle>
          <CardDescription>{o.savedDraftsDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          {listLoading ? (
            <p className="text-sm text-muted-foreground">{t.common.loading}</p>
          ) : drafts.length === 0 ? (
            <p className="text-sm text-muted-foreground">{o.noDrafts}</p>
          ) : (
            <ul className="space-y-2">
              {drafts.map((draft) => {
                const isActive = editingDraftId === draft.id;
                return (
                  <li key={draft.id}>
                    <div
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-lg border p-3",
                        isActive && "border-primary bg-primary/5"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => loadDraft(draft)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="font-medium truncate">
                          {kindLabel(draft.kind)} — {draft.jobTitle} {t.common.at}{" "}
                          {draft.company}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {interpolate(o.updatedOn, {
                            date: new Date(draft.updatedAt).toLocaleDateString(dateLocale),
                          })}
                        </p>
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDelete(draft.id);
                        }}
                        aria-label={t.common.delete}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {opportunities.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {o.noOpportunitiesHint}{" "}
          <Link href="/candidate/opportunities" className="text-primary hover:underline">
            {o.goToOpportunities}
          </Link>
        </p>
      )}
    </div>
  );
}
