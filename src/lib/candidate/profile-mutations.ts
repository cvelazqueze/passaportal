import { requireCandidateProfile } from "@/lib/candidate/context";
import { computeAndSaveProfileCompleteness } from "@/lib/candidate/profile-completeness";

export async function getPassportId() {
  const { profile } = await requireCandidateProfile();
  const passportId = profile.talentPassport?.id;
  if (!passportId) throw new Error("Profile not found");
  return passportId;
}

export async function afterProfileMutation(talentPassportId: string) {
  return computeAndSaveProfileCompleteness(talentPassportId);
}
