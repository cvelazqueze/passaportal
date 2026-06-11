export const CANDIDATE_APP_DASHBOARD = "/candidate/dashboard";

const DISABLED_PREFIXES = [
  "/recruiter",
  "/hiring-manager",
  "/admin",
  "/platform",
  "/api/recruiter",
];

export function isCandidateRole(role: string | undefined | null): boolean {
  return role === "CANDIDATE";
}

export function getCandidateDashboardPath(
  role: string | undefined | null
): string | null {
  return isCandidateRole(role) ? CANDIDATE_APP_DASHBOARD : null;
}

export function isDisabledAppPath(pathname: string): boolean {
  return DISABLED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function isAllowedAppPath(pathname: string): boolean {
  if (pathname.startsWith("/api/candidate")) return true;
  if (pathname.startsWith("/candidate")) return true;
  return false;
}

export function isAllowedCallbackUrl(url: string): boolean {
  return url.startsWith("/candidate") && !url.startsWith("//");
}
