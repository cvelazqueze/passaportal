"use client";

import { useCallback, useEffect, useState } from "react";
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
  ArrowDown,
  ArrowUp,
  Archive,
  ArchiveRestore,
  Loader2,
  Plus,
} from "lucide-react";
import { useT } from "@/components/locale-provider";
import { PIPELINE_COLOR_OPTIONS } from "@/lib/candidate/pipeline-colors";

export interface PipelineStageRow {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  isArchived: boolean;
  isSystemDefault: boolean;
}

interface PipelineSettingsProps {
  onStagesChange?: () => void;
}

export function PipelineSettings({ onStagesChange }: PipelineSettingsProps) {
  const t = useT();
  const o = t.opportunities;
  const [stages, setStages] = useState<PipelineStageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newStageName, setNewStageName] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadStages = useCallback(async () => {
    const res = await fetch("/api/candidate/pipeline-stages");
    const json = await res.json();
    if (res.ok) {
      setStages(json.stages ?? []);
    }
  }, []);

  useEffect(() => {
    loadStages().finally(() => setLoading(false));
  }, [loadStages]);

  async function handleAddStage(e: React.FormEvent) {
    e.preventDefault();
    const name = newStageName.trim();
    if (!name) return;

    setAdding(true);
    setError("");

    try {
      const res = await fetch("/api/candidate/pipeline-stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? o.stageAddFailed);
        return;
      }
      setNewStageName("");
      await loadStages();
      onStagesChange?.();
    } catch {
      setError(o.stageAddFailed);
    } finally {
      setAdding(false);
    }
  }

  async function updateStage(
    id: string,
    patch: Partial<Pick<PipelineStageRow, "name" | "color" | "isArchived">>
  ) {
    setBusyId(id);
    setError("");

    try {
      const res = await fetch(`/api/candidate/pipeline-stages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? o.stageUpdateFailed);
        return;
      }
      await loadStages();
      onStagesChange?.();
    } catch {
      setError(o.stageUpdateFailed);
    } finally {
      setBusyId(null);
    }
  }

  async function reorderStages(nextOrder: PipelineStageRow[]) {
    setBusyId("reorder");
    setError("");

    try {
      const res = await fetch("/api/candidate/pipeline-stages/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageIds: nextOrder.map((s) => s.id) }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? o.stageUpdateFailed);
        return;
      }
      setStages(nextOrder.map((s, i) => ({ ...s, sortOrder: i })));
      onStagesChange?.();
    } catch {
      setError(o.stageUpdateFailed);
    } finally {
      setBusyId(null);
    }
  }

  function moveStage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= stages.length) return;
    const next = [...stages];
    [next[index], next[target]] = [next[target], next[index]];
    void reorderStages(next);
  }

  const colorLabel = (key: string) =>
    o.pipelineColors[key as keyof typeof o.pipelineColors] ?? key;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">{o.loadingStages}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{o.pipelineSettings}</CardTitle>
        <CardDescription>{o.pipelineSettingsDesc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        <ul className="space-y-2">
          {stages.map((stage, index) => (
            <li
              key={stage.id}
              className={`flex flex-wrap items-center gap-2 rounded-lg border p-3 ${
                stage.isArchived ? "opacity-60" : ""
              }`}
            >
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={index === 0 || busyId !== null}
                  onClick={() => moveStage(index, -1)}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={index === stages.length - 1 || busyId !== null}
                  onClick={() => moveStage(index, 1)}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>

              <Input
                className="min-w-[140px] flex-1"
                defaultValue={stage.name}
                disabled={busyId === stage.id}
                onBlur={(e) => {
                  const name = e.target.value.trim();
                  if (name && name !== stage.name) {
                    void updateStage(stage.id, { name });
                  }
                }}
              />

              <select
                className="h-10 rounded-md border border-input bg-background px-2 text-sm"
                value={stage.color}
                disabled={busyId === stage.id}
                onChange={(e) => void updateStage(stage.id, { color: e.target.value })}
              >
                {PIPELINE_COLOR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {colorLabel(opt.key)}
                  </option>
                ))}
              </select>

              <span
                className={`hidden h-8 w-8 rounded md:inline-block ${stage.color}`}
                aria-hidden
              />

              {stage.isArchived ? (
                <Badge variant="secondary">{o.archived}</Badge>
              ) : null}

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busyId === stage.id}
                onClick={() =>
                  void updateStage(stage.id, { isArchived: !stage.isArchived })
                }
              >
                {busyId === stage.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : stage.isArchived ? (
                  <>
                    <ArchiveRestore className="mr-1 h-4 w-4" />
                    {o.restoreStage}
                  </>
                ) : (
                  <>
                    <Archive className="mr-1 h-4 w-4" />
                    {o.archiveStage}
                  </>
                )}
              </Button>
            </li>
          ))}
        </ul>

        <form onSubmit={handleAddStage} className="flex flex-wrap items-end gap-2">
          <div className="min-w-[200px] flex-1 space-y-1">
            <Label htmlFor="new-stage-name">{o.newStageName}</Label>
            <Input
              id="new-stage-name"
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              placeholder={o.newStageNamePlaceholder}
            />
          </div>
          <Button type="submit" disabled={adding || !newStageName.trim()}>
            {adding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {o.addStage}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground">{o.pipelineSettingsHint}</p>
      </CardContent>
    </Card>
  );
}
