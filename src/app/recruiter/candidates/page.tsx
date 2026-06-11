"use client";

import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { CandidatesHub } from "@/components/recruiter/candidates-hub";

export default function RecruiterCandidatesPage() {
  return (
    <DashboardLayout>
      <CandidatesHub />
    </DashboardLayout>
  );
}
