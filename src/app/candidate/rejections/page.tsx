"use client";

import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { RejectionHub } from "@/components/candidate/rejection-hub";

export default function RejectionsPage() {
  return (
    <DashboardLayout>
      <RejectionHub />
    </DashboardLayout>
  );
}
