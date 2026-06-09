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

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={locale === "en" ? t.common.switchToSpanish : t.common.switchToEnglish}
      onClick={toggle}
      className="gap-1.5 px-2 font-medium"
    >
      <Languages className="h-4 w-4" />
      {locale === "en" ? "ES" : "EN"}
    </Button>
  );
}
