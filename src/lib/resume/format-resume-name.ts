import type { ResumeData } from "./types";

export function getRegisteredName(data: ResumeData): string {
  return `${data.firstName} ${data.lastName}`.trim();
}

export function formatResumeName(
  data: ResumeData,
  options?: { uppercase?: boolean }
): string {
  const name = data.displayName?.trim() || getRegisteredName(data);
  return options?.uppercase ? name.toUpperCase() : name;
}
