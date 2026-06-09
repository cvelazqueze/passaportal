import { db } from "@/lib/db";
import { DEFAULT_REJECTION_REASONS } from "@/lib/candidate/defaults";

export async function initializeCandidateWorkspace(
  candidateProfileId: string,
  talentPassportId: string
) {
  await db.rejectionReason.createMany({
    data: DEFAULT_REJECTION_REASONS.map((label) => ({
      candidateProfileId,
      label,
      isSystemDefault: true,
    })),
  });

  await db.resumeVersion.create({
    data: {
      talentPassportId,
      name: "Master Resume",
      template: "ATS",
      isMaster: true,
      isDefault: true,
      targetRole: "General",
    },
  });
}
