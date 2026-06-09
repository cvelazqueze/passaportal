"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Printer } from "lucide-react";
import { useT } from "@/components/locale-provider";

interface ResumeExportActionsProps {
  resumeId?: string;
  resumeName?: string;
}

export function ResumeExportActions({ resumeId, resumeName }: ResumeExportActionsProps) {
  const t = useT();
  const [downloading, setDownloading] = useState(false);

  function openPrintPage() {
    const params = new URLSearchParams({ auto: "1" });
    if (resumeId) params.set("resumeId", resumeId);
    window.open(`/candidate/resumes/print?${params.toString()}`, "_blank", "noopener,noreferrer");
  }

  async function downloadDocx() {
    setDownloading(true);
    try {
      const params = new URLSearchParams({ format: "docx" });
      if (resumeId) params.set("resumeId", resumeId);
      const res = await fetch(`/api/candidate/resumes/export?${params.toString()}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download =
        res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ??
        `${(resumeName ?? "resume").replace(/\s+/g, "_")}.docx`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Export failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={openPrintPage}>
        <Printer className="mr-2 h-4 w-4" />
        {t.resumeHub.printSavePdf}
      </Button>
      <Button variant="outline" size="sm" onClick={downloadDocx} disabled={downloading}>
        {downloading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        {t.resumeHub.exportDocx}
      </Button>
    </div>
  );
}
