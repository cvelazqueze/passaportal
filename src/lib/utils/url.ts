export function normalizeProfileUrl(value?: string | null): string | undefined {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (
    trimmed.startsWith("linkedin.com") ||
    trimmed.startsWith("github.com") ||
    trimmed.startsWith("www.")
  ) {
    return `https://${trimmed}`;
  }
  return trimmed;
}
