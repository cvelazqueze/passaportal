"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useT } from "@/components/locale-provider";
import styles from "./ats-resume-print.module.css";

export function ResumePrintToolbar() {
  const t = useT();

  return (
    <div className={styles.toolbar}>
      <Button size="sm" variant="ghost" asChild>
        <Link href="/candidate/resumes">← {t.resumeHub.backToResumeHub}</Link>
      </Button>
      <Button size="sm" variant="outline" onClick={() => window.print()}>
        <Printer className="mr-2 h-4 w-4" />
        {t.resumeHub.print}
      </Button>
    </div>
  );
}
