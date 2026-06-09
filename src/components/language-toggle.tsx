"use client";

import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { Languages } from "lucide-react";

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();

  function toggle() {
    const next: Locale = locale === "en" ? "es" : "en";
    setLocale(next);
  }

  const nextLabel = locale === "en" ? "ES" : "EN";

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={locale === "en" ? t.common.switchToSpanish : t.common.switchToEnglish}
      onClick={toggle}
      className="gap-1.5 px-2 font-medium text-foreground hover:text-brand-blue"
    >
      <Languages className="h-4 w-4 text-brand-purple" />
      <span className="text-muted-foreground">{locale.toUpperCase()}</span>
      <span className="text-muted-foreground/50">/</span>
      <span className="font-semibold text-brand-blue">{nextLabel}</span>
    </Button>
  );
}
