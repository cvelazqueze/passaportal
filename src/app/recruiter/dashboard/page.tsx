"use client";

import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { RecruiterDashboard } from "@/components/recruiter/recruiter-dashboard";

export default function RecruiterDashboardPage() {
  return (
    <DashboardLayout>
      <RecruiterDashboard />
    </DashboardLayout>
  );
}
