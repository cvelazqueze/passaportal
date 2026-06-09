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
import { Loader2, Plus, Columns3 } from "lucide-react";
import { useT } from "@/components/locale-provider";
import { PIPELINE_COLOR_OPTIONS } from "@/lib/candidate/pipeline-colors";

interface PipelineSetupProps {
  onStageAdded: () => void;
}

export function PipelineSetup({ onStageAdded }: PipelineSetupProps) {
  const t = useT();
  const o = t.opportunities;
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  async function addStage(stageName: string) {
    const trimmed = stageName.trim();
    if (!trimmed) return;

    setAdding(true);
    setError("");

    try {
      const res = await fetch("/api/candidate/pipeline-stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          color: PIPELINE_COLOR_OPTIONS[0]?.value,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? o.stageAddFailed);
        return;
      }
      setName("");
      onStageAdded();
    } catch {
      setError(o.stageAddFailed);
    } finally {
      setAdding(false);
    }
  }

  return (
    <Card className="border-dashed border-primary/40 bg-muted/30">
      <CardHeader className="text-center sm:text-left">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl brand-gradient sm:mx-0">
          <Columns3 className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="mt-4">{o.pipelineSetupTitle}</CardTitle>
        <CardDescription>{o.pipelineSetupDesc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void addStage(name);
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={o.newStageNamePlaceholder}
            disabled={adding}
          />
          <Button type="submit" disabled={adding || !name.trim()} className="shrink-0">
            {adding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {o.addFirstColumn}
          </Button>
        </form>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            {o.quickAddColumns}
          </p>
          <div className="flex flex-wrap gap-2">
            {o.pipelineSuggestions.map((suggestion) => (
              <Button
                key={suggestion}
                type="button"
                variant="outline"
                size="sm"
                disabled={adding}
                onClick={() => void addStage(suggestion)}
              >
                + {suggestion}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AddPipelineColumnProps {
  onStageAdded: () => void;
}

export function AddPipelineColumn({ onStageAdded }: AddPipelineColumnProps) {
  const t = useT();
  const o = t.opportunities;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setAdding(true);
    try {
      const res = await fetch("/api/candidate/pipeline-stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        setName("");
        setOpen(false);
        onStageAdded();
      }
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex w-[min(85vw,260px)] shrink-0 snap-start flex-col sm:w-[260px]">
      {open ? (
        <form
          onSubmit={handleAdd}
          className="flex min-h-[180px] flex-col gap-2 rounded-lg border-2 border-dashed border-primary/40 bg-muted/20 p-3"
        >
          <Label htmlFor="new-column-name" className="text-xs">
            {o.newStageName}
          </Label>
          <Input
            id="new-column-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={o.newStageNamePlaceholder}
            autoFocus
            disabled={adding}
          />
          <div className="mt-auto flex gap-2">
            <Button type="submit" size="sm" disabled={adding || !name.trim()}>
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : o.addStage}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={adding}
            >
              {t.common.cancel}
            </Button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/10 p-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/20 hover:text-foreground"
        >
          <Plus className="h-5 w-5" />
          {o.addColumn}
        </button>
      )}
    </div>
  );
}
