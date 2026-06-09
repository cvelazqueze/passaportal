"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import type { Dictionary } from "@/lib/i18n";

const TEMPLATE_IDS = ["ATS", "TECHNICAL", "EXECUTIVE", "MODERN"] as const;

interface TemplateGridProps {
  activeTemplate?: string;
}

export function TemplateGrid({ activeTemplate }: TemplateGridProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function apply(template: string, openPrint: boolean) {
    setLoadingId(template);
    try {
      const res = await fetch("/api/candidate/resumes/template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      if (openPrint) {
        window.open("/candidate/resumes/print?auto=1", "_blank", "noopener,noreferrer");
      }
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {TEMPLATE_IDS.map((id) => {
        const meta = t.templates[id as keyof Dictionary["templates"]];
        const isActive = activeTemplate === id;
        const canPrint =
          id === "ATS" ||
          id === "TECHNICAL" ||
          id === "MODERN" ||
          id === "EXECUTIVE";

        return (
          <div
            key={id}
            className={`rounded-lg border bg-card transition-colors ${
              isActive ? "border-primary ring-1 ring-primary/30" : "hover:border-primary"
            }`}
          >
            <div className="flex h-24 items-center justify-center rounded-t-lg bg-muted">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {id}
              </span>
            </div>
            <div className="p-4">
              <h4 className="font-semibold">{meta.name}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>
              <Button
                variant={isActive ? "default" : "outline"}
                size="sm"
                className="mt-3 w-full"
                disabled={loadingId === id}
                onClick={() => apply(id, canPrint)}
              >
                {loadingId === id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {canPrint ? t.resumeHub.useAndPrint : t.resumeHub.useTemplate}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
