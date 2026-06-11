"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/candidate/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, TrendingDown, Pencil } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { translatePipelineStage } from "@/lib/i18n/helpers";
import {
  RejectionForm,
  type RejectionRecord,
  type RejectionReason,
  type OpportunityOption,
} from "@/components/candidate/rejection-form";

interface RejectionInsights {
  total: number;
  byStage: { stage: string; count: number }[];
  byReason: { reason: string; count: number }[];
}

interface PipelineStage {
  id: string;
  name: string;
}

function buildInsights(records: RejectionRecord[]): RejectionInsights {
  const byStage = new Map<string, number>();
  const byReason = new Map<string, number>();

  for (const r of records) {
    const stage = r.stageName ?? "Unknown";
    byStage.set(stage, (byStage.get(stage) ?? 0) + 1);
    const reason = r.reason?.label ?? "Unspecified";
    byReason.set(reason, (byReason.get(reason) ?? 0) + 1);
  }

  return {
    total: records.length,
    byStage: Array.from(byStage.entries())
      .map(([stage, count]) => ({ stage, count }))
      .sort((a, b) => b.count - a.count),
    byReason: Array.from(byReason.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export function RejectionHub() {
  const { t, locale } = useLocale();
  const r = t.rejections;
  const dateLocale = locale === "es" ? "es-ES" : "en-US";

  const [records, setRecords] = useState<RejectionRecord[]>([]);
  const [reasons, setReasons] = useState<RejectionReason[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityOption[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const insights = useMemo(() => buildInsights(records), [records]);

  const loadData = useCallback(async () => {
    const [rejectionsRes, opportunitiesRes] = await Promise.all([
      fetch("/api/candidate/rejections"),
      fetch("/api/candidate/opportunities"),
    ]);

    if (rejectionsRes.ok) {
      const json = await rejectionsRes.json();
      setRecords(json.records ?? []);
      setReasons(json.reasons ?? []);
    }

    if (opportunitiesRes.ok) {
      const json = await opportunitiesRes.json();
      setOpportunities(json.opportunities ?? []);
      setStages(json.stages ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const editingRecord = editingId
    ? records.find((rec) => rec.id === editingId)
    : undefined;

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  function handleRecordSaved(record: RejectionRecord) {
    setRecords((prev) => {
      const idx = prev.findIndex((rec) => rec.id === record.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = record;
        return next.sort(
          (a, b) =>
            new Date(b.rejectedAt).getTime() - new Date(a.rejectedAt).getTime()
        );
      }
      return [record, ...prev].sort(
        (a, b) =>
          new Date(b.rejectedAt).getTime() - new Date(a.rejectedAt).getTime()
      );
    });
    closeForm();
  }

  function handleRecordDeleted() {
    if (!editingId) return;
    setRecords((prev) => prev.filter((rec) => rec.id !== editingId));
    closeForm();
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t.common.loading}</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={r.title}
        description={r.description}
        action={
          !showForm && !editingId ? (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {r.logRejection}
            </Button>
          ) : undefined
        }
      />

      {(showForm || editingId) && (
        <RejectionForm
          mode={editingId ? "edit" : "add"}
          opportunities={opportunities}
          reasons={reasons}
          stages={stages}
          initial={editingRecord}
          onSuccess={handleRecordSaved}
          onCancel={closeForm}
          onDelete={editingId ? handleRecordDeleted : undefined}
        />
      )}

      {opportunities.length === 0 && !showForm && !editingId && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{r.noOpportunitiesDesc}</p>
            <Button asChild variant="link" className="mt-2 h-auto p-0">
              <Link href="/candidate/opportunities">{r.addOpportunityFirst}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{r.totalRejections}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{r.mostCommonStage}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {insights.byStage[0]?.stage
                ? translatePipelineStage(insights.byStage[0].stage, t)
                : t.common.empty}
            </div>
            {insights.byStage[0] && (
              <p className="text-xs text-muted-foreground">
                {insights.byStage[0].count} {t.common.occurrences}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{r.topReason}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {insights.byReason[0]?.reason ?? t.common.empty}
            </div>
            {insights.byReason[0] && (
              <p className="text-xs text-muted-foreground">
                {insights.byReason[0].count} {t.common.times}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              {r.byStage}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights.byStage.length === 0 ? (
              <p className="text-sm text-muted-foreground">{r.noStageData}</p>
            ) : (
              <div className="space-y-3">
                {insights.byStage.map((item) => (
                  <div key={item.stage} className="flex items-center justify-between">
                    <span className="text-sm">
                      {translatePipelineStage(item.stage, t)}
                    </span>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{r.reasons}</CardTitle>
          </CardHeader>
          <CardContent>
            {insights.byReason.length === 0 ? (
              <p className="text-sm text-muted-foreground">{r.reasonsDesc}</p>
            ) : (
              <div className="space-y-3">
                {insights.byReason.map((item) => (
                  <div key={item.reason} className="flex items-center justify-between">
                    <span className="text-sm">{item.reason}</span>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{r.recent}</CardTitle>
          <CardDescription>{r.recentDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground">{r.noRejections}</p>
          ) : (
            <div className="space-y-3">
              {records.map((rej) => (
                <div key={rej.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {rej.application.title}
                        {rej.application.company ? ` — ${rej.application.company}` : ""}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(rej.rejectedAt).toLocaleDateString(dateLocale)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(rej.id);
                      }}
                      aria-label={r.editRejection}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {rej.stageName && (
                      <Badge variant="outline">
                        {translatePipelineStage(rej.stageName, t)}
                      </Badge>
                    )}
                    {rej.reason && (
                      <Badge variant="secondary">{rej.reason.label}</Badge>
                    )}
                  </div>
                  {rej.candidateNotes && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {rej.candidateNotes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
