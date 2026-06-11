"use client";

import { use } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { CandidateDetail } from "@/components/recruiter/candidate-detail";

export default function RecruiterCandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <DashboardLayout>
      <CandidateDetail id={id} />
    </DashboardLayout>
  );
}
