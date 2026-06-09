import { enDict } from "./dictionaries/en";
import { esDict } from "./dictionaries/es";
import type { Dictionary, Locale } from "./types";

const dictionaries: Record<Locale, Dictionary> = { en: enDict, es: esDict };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.en;
}

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "es";
}

export function interpolate(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    String(vars[key] ?? `{${key}}`)
  );
}

export type { Locale, Dictionary };
