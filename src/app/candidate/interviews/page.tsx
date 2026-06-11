"use client";

import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { InterviewHub } from "@/components/candidate/interview-hub";

export default function InterviewHubPage() {
  return (
    <DashboardLayout>
      <InterviewHub />
    </DashboardLayout>
  );
}
