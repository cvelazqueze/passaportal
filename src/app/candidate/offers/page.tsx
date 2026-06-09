import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { PageHeader } from "@/components/candidate/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2 } from "lucide-react";
import { getServerDictionary } from "@/lib/i18n/server";
function formatSalary(
  amount: number | null | undefined,
  currency: string,
  locale: string
) {
  if (!amount) return "—";
  const tag = locale === "es" ? "es-ES" : "en-US";
  return new Intl.NumberFormat(tag, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function OffersPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { locale, t } = await getServerDictionary();
  const o = t.offers;

  const profile = await db.candidateProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/auth/login");

  const offers = await db.offer.findMany({
    where: { application: { candidateProfileId: profile.id } },
    include: {
      application: { select: { title: true, company: true, id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const comparisonFields = [
    {
      key: "baseSalary",
      label: o.baseSalary,
      format: (offer: (typeof offers)[0]) =>
        formatSalary(offer.baseSalary, offer.currency, locale),
    },
    { key: "bonus", label: o.bonus, format: (offer: (typeof offers)[0]) => offer.bonus ?? t.common.empty },
    {
      key: "ptoDays",
      label: o.pto,
      format: (offer: (typeof offers)[0]) =>
        offer.ptoDays
          ? `${offer.ptoDays} ${t.common.days}`
          : t.common.empty,
    },
    {
      key: "remotePolicy",
      label: o.remote,
      format: (offer: (typeof offers)[0]) => offer.remotePolicy ?? t.common.empty,
    },
    {
      key: "contractType",
      label: o.contract,
      format: (offer: (typeof offers)[0]) => offer.contractType ?? t.common.empty,
    },
    {
      key: "equipment",
      label: o.equipment,
      format: (offer: (typeof offers)[0]) => offer.equipment ?? t.common.empty,
    },
    {
      key: "insurance",
      label: o.insurance,
      format: (offer: (typeof offers)[0]) => offer.insurance ?? t.common.empty,
    },
    {
      key: "flexibility",
      label: o.flexibility,
      format: (offer: (typeof offers)[0]) => offer.flexibility ?? t.common.empty,
    },
  ] as const;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={o.title}
          description={o.description}
          action={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {o.addOffer}
            </Button>
          }
        />

        {offers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">{o.noOffers}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {offers.map((offer) => (
                <Card key={offer.id} className={offer.isAccepted ? "border-success/50" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {offer.application.title}
                        </CardTitle>
                        <CardDescription>{offer.application.company}</CardDescription>
                      </div>
                      {offer.isAccepted && (
                        <Badge className="bg-success/10 text-success">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          {o.accepted}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{o.baseSalary}</span>
                      <span className="font-medium">
                        {formatSalary(offer.baseSalary, offer.currency, locale)}
                      </span>
                    </div>
                    {offer.bonus && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{o.bonus}</span>
                        <span>{offer.bonus}</span>
                      </div>
                    )}
                    {offer.ptoDays && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{o.pto}</span>
                        <span>
                          {offer.ptoDays} {t.common.days}
                        </span>
                      </div>
                    )}
                    {offer.remotePolicy && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{o.remote}</span>
                        <span>{offer.remotePolicy}</span>
                      </div>
                    )}
                    {offer.benefits.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-1">
                        {offer.benefits.map((b) => (
                          <Badge key={b} variant="outline" className="text-xs">{b}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {offers.length >= 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>{o.comparison}</CardTitle>
                  <CardDescription>{o.comparisonDesc}</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left font-medium text-muted-foreground">
                          {o.field}
                        </th>
                        {offers.map((offer) => (
                          <th key={offer.id} className="py-2 text-left font-medium px-4">
                            {offer.application.company}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonFields.map((field) => (
                        <tr key={field.key} className="border-b">
                          <td className="py-2 text-muted-foreground">{field.label}</td>
                          {offers.map((offer) => (
                            <td key={offer.id} className="py-2 px-4 font-medium">
                              {field.format(offer)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
