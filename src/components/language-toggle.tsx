"use client";

import { useLocale } from "@/components/locale-provider";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Languages } from "lucide-react";

const LOCALE_OPTIONS: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];

type LanguageToggleVariant = "header" | "sidebar";

export function LanguageToggle({
  variant = "header",
  className,
}: {
  variant?: LanguageToggleVariant;
  className?: string;
}) {
  const { locale, setLocale, t } = useLocale();

  if (variant === "sidebar") {
    return (
      <div
        className={cn(
          "rounded-lg border border-border/80 bg-muted/40 p-3",
          className
        )}
      >
        <label
          htmlFor="sidebar-language"
          className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          <Languages className="h-3.5 w-3.5 text-brand-purple" aria-hidden />
          {t.common.language}
        </label>
        <select
          id="sidebar-language"
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          aria-label={t.common.language}
          className="flex h-10 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        >
          {LOCALE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <label
      className={cn(
        "inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-2.5 text-sm shadow-sm transition-colors hover:bg-muted/50 sm:px-3",
        className
      )}
    >
      <Languages className="h-4 w-4 shrink-0 text-brand-purple" aria-hidden />
      <span className="hidden font-medium text-muted-foreground sm:inline">
        {t.common.language}
      </span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        aria-label={t.common.language}
        className="max-w-[6.5rem] cursor-pointer bg-transparent py-1 text-sm font-semibold text-foreground outline-none sm:max-w-none"
      >
        {LOCALE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
