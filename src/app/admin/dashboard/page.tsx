import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, Briefcase, BarChart3 } from "lucide-react";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const member = await db.organizationMember.findUnique({
    where: { userId: session.user.id },
    include: {
      organization: {
        include: {
          members: { include: { user: { select: { firstName: true, lastName: true, role: true } } } },
          subscription: true,
          _count: { select: { jobs: true, clients: true, talentPools: true } },
        },
      },
    },
  });

  const org = member?.organization;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Organization Dashboard</h2>
          <p className="text-muted-foreground">
            {org?.name ?? "Manage your organization"}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{org?.members.length ?? 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{org?._count.jobs ?? 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Clients</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{org?._count.clients ?? 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Talent Pools</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{org?._count.talentPools ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Your organization&apos;s team</CardDescription>
            </CardHeader>
            <CardContent>
              {org?.members.length === 0 ? (
                <p className="text-sm text-muted-foreground">No team members yet.</p>
              ) : (
                <div className="space-y-3">
                  {org?.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">
                          {m.user.firstName} {m.user.lastName}
                        </p>
                      </div>
                      <Badge variant="secondary">{m.role.replace(/_/g, " ")}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Your current plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Plan</span>
                  <Badge>{org?.subscription?.plan ?? "FREE"}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="success">{org?.subscription?.status ?? "TRIALING"}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
