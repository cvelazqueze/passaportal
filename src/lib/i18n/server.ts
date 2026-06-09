import { cookies } from "next/headers";
import { getDictionary, isLocale, type Locale } from "./index";
import { LOCALE_COOKIE } from "./constants";

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : "en";
}

export async function getServerDictionary() {
  const locale = await getServerLocale();
  return { locale, t: getDictionary(locale) };
}
