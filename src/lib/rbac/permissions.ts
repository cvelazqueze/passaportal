import { UserRole } from "@prisma/client";

export const PERMISSIONS = {
  // Talent Passport
  PASSPORT_READ: "passport:read",
  PASSPORT_WRITE: "passport:write",
  PASSPORT_EXPORT: "passport:export",

  // Applications
  APPLICATION_READ: "application:read",
  APPLICATION_WRITE: "application:write",
  APPLICATION_MANAGE: "application:manage",

  // Jobs
  JOB_READ: "job:read",
  JOB_WRITE: "job:write",
  JOB_MANAGE: "job:manage",

  // Candidates
  CANDIDATE_READ: "candidate:read",
  CANDIDATE_WRITE: "candidate:write",
  CANDIDATE_SEARCH: "candidate:search",

  // Talent Pools
  POOL_READ: "pool:read",
  POOL_WRITE: "pool:write",
  POOL_MANAGE: "pool:manage",

  // Interviews
  INTERVIEW_READ: "interview:read",
  INTERVIEW_WRITE: "interview:write",
  INTERVIEW_SCHEDULE: "interview:schedule",

  // Feedback & Scorecards
  FEEDBACK_READ: "feedback:read",
  FEEDBACK_WRITE: "feedback:write",
  SCORECARD_WRITE: "scorecard:write",

  // Documents
  DOCUMENT_READ: "document:read",
  DOCUMENT_WRITE: "document:write",
  DOCUMENT_MANAGE: "document:manage",

  // Organization
  ORG_READ: "org:read",
  ORG_WRITE: "org:write",
  ORG_MANAGE: "org:manage",
  ORG_BILLING: "org:billing",

  // Users
  USER_READ: "user:read",
  USER_WRITE: "user:write",
  USER_MANAGE: "user:manage",

  // Platform
  PLATFORM_ADMIN: "platform:admin",
  PLATFORM_CONFIG: "platform:config",
  PLATFORM_AUDIT: "platform:audit",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.CANDIDATE]: [
    PERMISSIONS.PASSPORT_READ,
    PERMISSIONS.PASSPORT_WRITE,
    PERMISSIONS.PASSPORT_EXPORT,
    PERMISSIONS.APPLICATION_READ,
    PERMISSIONS.APPLICATION_WRITE,
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.DOCUMENT_WRITE,
    PERMISSIONS.INTERVIEW_READ,
    PERMISSIONS.FEEDBACK_READ,
  ],

  [UserRole.RECRUITER]: [
    PERMISSIONS.JOB_READ,
    PERMISSIONS.JOB_WRITE,
    PERMISSIONS.CANDIDATE_READ,
    PERMISSIONS.CANDIDATE_SEARCH,
    PERMISSIONS.APPLICATION_READ,
    PERMISSIONS.APPLICATION_MANAGE,
    PERMISSIONS.POOL_READ,
    PERMISSIONS.POOL_WRITE,
    PERMISSIONS.INTERVIEW_READ,
    PERMISSIONS.INTERVIEW_SCHEDULE,
    PERMISSIONS.FEEDBACK_READ,
    PERMISSIONS.FEEDBACK_WRITE,
    PERMISSIONS.SCORECARD_WRITE,
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.ORG_READ,
  ],

  [UserRole.HIRING_MANAGER]: [
    PERMISSIONS.JOB_READ,
    PERMISSIONS.CANDIDATE_READ,
    PERMISSIONS.APPLICATION_READ,
    PERMISSIONS.INTERVIEW_READ,
    PERMISSIONS.INTERVIEW_WRITE,
    PERMISSIONS.FEEDBACK_READ,
    PERMISSIONS.FEEDBACK_WRITE,
    PERMISSIONS.SCORECARD_WRITE,
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.ORG_READ,
  ],

  [UserRole.AGENCY_ADMIN]: [
    PERMISSIONS.JOB_READ,
    PERMISSIONS.JOB_WRITE,
    PERMISSIONS.JOB_MANAGE,
    PERMISSIONS.CANDIDATE_READ,
    PERMISSIONS.CANDIDATE_SEARCH,
    PERMISSIONS.APPLICATION_READ,
    PERMISSIONS.APPLICATION_MANAGE,
    PERMISSIONS.POOL_READ,
    PERMISSIONS.POOL_WRITE,
    PERMISSIONS.POOL_MANAGE,
    PERMISSIONS.INTERVIEW_READ,
    PERMISSIONS.INTERVIEW_SCHEDULE,
    PERMISSIONS.FEEDBACK_READ,
    PERMISSIONS.FEEDBACK_WRITE,
    PERMISSIONS.SCORECARD_WRITE,
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.DOCUMENT_MANAGE,
    PERMISSIONS.ORG_READ,
    PERMISSIONS.ORG_WRITE,
    PERMISSIONS.ORG_MANAGE,
    PERMISSIONS.ORG_BILLING,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_WRITE,
    PERMISSIONS.USER_MANAGE,
  ],

  [UserRole.PLATFORM_ADMIN]: Object.values(PERMISSIONS),
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

export function getRoleDashboardPath(role: UserRole): string {
  if (role === UserRole.CANDIDATE) {
    return "/candidate/dashboard";
  }
  return "/";
}
