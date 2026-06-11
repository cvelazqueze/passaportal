"use client";

import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { PoolsHub } from "@/components/recruiter/pools-hub";

export default function RecruiterPoolsPage() {
  return (
    <DashboardLayout>
      <PoolsHub />
    </DashboardLayout>
  );
}
