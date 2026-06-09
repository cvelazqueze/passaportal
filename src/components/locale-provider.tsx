"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  startTransition,
} from "react";
import { useRouter } from "next/navigation";
import { getDictionary, type Dictionary, type Locale } from "@/lib/i18n";
import { LOCALE_COOKIE } from "@/lib/i18n/constants";

interface LocaleContextValue {
  locale: Locale;
  t: Dictionary;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readCookieLocale(): Locale {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(new RegExp(`${LOCALE_COOKIE}=([^;]+)`));
  return match?.[1] === "es" ? "es" : "en";
}

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    const cookieLocale = readCookieLocale();
    if (cookieLocale !== initialLocale) {
      setLocaleState(cookieLocale);
    }
    document.documentElement.lang = cookieLocale;
  }, [initialLocale]);

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;

      document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;SameSite=Lax`;
      document.documentElement.lang = next;
      setLocaleState(next);

      startTransition(() => {
        router.refresh();
      });
    },
    [locale, router]
  );

  const t = getDictionary(locale);

  return (
    <LocaleContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

export function useT() {
  return useLocale().t;
}
